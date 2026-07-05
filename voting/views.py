import threading
import traceback
from django.core.mail import send_mail, send_mass_mail
from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Candidate, CustomUser, Vote  # Ensure your model names match exactly

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

        # Create new user
        user = CustomUser.objects.create_user(username=username, email=email, password=password)
        return Response({"message": "User registered successfully! Please log in."}, status=status.HTTP_201_CREATED)


# 2. ─── CANDIDATE LIST VIEW ───
class CandidateListView(APIView):
    # Overriding any global permission settings explicitly
    permission_classes = [AllowAny]
    authentication_classes = [] 

    def get(self, request):
        candidates = Candidate.objects.all()
        data = [{"id": c.id, "name": c.name, "party": getattr(c, 'party', '')} for c in candidates]
        return Response(data, status=status.HTTP_200_OK)


# 3. ─── VOTE CAST VIEW (WITH BACKGROUND EMAIL THREADING) ───
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

        # Background Email Threading
        def send_vote_email():
            print(f"--- DEBUG CAST VOTE: Trying to send email to {user.email} ---")
            try:
                send_mail(
                    subject="Vote Casted Successfully! 🗳️",
                    message=f"Hi {user.username},\n\nYour valuable vote has been successfully registered for {candidate.name}.\n\nThank you for participating!",
                    from_email='vt464670@gmail.com',
                    recipient_list=[user.email],
                    fail_silently=False,
                )
                print(f"=== DEBUG CAST VOTE: Success Email sent to {user.email} ===")
            except Exception as e:
                print(f"=== DEBUG CAST VOTE CRITICAL ERROR ===")
                print(f"Error Message: {str(e)}")
                traceback.print_exc()

        threading.Thread(target=send_vote_email).start()

        return Response({"message": "Vote casted successfully! Redirecting..."}, status=status.HTTP_200_OK)


# 4. ─── ELECTION RESULT & BULK EMAIL VIEW ───
class ElectionResultView(APIView):
    permission_classes = [AllowAny]

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

        
        voters_emails = list(CustomUser.objects.filter(has_voted=True).exclude(email="").values_list('email', flat=True))

        print(f"--- DEBUG BULK EMAIL: Total emails found in DB: {len(voters_emails)} ---")
        print(f"--- DEBUG BULK EMAIL: Recipients List -> {voters_emails} ---")

        if not voters_emails:
            print("--- DEBUG BULK EMAIL: No active voter emails found to blast! ---")
            return Response({"message": "No voters found with valid email addresses."}, status=status.HTTP_200_OK)

        def send_bulk_winner_email():
            try:
                message = (
                    "Final Election Results Are Out! 🏆",
                    f"Dear Voter,\n\nThe results for the Online Voting System have been declared.\n\n🎉 WINNER: {winner.name} with {max_votes} votes!\n\nThank you for making your vote count.",
                    'vt464670@gmail.com',
                    voters_emails
                )
                
                send_mass_mail((message,), fail_silently=False)
                print(f"=== DEBUG BULK EMAIL: Successfully sent to {len(voters_emails)} voters! ===")
            except Exception as e:
                print(f"=== DEBUG BULK EMAIL CRITICAL ERROR ===")
                print(f"Error Message: {str(e)}")
                traceback.print_exc()

        threading.Thread(target=send_bulk_winner_email).start()

        return Response({"message": f"Result announced! Email blast started for {len(voters_emails)} voters."}, status=status.HTTP_200_OK)