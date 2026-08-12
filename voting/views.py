from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from drf_spectacular.utils import extend_schema

from .models import CustomUser, Candidate, Vote, ElectionConfig
from .serializers import (
    LoginSerializer,
    RegisterSerializer,
    CandidateSerializer,
    VoteSerializer,
)


# 1. ─── STANDARD LOGIN VIEW (Username + Password) ───
class StandardLoginView(APIView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    @extend_schema(request=LoginSerializer)
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        username = serializer.validated_data.get("username")
        password = serializer.validated_data.get("password")

        user = authenticate(username=username, password=password)

        if not user:
            return Response(
                {"detail": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "username": user.username,
            "has_voted": getattr(user, 'has_voted', False)
        }, status=status.HTTP_200_OK)


# 2. ─── REGISTER VIEW (Simple Username & Password) ───
class RegisterView(APIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    @extend_schema(request=RegisterSerializer)
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(
            {"message": "User registered successfully! Please log in."},
            status=status.HTTP_201_CREATED
        )


# 3. ─── CANDIDATE LIST VIEW ───
class CandidateListView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(responses={200: CandidateSerializer(many=True)})
    def get(self, request):
        candidates = Candidate.objects.all()
        serializer = CandidateSerializer(candidates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# 4. ─── VOTE CAST VIEW (With 5:00 PM & Manual Declaration Check) ───
class CastVoteView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = VoteSerializer

    @extend_schema(request=VoteSerializer)
    def post(self, request):
        config = ElectionConfig.objects.first()

        # Check if voting period has ended automatically (5 PM) or manually declared by Admin
        if config and config.is_voting_closed():
            return Response(
                {"error": "Voting period has ended! Results have been declared or deadline (5:00 PM) passed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = VoteSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        candidate_id = serializer.validated_data.get('candidate_id')

        try:
            candidate = Candidate.objects.get(id=candidate_id)
        except Candidate.DoesNotExist:
            return Response(
                {"error": "Candidate not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        user = request.user

        # Create Vote Record & Increment Counter
        Vote.objects.create(voter=user, candidate=candidate)
        candidate.vote_count += 1
        candidate.save()

        user.has_voted = True
        user.save()

        return Response(
            {"message": "Vote casted successfully!"},
            status=status.HTTP_200_OK
        )


# 5. ─── ELECTION RESULT VIEW (Fetch Results / Admin Manual Declaration) ───
@extend_schema(methods=['GET', 'POST'], responses={200: None})
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def election_result_view(request):
    config = ElectionConfig.objects.first()

    # GET Method: Results view karne ke liye
    if request.method == 'GET':
        candidates = Candidate.objects.all()
        if not candidates.exists():
            return Response({"message": "No candidates found."}, status=status.HTTP_404_NOT_FOUND)

        result_data = []
        winner = None
        max_votes = -1
        is_draw = False

        for candidate in candidates:
            vote_count = candidate.vote_count
            result_data.append({
                "id": candidate.id,
                "name": candidate.name,
                "party": getattr(candidate, 'party', ''),
                "votes": vote_count
            })

            if vote_count > max_votes:
                max_votes = vote_count
                winner = candidate
                is_draw = False
            elif vote_count == max_votes and max_votes > 0:
                is_draw = True

        gap_message = "No clear gap."
        if len(result_data) >= 2:
            sorted_results = sorted(result_data, key=lambda x: x['votes'], reverse=True)
            highest_vote = sorted_results[0]['votes']
            second_highest_vote = sorted_results[1]['votes']
            vote_gap = highest_vote - second_highest_vote

            if is_draw:
                gap_message = "The election is currently a tie!"
            else:
                gap_message = f"{sorted_results[0]['name']} is leading/won by {vote_gap} votes from the runner-up!"

        winner_name = "Draw / No Votes Yet" if is_draw or max_votes <= 0 else winner.name
        is_closed = config.is_voting_closed() if config else False

        return Response({
            "results": result_data,
            "winner": winner_name,
            "gap_message": gap_message,
            "is_declared": config.is_declared if config else False,
            "is_voting_closed": is_closed,
            "total_votes_polled": Vote.objects.count()
        }, status=status.HTTP_200_OK)

    # POST Method: Admin manual declaration button ke liye
    elif request.method == 'POST':
        candidates = Candidate.objects.all()
        winner = None
        max_votes = -1
        is_draw = False

        for candidate in candidates:
            vote_count = candidate.vote_count
            if vote_count > max_votes:
                max_votes = vote_count
                winner = candidate
                is_draw = False
            elif vote_count == max_votes and max_votes > 0:
                is_draw = True

        if is_draw or max_votes <= 0:
            return Response(
                {"error": "Cannot declare winner. It's a tie or no votes casted yet."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if config:
            config.is_declared = True
            config.save()

        return Response({
            "status": "success",
            "message": f"Result declared manually! Winner: {winner.name}"
        }, status=status.HTTP_200_OK)