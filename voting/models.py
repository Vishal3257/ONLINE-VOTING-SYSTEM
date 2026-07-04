from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

# 1. कस्टम यूजर मॉडल (ताकि हर वोटर का ट्रैक रह सके)
class CustomUser(AbstractUser):
    has_voted = models.BooleanField(default=False)

    def __str__(self):
        return self.username

# 2. कैंडिडेट मॉडल (सिर्फ BJP और CNG के लिए)
class Candidate(models.Model):
    PARTY_CHOICES = [
        ('BJP', 'Bharatiya Janata Party'),
        ('CNG', 'Congress'),
    ]
    
    name = models.CharField(max_length=100)  # जैसे: Narendra Modi या Rahul Gandhi
    party = models.CharField(max_length=10, choices=PARTY_CHOICES, unique=True)
    vote_count = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.name} ({self.party})"

# 3. वोट मॉडल (सिक्योरिटी के लिए - किसने किसको वोट दिया)
class Vote(models.Model):
    voter = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='voted_to')
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='votes')
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.voter.username} voted for {self.candidate.name}"