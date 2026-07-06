from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


from .views import CandidateListView, CastVoteView, RegisterView, election_result_view
from .views import create_admin_backup

urlpatterns = [
    # Auth Endpoints
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'), 
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), 

    # Voting Endpoints
    path('candidates/', CandidateListView.as_view(), name='candidate-list'),
    path('cast-vote/', CastVoteView.as_view(), name='cast-vote'),
    
    
    path('results/', election_result_view, name='election-results'),
    path('My-admin-V/', create_admin_backup, name='create-admin-backup'),
]