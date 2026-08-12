from django.conf import settings

from django.contrib.auth.models import AbstractUser

from django.db import models

from django.utils import timezone





# 1. Custom User Model

class CustomUser(AbstractUser):

    email = models.EmailField(blank=True, null=True)

    has_voted = models.BooleanField(default=False)



    REQUIRED_FIELDS = []



    def __str__(self):

        return self.username





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





# 4. Election Configuration Model (Timeline & Manual Declaration Included)

class ElectionConfig(models.Model):

    title = models.CharField(max_length=200, default='General Election')

    end_time = models.DateTimeField(

        help_text="Set election end time (e.g., Today at 5:00 PM)"

    )

    is_declared = models.BooleanField(

        default=False,

        help_text="Manual override by admin to declare results early or force declaration"

    )



    def is_voting_closed(self):

        """

        Voting close check:

        1. Agar current time end_time (5:00 PM) se aage nikal gaya ho, YA

        2. Admin ne manually 'is_declared=True' kar diya ho.

        """

        return timezone.now() >= self.end_time or self.is_declared



    def __str__(self):

        return f'{self.title} (Ended/Declared: {self.is_voting_closed()})'



