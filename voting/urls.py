from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CandidateListView,
    CastVoteView,
    LoginWithOTPView,
    RegisterView,
    SendLoginOTPView,
    SendOTPView,  # <--- Register OTP view import
    create_admin_backup,
    election_result_view,
)

urlpatterns = [
    # Auth Endpoints
    path('auth/send-otp/', SendOTPView.as_view(), name='send-otp'),  # Register OTP ke liye
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/send-login-otp/', SendLoginOTPView.as_view(), name='send-login-otp'),
    path('auth/login-otp/', LoginWithOTPView.as_view(), name='login-otp'),
    path('auth/login/', LoginWithOTPView.as_view(), name='login'), # Backup routing for login
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Voting Endpoints
    path('candidates/', CandidateListView.as_view(), name='candidate-list'),
    path('cast-vote/', CastVoteView.as_view(), name='cast-vote'),
    path('results/', election_result_view, name='election-results'),
    
    # Admin Backup
    path('My-admin-V/', create_admin_backup, name='create-admin-backup'),
]