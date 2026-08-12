from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    StandardLoginView,
    RegisterView,
    CandidateListView,
    CastVoteView,
    election_result_view,
)

urlpatterns = [
    # Auth Endpoints (Simple Username & Password)
    path('auth/login/', StandardLoginView.as_view(), name='auth-login'),
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Voting Endpoints
    path('candidates/', CandidateListView.as_view(), name='candidate-list'),
    path('cast-vote/', CastVoteView.as_view(), name='cast-vote'),
    path('results/', election_result_view, name='election-results'),
]