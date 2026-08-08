from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

# 1. Custom User Model to track voting status of each user
class CustomUser(AbstractUser):
    has_voted = models.BooleanField(default=False)

    def __str__(self):
        return self.username


# 2. Candidate Model (Dynamic entry allowed without party restrictions)
class Candidate(models.Model):
    name = models.CharField(max_length=100)
    # Allows adding any party name dynamically via mobile or desktop admin panel
    party = models.CharField(max_length=100) 
    vote_count = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.name} ({self.party})"


# 3. Vote Model to securely record voter activity and timestamps
class Vote(models.Model):
    voter = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='voted_to')
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='votes')
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.voter.username} voted for {self.candidate.name}"


# 4. Election Configuration Model to manage fixed auto-declaration timing
class ElectionConfig(models.Model):
    title = models.CharField(max_length=200, default="General Election")
    end_time = models.DateTimeField()  # Fixed time for automatic result declaration (e.g., 5:00 PM)
    is_declared = models.BooleanField(default=False)  # Tracks if winner has been announced and emails sent

    def __str__(self):
        return f"{self.title} (Ends at: {self.end_time})"