# voting/admin.py
from django.contrib import admin
from django.contrib import messages
from .models import Candidate, Vote, CustomUser

@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ('name', 'party', 'vote_count')
    actions = ['reset_election_to_zero']

    @admin.action(description='⚠️ Reset Entire Election to ZERO')
    def reset_election_to_zero(self, request, queryset):
        # 1. Reset vote count for all candidates to 0
        Candidate.objects.update(vote_count=0)
        
        # 2. Delete all transaction records from Vote model
        Vote.objects.all().delete()
        
        # 3. Reset has_voted status of all users back to False so they can vote again
        CustomUser.objects.update(has_voted=False)
        
        self.message_user(
            request, 
            "Success: The entire election has been reset! All votes are now 0 and voters can vote again.", 
            messages.SUCCESS
        )

@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ('voter', 'candidate', 'timestamp')
    list_filter = ('candidate',)

# Registering CustomUser to manage voter statuses easily from mobile
@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'has_voted', 'is_staff')
    list_filter = ('has_voted', 'is_staff')
    search_fields = ('username', 'email')