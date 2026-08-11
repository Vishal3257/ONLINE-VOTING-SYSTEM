from rest_framework import serializers
from .models import Candidate, Vote, CustomUser


# ─── SWAGGER INPUT SERIALIZERS (For API Docs Input Boxes) ───

# Serializer to send registration OTP
class SendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


# Serializer for OTP-based Login verification
class LoginOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True)
    otp = serializers.CharField(required=True)


# ─── VOTING & USER SERIALIZERS ───

# Serializer to display candidate information and real-time vote counts
class CandidateSerializer(serializers.ModelSerializer):
    # Field to retrieve the list of usernames of voters who voted for each candidate
    voters = serializers.SerializerMethodField()

    class Meta:
        model = Candidate
        fields = ['id', 'name', 'party', 'vote_count', 'voters']

    def get_voters(self, obj):
        # Extracts a flat list of usernames from Vote records associated with this candidate
        return list(Vote.objects.filter(candidate=obj).values_list('voter__username', flat=True))


# Serializer to handle the voting process with validation logic
class VoteSerializer(serializers.Serializer):
    candidate_id = serializers.IntegerField(required=True)

    def validate(self, attrs):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user
            # Validation Logic: Check if the user has already cast a vote
            if getattr(user, 'has_voted', False):
                raise serializers.ValidationError("You have already cast your vote!")
        return attrs


# Serializer for user registration handling user creation and password hashing
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        # Create a new user with an encrypted/hashed password
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user