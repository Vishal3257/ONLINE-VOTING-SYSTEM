from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.core.mail import send_mail
from django.conf import settings
from .models import Candidate, Vote
from .serializers import CandidateSerializer, VoteSerializer
from .serializers import RegisterSerializer

# API View to fetch the list of candidates and live election results
class CandidateListView(APIView):
    def get(self, request):
        candidates = Candidate.objects.all()
        serializer = CandidateSerializer(candidates, many=True)
        return Response(serializer.data)

# Core API View to handle casting a vote safely
class CastVoteView(APIView):
    permission_classes = [IsAuthenticated]  # Only logged-in users can cast a vote

    def post(self, request):
        serializer = VoteSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            # Get the selected candidate instance from validated data
            candidate = serializer.validated_data['candidate']
            user = request.user

            # 1. Increment the vote count of the chosen candidate
            candidate.vote_count += 1
            candidate.save()

            # 2. Store the transaction record in the Vote model
            Vote.objects.create(voter=user, candidate=candidate)

            # 3. Update user status flag to prevent multiple voting attempts
            user.has_voted = True
            user.save()

            # 4. Send Confirmation Email to the Voter
            try:
                subject = "MIMT Election 2026 - Vote Casted Successfully"
                email_message = (
                    f"Dear {user.username},\n\n"
                    f"Thank you for participating in the Modi Institute of Management & Technology (MIMT) Online Voting System.\n\n"
                    f"Your vote has been successfully recorded!\n"
                    f"Details:\n"
                    f"- Candidate: {candidate.name}\n"
                    f"- Party: {candidate.party}\n\n"
                    f"Note: You cannot cast another vote as your voting privilege has now been securely locked.\n\n"
                    f"Regards,\n"
                    f"Head, Dept. of Computer Applications\n"
                    f"MIMT College"
                )
                
                send_mail(
                    subject,
                    email_message,
                    settings.EMAIL_HOST_USER,  # settings.py से आपकी ईमेल आईडी लेगा
                    [user.email],              # वोटर का ईमेल एड्रेस
                    fail_silently=True,        # ईमेल फेल होने पर सर्वर क्रैश नहीं होगा
                )
            except Exception as e:
                print(f"Email sending failed: {e}")

            return Response(
                {"message": f"Your vote for {candidate.name} has been successfully recorded!"}, 
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Voter registered successfully! You can now log in."}, 
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)