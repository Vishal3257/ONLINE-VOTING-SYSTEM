from rest_framework import serializers
from django.utils import timezone
from .models import Candidate, CustomUser, Vote, ElectionConfig


# 1. ─── LOGIN SERIALIZER ───
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)


# 2. ─── REGISTER SERIALIZER ───
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ['username', 'password', 'confirm_password']

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        return CustomUser.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password']
        )


# 3. ─── CANDIDATE SERIALIZER ───
class CandidateSerializer(serializers.ModelSerializer):
    voters = serializers.SerializerMethodField()

    class Meta:
        model = Candidate
        fields = ['id', 'name', 'party', 'vote_count', 'voters']

    def get_voters(self, obj):
        return list(Vote.objects.filter(candidate=obj).values_list('voter__username', flat=True))


# 4. ─── VOTE SERIALIZER (5 PM Time Check & Manual Override Check Included) ───
class VoteSerializer(serializers.Serializer):
    candidate_id = serializers.IntegerField(required=True)

    def validate(self, attrs):
        request = self.context.get('request')

        # Check Election Status
        config = ElectionConfig.objects.first()
        if config and config.is_voting_closed():
            raise serializers.ValidationError(
                "Voting is closed! Results have been declared or the 5:00 PM deadline has passed."
            )

        if request and hasattr(request, 'user'):
            user = request.user
            if getattr(user, 'has_voted', False):
                raise serializers.ValidationError("You have already cast your vote!")
        
        return attrs


# 5. ─── ELECTION CONFIG / RESULT DECLARE SERIALIZER (For Admin) ───
class ElectionConfigSerializer(serializers.ModelSerializer):
    is_voting_closed = serializers.BooleanField(source='is_voting_closed', read_only=True)

    class Meta:
        model = ElectionConfig
        fields = ['id', 'title', 'end_time', 'is_declared', 'is_voting_closed']