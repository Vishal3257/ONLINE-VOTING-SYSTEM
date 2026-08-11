from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CandidateListView,
    CastVoteView,
    LoginWithOTPView,
    RegisterView,
    SendLoginOTPView,
    create_admin_backup,
    election_result_view,
)

urlpatterns = [
    # Auth Endpoints
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/send-login-otp/', SendLoginOTPView.as_view(), name='send-login-otp'),
    path('auth/login-otp/', LoginWithOTPView.as_view(), name='login-otp'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Voting Endpoints
    path('candidates/', CandidateListView.as_view(), name='candidate-list'),
    path('cast-vote/', CastVoteView.as_view(), name='cast-vote'),
    path('results/', election_result_view, name='election-results'),
    
    # Admin Backup
    path('My-admin-V/', create_admin_backup, name='create-admin-backup'),
]