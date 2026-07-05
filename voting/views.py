import threading
from django.core.mail import send_mail, send_mass_mail
from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Candidate, CustomUser, Vote  # Check and ensure your model names match exactly
from rest_framework.generics import ListAPIView
# If you have a CandidateSerializer, import it here:
# from .serializers import CandidateSerializer 

# 1. ─── CANDIDATE LIST VIEW ───
# Added this back to ensure your existing endpoint works perfectly without any breaking changes
class CandidateListView(APIView):
    permission_classes = [AllowAny] # Anyone can fetch the candidate list to view them

    def get(self, request):
        candidates = Candidate.objects.all()
        # If you prefer raw dictionary return instead of a serializer:
        data = [{"id": c.id, "name": c.name, "party": getattr(c, 'party', '')} for c in candidates]
        return Response(data, status=status.HTTP_200_OK)


# 2. ─── VOTE CAST VIEW (WITH BACKGROUND EMAIL THREADING) ───
class CastVoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        candidate_id = request.data.get('candidate_id')

        # Check if the user has already voted
        if user.has_voted:
            return Response({"error": "You have already casted your vote!"}, status=status.HTTP_400_BAD_REQUEST)

        if not candidate_id:
            return Response({"error": "Candidate ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            candidate = Candidate.objects.get(id=candidate_id)
        except Candidate.DoesNotExist:
            return Response({"error": "Candidate not found."}, status=status.HTTP_404_NOT_FOUND)

        # Record the vote in the database
        Vote.objects.create(user=user, candidate=candidate)
        user.has_voted = True
        user.save()

        # ─── BACKGROUND EMAIL THREADING ───
        # Runs in a separate thread so that the frontend receives an instant response without waiting
        def send_vote_email():
            try:
                send_mail(
                    subject="Vote Casted Successfully! 🗳️",
                    message=f"Hi {user.username},\n\nYour valuable vote has been successfully registered for {candidate.name}.\n\nThank you for participating!",
                    from_email='vt464670@gmail.com',
                    recipient_list=[user.email],
                    fail_silently=False,
                )
                print(f"Success Email sent to {user.email}")
            except Exception as e:
                print(f"Background Email Failed: {e}")

        # Start the background thread execution
        threading.Thread(target=send_vote_email).start()

        # Send instant success response to frontend to allow the next voter to log in immediately
        return Response({"message": "Vote casted successfully! Redirecting..."}, status=status.HTTP_200_OK)


# 3. ─── ELECTION RESULT & BULK EMAIL VIEW ───
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

        # Calculate vote count for each candidate
        for candidate in candidates:
            vote_count = Vote.objects.filter(candidate=candidate).count()
            result_data.append({
                "id": candidate.id,
                "name": candidate.name,
                "party": getattr(candidate, 'party', ''), 
                "votes": vote_count
            })

            # Logic to determine the leading winner or a tie/draw
            if vote_count > max_votes:
                max_votes = vote_count
                winner = candidate
                is_draw = False
            elif vote_count == max_votes and max_votes > 0:
                is_draw = True

        # Calculate the leading vote margin/gap between the top two candidates
        gap_message = "No clear gap."
        if len(result_data) >= 2:
            # Sort candidates in descending order based on votes count
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
        """ Endpoint for Admins to trigger a bulk winner email blast to all voters """
        candidates = Candidate.objects.all()
        winner = None
        max_votes = -1
        is_draw = False

        # Determine the winner before announcing the results via email
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

        # Retrieve list of all users who have successfully casted a vote
        voters_emails = list(CustomUser.objects.filter(has_voted=True).values_list('email', flat=True))

        if not voters_emails:
            return Response({"message": "No voters found to email."}, status=status.HTTP_200_OK)

        # ─── BULK EMAIL BACKGROUND THREAD ───
        def send_bulk_winner_email():
            try:
                # Utilizing django's send_mass_mail for efficient multi-recipient dispatching
                message = (
                    "Final Election Results Are Out! 🏆",
                    f"Dear Voter,\n\nThe results for the Online Voting System have been declared.\n\n🎉 WINNER: {winner.name} with {max_votes} votes!\n\nThank you for making your vote count.",
                    'vt464670@gmail.com',
                    voters_emails
                )
                send_mass_mail((message,), fail_silently=False)
                print(f"Bulk winner email successfully sent to {len(voters_emails)} voters!")
            except Exception as e:
                print(f"Bulk Email Blast Failed: {e}")

        # Execute bulk email blast asynchronously in the background
        threading.Thread(target=send_bulk_winner_email).start()

        return Response({"message": f"Result announced! Email blast started for {len(voters_emails)} voters."}, status=status.HTTP_200_OK)