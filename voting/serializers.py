from rest_framework import serializers
from .models import Candidate, Vote, CustomUser

# Serializer to display candidate information and real-time vote counts
class CandidateSerializer(serializers.ModelSerializer):
    # यह नया फील्ड हर कैंडिडेट को वोट देने वाले वोटर्स के नाम की लिस्ट भेजेगा
    voters = serializers.SerializerMethodField()

    class Meta:
        model = Candidate
        fields = ['id', 'name', 'party', 'vote_count', 'voters']

    def get_voters(self, obj):
        # इस कैंडिडेट के सभी वोट रिकॉर्ड्स में से सिर्फ वोटर्स के username की लिस्ट निकालें
        return list(Vote.objects.filter(candidate=obj).values_list('voter__username', flat=True))

# Serializer to handle the voting process with validation logic
class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ['candidate']

    def validate(self, attrs):
        user = self.context['request'].user
        
        # Validation Logic: Check if the user has already cast a vote
        if user.has_voted:
            raise serializers.ValidationError("You have already cast your vote!")
        return attrs
    

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