import os
import threading
import traceback

from django.core.mail import EmailMessage, get_connection
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
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
from django.db import connection as django_db_connection

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

        # Create new user safely
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


# 3. ─── VOTE CAST VIEW (WITH FIXED SMTP BACKGROUND THREAD) ───
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

        # Secure Background Thread for Single Email
        def send_vote_email():
            print(f"--- DEBUG CAST VOTE: Trying to send email to {user.email} ---")
            try:
                # Forcing explicit SMTP connection inside the thread
                connection = get_connection(
                    backend='django.core.mail.backends.smtp.EmailBackend',
                    host='smtp.gmail.com',
                    port=587,
                    username=os.environ.get('EMAIL_HOST_USER', 'vt464670@gmail.com'),
                    password=os.environ.get('EMAIL_HOST_PASSWORD'),
                    use_tls=True
                )
                
                email = EmailMessage(
                    subject="Vote Casted Successfully! 🗳️",
                    body=f"Hi {user.username},\n\nYour valuable vote has been successfully registered for {candidate.name}.\n\nThank you for participating!",
                    from_email=os.environ.get('EMAIL_HOST_USER', 'vt464670@gmail.com'),
                    to=[user.email],
                    connection=connection
                )
                email.send(fail_silently=False)
                print(f"=== DEBUG CAST VOTE: Success Email sent to {user.email} ===")
            except Exception as e:
                print(f"=== DEBUG CAST VOTE CRITICAL ERROR ===")
                print(f"Error Message: {str(e)}")
                traceback.print_exc()

        threading.Thread(target=send_vote_email).start()
        return Response({"message": "Vote casted successfully! Redirecting..."}, status=status.HTTP_200_OK)


# ─── HELPER FUNCTION FOR ASYNC BULK RESULTS EMAIL ───
# ─── SAFE BACKGROUND EMAIL BLAST FUNCTION (WITH DB CLOSURE PROTECTION) ───


def send_bulk_result_emails_async(winner_name, max_votes, voters_emails):
    """
    Runs safely in a thread. Closes connection properly to ensure Django ORM works.
    """
    try:
        print(f"--- STARTING BACKGROUND EMAIL BLAST TO {len(voters_emails)} VOTERS ---")
        
        # Explicit SMTP Setup on Port 587 TLS
        smtp_connection = get_connection(
            backend='django.core.mail.backends.smtp.EmailBackend',
            host='smtp.gmail.com',
            port=587,
            username=os.environ.get('EMAIL_HOST_USER', 'vt464670@gmail.com'),
            password=os.environ.get('EMAIL_HOST_PASSWORD'),
            use_tls=True
        )

        email = EmailMessage(
            subject="Final Election Results Are Out! 🏆",
            body=f"Dear Voter,\n\nThe results for the Online Voting System have been officially declared.\n\n🎉 WINNER: {winner_name} with {max_votes} votes!\n\nThank you for making your vote count.",
            from_email=os.environ.get('EMAIL_HOST_USER', 'vt464670@gmail.com'),
            to=voters_emails,
            connection=smtp_connection
        )
        
        email.send(fail_silently=False)
        print("=== SUCCESS: ALL BACKGROUND BULK EMAILS SENT SUCCESSFULLY ===")
    except Exception as e:
        print("=== CRITICAL BACKGROUND SMTP BLOCKED ERROR ===")
        print(f"The Real Error is: {str(e)}")
        traceback.print_exc()
    finally:
        # Crucial for threads in Django: close the thread's DB connection
        django_db_connection.close()


# 4. ─── ELECTION RESULT & BULK EMAIL VIEW ───
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def election_result_view(request):
    """
    Function-based view handling both GET and POST.
    DRF will automatically manage all CORS preflight (OPTIONS) controls.
    """
    if request.method == 'GET':
        candidates = Candidate.objects.all()
        if not candidates.exists():
            return Response({"message": "No candidates found."}, status=status.HTTP_404_NOT_FOUND)

        result_data = []
        winner = None
        max_votes = -1
        is_draw = False

        for candidate in candidates:
            # Replaced inside-loop filter with direct count for thread safety and performance
            vote_count = candidate.votes.count() 
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
        # Fetch data completely BEFORE firing the thread to keep Django safe
        candidates = list(Candidate.objects.all())
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

        # Force execution of the queryset immediately using list() so the thread gets pure string data
        voters_emails = list(CustomUser.objects.filter(has_voted=True).exclude(email="").values_list('email', flat=True))

        if not voters_emails:
            return Response({"message": "No voters found with valid email addresses."}, status=status.HTTP_200_OK)

        # 🔥 Pass clean strings directly into the thread to avoid ORM/CORS blockages
        winner_name_str = str(winner.name)
        
        email_thread = threading.Thread(
            target=send_bulk_result_emails_async,
            args=(winner_name_str, max_votes, voters_emails)
        )
        email_thread.start()
        
        return Response({
            "status": "success",
            "message": f"Result process initiated! Sending bulk emails to {len(voters_emails)} voters in the background."
        }, status=status.HTTP_200_OK)