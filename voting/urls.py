from django.urls import path
from .views import CandidateListView, CastVoteView, RegisterView, ElectionResultView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Auth Endpoints
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'), 
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), 

    # Voting Endpoints
    path('candidates/', CandidateListView.as_view(), name='candidate-list'),
    path('cast-vote/', CastVoteView.as_view(), name='cast-vote'),
    
    # Results & Bulk Email Blast Endpoint
    path('results/', ElectionResultView.as_view(), name='election-results'),
]