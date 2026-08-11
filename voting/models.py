from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


# 1. Custom User Model (Email Field added & Unique enforced)
class CustomUser(AbstractUser):
  email = models.EmailField(unique=True)  # Email is now mandatory & unique
  has_voted = models.BooleanField(default=False)

  # Email ko mandatory username substitute create karne ke liye
  REQUIRED_FIELDS = ['email']

  def __str__(self):
    return f'{self.username} ({self.email})'


# 2. Candidate Model
class Candidate(models.Model):
  name = models.CharField(max_length=100)
  party = models.CharField(max_length=100)
  vote_count = models.IntegerField(default=0)

  def __str__(self):
    return f'{self.name} ({self.party})'


# 3. Vote Model
class Vote(models.Model):
  voter = models.OneToOneField(
      settings.AUTH_USER_MODEL,
      on_delete=models.CASCADE,
      related_name='voted_to',
  )
  candidate = models.ForeignKey(
      Candidate, on_delete=models.CASCADE, related_name='votes'
  )
  timestamp = models.DateTimeField(auto_now_add=True)

  def __str__(self):
    return f'{self.voter.username} voted for {self.candidate.name}'


# 4. Election Configuration Model
class ElectionConfig(models.Model):
  title = models.CharField(max_length=200, default='General Election')
  end_time = models.DateTimeField()
  is_declared = models.BooleanField(default=False)

  def __str__(self):
    return f'{self.title} (Ends at: {self.end_time})'


# 5. OTP Model (Gmail OTP System ke liye Zaroori)
class EmailOTP(models.Model):
  email = models.EmailField()
  otp = models.CharField(max_length=6)
  created_at = models.DateTimeField(auto_now_add=True)
  is_verified = models.BooleanField(default=False)

  def is_expired(self):
    # OTP 10 minute tak valid rahega
    expiration_time = self.created_at + timezone.timedelta(minutes=10)
    return timezone.now() > expiration_time

  def __str__(self):
    return f'{self.email} - OTP: {self.otp}'