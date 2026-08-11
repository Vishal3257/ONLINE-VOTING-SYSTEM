import os
import random
import threading
import traceback
from datetime import time

from django.conf import settings
from django.contrib.auth import authenticate
from django.core.mail import EmailMessage, get_connection, send_mail
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

# Models Import
from .models import Candidate, CustomUser, ElectionConfig, EmailOTP, Vote


# ─── ISOLATED BACKGROUND BULK EMAIL FUNCTION ───
def send_email_in_background(winner_name, max_votes, email_list, host_user, host_password):
    try:
        connection = get_connection(
            backend='django.core.mail.backends.smtp.EmailBackend',
            host='smtp.gmail.com',
            port=587,
            username=host_user,
            password=host_password,
            use_tls=True,
            timeout=10
        )

        email = EmailMessage(
            subject="🏆 Final Election Results Are Out! 🏆",
            body=(
                f"Dear Voter,\n\n"
                f"The official results for the Online Voting System have been declared.\n\n"
                f"🎉 WINNER: {winner_name} with {max_votes} votes!\n\n"
                f"Thank you for making your vote count.\n"
                f"Modi Institute of Management & Technology"
            ),
            from_email=host_user,
            to=email_list,
            connection=connection
        )
        email.send(fail_silently=False)
        print("=== BACKGROUND BULK EMAIL DISPATCHED SUCCESSFULLY ===")
    except Exception as e:
        print(f"🔥 SMTP EMAIL ERROR DETECTED: {str(e)}")


# 1. ─── REGISTER VIEW ───
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if not username or not email or not password:
            return Response(
                {"error": "All fields (username, email, password) are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if CustomUser.objects.filter(username=username).exists():
            return Response(
                {"error": "Username already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if CustomUser.objects.filter(email=email).exists():
            return Response(
                {"error": "Email already registered."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = CustomUser.objects.create_user(username=username, email=email, password=password)
        return Response(
            {"message": "User registered successfully! Please log in."},
            status=status.HTTP_201_CREATED
        )


# 2. ─── SEND LOGIN OTP VIEW ───
class SendLoginOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({"error": "No registered user found with this email."}, status=status.HTTP_404_NOT_FOUND)

        # Generate 6-digit OTP
        otp_code = str(random.randint(100000, 999999))

        # Save to EmailOTP table
        EmailOTP.objects.create(email=email, otp=otp_code)

        # Send Email via Gmail SMTP
        try:
            send_mail(
                subject="MIMT Voting Portal - Login OTP",
                message=f"Hi {user.username},\n\nYour OTP for login is: {otp_code}\n\nValid for 10 minutes.",
                from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else None,
                recipient_list=[email],
                fail_silently=False,
            )
            return Response({"message": "OTP sent successfully to your email."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to send email: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 3. ─── LOGIN WITH OTP VIEW ───
class LoginWithOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        otp_code = request.data.get('otp')

        if not email or not password or not otp_code:
            return Response({"error": "Email, password, and OTP are required."}, status=status.HTTP_400_BAD_REQUEST)

        # OTP Verification Check
        otp_record = EmailOTP.objects.filter(
            email=email,
            otp=otp_code,
            is_verified=False
        ).order_by('-created_at').first()

        if not otp_record:
            return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        if otp_record.is_expired():
            return Response({"error": "OTP has expired. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)

        # Password Verification
        try:
            user_obj = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        user = authenticate(username=user_obj.username, password=password)
        if not user:
            return Response({"error": "Invalid credentials (Password mismatch)."}, status=status.HTTP_401_UNAUTHORIZED)

        # Mark OTP as used
        otp_record.is_verified = True
        otp_record.save()

        # JWT Tokens Generation
        refresh = RefreshToken.for_user(user)
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "username": user.username,
            "has_voted": user.has_voted,
            "message": "Login successful!"
        }, status=status.HTTP_200_OK)


# 4. ─── CANDIDATE LIST VIEW ───
class CandidateListView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        candidates = Candidate.objects.all()
        data = [{"id": c.id, "name": c.name, "party": getattr(c, 'party', '')} for c in candidates]
        return Response(data, status=status.HTTP_200_OK)


# 5. ─── VOTE CAST VIEW ───
class CastVoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        candidate_id = request.data.get('candidate_id')

        config = ElectionConfig.objects.first()
        if config and config.is_declared:
            return Response(
                {"error": "Voting period has ended. Winner has already been declared!"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user.has_voted:
            return Response(
                {"error": "You have already casted your vote!"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not candidate_id:
            return Response(
                {"error": "Candidate ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            candidate = Candidate.objects.get(id=candidate_id)
        except Candidate.DoesNotExist:
            return Response(
                {"error": "Candidate not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        Vote.objects.create(voter=request.user, candidate=candidate)
        
        candidate.vote_count += 1
        candidate.save()

        user.has_voted = True
        user.save()

        # Vote Confirmation Email
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
                body=f"Hi {user.username},\n\nYour vote has been successfully registered for {candidate.name}.\n\nThank you!",
                from_email=os.environ.get('EMAIL_HOST_USER', 'vt464670@gmail.com'),
                to=[user.email],
                connection=connection
            )
            email.send(fail_silently=True)
        except Exception:
            pass

        return Response(
            {"message": "Vote casted successfully! Redirecting..."},
            status=status.HTTP_200_OK
        )


# 6. ─── ELECTION RESULT VIEW ───
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def election_result_view(request):
    config = ElectionConfig.objects.first()
    now = timezone.now()

    if config and not config.is_declared:
        if now >= config.end_time:
            candidates = Candidate.objects.all()
            if candidates.exists():
                winner = max(candidates, key=lambda c: c.vote_count, default=None)
                if winner and winner.vote_count > 0:
                    voters_emails = list(
                        CustomUser.objects.filter(has_voted=True)
                        .exclude(email="")
                        .values_list('email', flat=True)
                    )
                    host_user = os.environ.get('EMAIL_HOST_USER', 'vt464670@gmail.com')
                    host_password = os.environ.get('EMAIL_HOST_PASSWORD')

                    if voters_emails:
                        send_email_in_background(
                            winner.name, winner.vote_count, voters_emails, host_user, host_password
                        )

                    config.is_declared = True
                    config.save()

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

        return Response({
            "results": result_data,
            "winner": winner_name,
            "gap_message": gap_message,
            "is_declared": config.is_declared if config else False,
            "total_votes_polled": Vote.objects.count()
        }, status=status.HTTP_200_OK)

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

        voters_emails = list(
            CustomUser.objects.filter(has_voted=True)
            .exclude(email="")
            .values_list('email', flat=True)
        )
        winner_name_str = str(winner.name)

        host_user = os.environ.get('EMAIL_HOST_USER', 'vt464670@gmail.com')
        host_password = os.environ.get('EMAIL_HOST_PASSWORD')

        if voters_emails:
            send_email_in_background(
                winner_name_str, max_votes, voters_emails, host_user, host_password
            )

        if config:
            config.is_declared = True
            config.save()

        return Response({
            "status": "success",
            "message": "Result announced successfully! Bulk emails sent to all voters."
        }, status=status.HTTP_200_OK)


# 7. ─── CREATE ADMIN BACKUP VIEW ───
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