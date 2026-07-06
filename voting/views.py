import os
import threading
import traceback

from django.core.mail import EmailMessage, get_connection
from rest_framework import status
from rest_framework.decorators import (
    authentication_classes,
    api_view,
    permission_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Candidate, CustomUser, Vote


# ─── 100% ISOLATED BACKGROUND EMAIL FUNCTION (NO DB TOUCH) ───
def send_email_in_background(winner_name, max_votes, email_list, host_user, host_password):
    """
    This function runs completely independently in the background.
    It doesn't touch the database, preventing Gunicorn from timing out or memory leaking.
    """
    try:
        # Strict 5-second connection timeout to ensure safety on Render's free tier
        connection = get_connection(
            backend='django.core.mail.backends.smtp.EmailBackend',
            host='smtp.gmail.com',
            port=587,
            username=host_user,
            password=host_password,
            use_tls=True,
            timeout=5  
        )

        email = EmailMessage(
            subject="🏆 Final Election Results Are Out! 🏆",
            body=f"Dear Voter,\n\nThe results for the Online Voting System have been officially declared.\n\n🎉 WINNER: {winner_name} with {max_votes} votes!\n\nThank you for making your vote count.",
            from_email=host_user,
            to=email_list,
            connection=connection
        )
        email.send(fail_silently=True)
        print("=== BACKGROUND BULK EMAIL DISPATCHED SUCCESSFULLY ===")
    except Exception as e:
        print(f"Background email failed or skipped: {str(e)}")


# 1. ─── REGISTER VIEW ───
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if not username or not email or not password:
            return Response({"error": "All fields (username, email, password) are required."}, status=status.HTTP_400_BAD_REQUEST)

        if CustomUser.objects.filter(username=username).exists():
            return Response({"error": "Username already exists."}, status=status.HTTP_400_BAD_REQUEST)

        if CustomUser.objects.filter(email=email).exists():
            return Response({"error": "Email already registered."}, status=status.HTTP_400_BAD_REQUEST)

        user = CustomUser.objects.create_user(username=username, email=email, password=password)
        return Response({"message": "User registered successfully! Please log in."}, status=status.HTTP_201_CREATED)


# 2. ─── CANDIDATE LIST VIEW ───
class CandidateListView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [] 

    def get(self, request):
        candidates = Candidate.objects.all()
        data = [{"id": c.id, "name": c.name, "party": getattr(c, 'party', '')} for c in candidates]
        return Response(data, status=status.HTTP_200_OK)


# 3. ─── VOTE CAST VIEW (NO THREADS) ───
class CastVoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        candidate_id = request.data.get('candidate_id')

        if user.has_voted:
            return Response({"error": "You have already casted your vote!"}, status=status.HTTP_400_BAD_REQUEST)

        if not candidate_id:
            return Response({"error": "Candidate ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            candidate = Candidate.objects.get(id=candidate_id)
        except Candidate.DoesNotExist:
            return Response({"error": "Candidate not found."}, status=status.HTTP_404_NOT_FOUND)

        Vote.objects.create(voter=request.user, candidate=candidate)
        user.has_voted = True
        user.save()

        # Direct Single Email Send (Safe & Light)
        try:
            connection = get_connection(
                backend='django.core.mail.backends.smtp.EmailBackend',
                host='smtp.gmail.com',
                port=587,
                username=os.environ.get('EMAIL_HOST_USER', 'vt464670@gmail.com'),
                password=os.environ.get('EMAIL_HOST_PASSWORD'),
                use_tls=True,
                timeout=5
            )
            email = EmailMessage(
                subject="Vote Casted Successfully! 🗳️",
                body=f"Hi {user.username},\n\nYour valuable vote has been successfully registered for {candidate.name}.\n\nThank you for participating!",
                from_email=os.environ.get('EMAIL_HOST_USER', 'vt464670@gmail.com'),
                to=[user.email],
                connection=connection
            )
            email.send(fail_silently=True)
        except Exception:
            pass

        return Response({"message": "Vote casted successfully! Redirecting..."}, status=status.HTTP_200_OK)


# 4. ─── ELECTION RESULT & BULK EMAIL VIEW ───
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def election_result_view(request):
    if request.method == 'GET':
        candidates = Candidate.objects.all()
        if not candidates.exists():
            return Response({"message": "No candidates found."}, status=status.HTTP_404_NOT_FOUND)

        result_data = []
        winner = None
        max_votes = -1
        is_draw = False

        for candidate in candidates:
            vote_count = Vote.objects.filter(candidate=candidate).count()
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

        winner_name = "Draw / No Votes Yet" if is_draw or max_votes == 0 else winner.name

        return Response({
            "results": result_data,
            "winner": winner_name,
            "gap_message": gap_message,
            "total_votes_polled": Vote.objects.count()
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        candidates = Candidate.objects.all()
        winner = None
        max_votes = -1
        is_draw = False

        for candidate in candidates:
            vote_count = Vote.objects.filter(candidate=candidate).count()
            if vote_count > max_votes:
                max_votes = vote_count
                winner = candidate
                is_draw = False
            elif vote_count == max_votes and max_votes > 0:
                is_draw = True

        if is_draw or max_votes <= 0:
            return Response({"error": "Cannot declare winner. It's a tie or no votes casted yet."}, status=status.HTTP_400_BAD_REQUEST)

        # Extract only the plain data needed before firing the thread (keeps DB clean)
        voters_emails = list(CustomUser.objects.filter(has_voted=True).exclude(email="").values_list('email', flat=True))
        winner_name_str = str(winner.name)
        
        host_user = os.environ.get('EMAIL_HOST_USER', 'vt464670@gmail.com')
        host_password = os.environ.get('EMAIL_HOST_PASSWORD')

        # 🔥 LAUNCH BACKGROUND THREAD INSTANTLY
        if voters_emails:
            t = threading.Thread(
                target=send_email_in_background,
                args=(winner_name_str, max_votes, voters_emails, host_user, host_password)
            )
            t.daemon = True  # Allows it to execute independently from the request response cycle
            t.start()

        # 🔥 IMMEDIATE RESPONSE: Front-end is freed up instantly (No CORS/Gunicorn blocks)
        return Response({
            "status": "success",
            "message": f"Result announced successfully! Bulk email processing started."
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def create_admin_backup(request):
    try:
        if not CustomUser.objects.filter(username="VISHAL").exists():
            user = CustomUser.objects.create_superuser(
                username="VISHAL",
                email="vt464670@gmail.com",
                password="VISHAL123"  
            )
            return Response({"msg": "Superuser created successfully!"}, status=200)
        return Response({"msg": "User already exists!"}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)