from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import threading
import traceback
import os
from django.core.mail import get_connection, EmailMessage, send_mail
from django.db.models import Count
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Candidate, CustomUser, Vote  

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

        Vote.objects.create(user=user, candidate=candidate)
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


# 4. ─── ELECTION RESULT & BULK EMAIL VIEW ───
@method_decorator(csrf_exempt, name='dispatch')
class ElectionResultView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [] # Ensure no session authentication blocks it
    def get(self, request):
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

    def post(self, request):
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

        # Clean list of target emails
        voters_emails = list(CustomUser.objects.filter(has_voted=True).exclude(email="").values_list('email', flat=True))

        if not voters_emails:
            return Response({"message": "No voters found with valid email addresses."}, status=status.HTTP_200_OK)

        # NO THREADING! Direct Execution to catch the real hidden error
        try:
            from django.core.mail import get_connection, EmailMessage
            import os

            print(f"--- ATTEMPTING DIRECT SMTP TO: {voters_emails} ---")
            
            
            # Force explicit SMTP configuration using SSL port 465
            connection = get_connection(
                backend='django.core.mail.backends.smtp.EmailBackend',
                host='smtp.gmail.com',
                port=465,  # Changed from 587 to 465
                username=os.environ.get('EMAIL_HOST_USER', 'vt464670@gmail.com'),
                password=os.environ.get('EMAIL_HOST_PASSWORD'),
                use_tls=False,  # Explicitly disabled TLS for SSL connection
                use_ssl=True    # Enabled SSL
            )

            email = EmailMessage(
                subject="Final Election Results Are Out! 🏆",
                body=f"Dear Voter,\n\nThe results for the Online Voting System have been declared.\n\n🎉 WINNER: {winner.name} with {max_votes} votes!\n\nThank you for making your vote count.",
                from_email=os.environ.get('EMAIL_HOST_USER', 'vt464670@gmail.com'),
                to=voters_emails,
                connection=connection
            )
            
            # This will force Django to either send it right now or throw a clear exception
            email.send(fail_silently=False)
            print("=== SUCCESS: ALL EMAILS SENT SUCCESSFULLY FROM DIRECT SMTP ===")
            
            return Response({"message": f"Result announced! Email sent successfully to {len(voters_emails)} voters."}, status=status.HTTP_200_OK)

        except Exception as e:
            print("=== CRITICAL SMTP BLOCKED ERROR ===")
            print(f"The Real Error is: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({"error": f"Email failed to send: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)