from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import json

class FitnessGoal(models.Model):
    """Model representing different fitness goals that users can select."""
    name = models.CharField(max_length=100)
    description = models.TextField()
    
    def __str__(self):
        return self.name

class WorkoutExperience(models.Model):
    """Model representing experience levels for workouts."""
    name = models.CharField(max_length=50)  # e.g., "Beginner", "Intermediate", "Advanced"
    description = models.TextField()
    
    def __str__(self):
        return self.name

class Exercise(models.Model):
    """Model representing an individual exercise."""
    name = models.CharField(max_length=200)
    description = models.TextField()
    target_muscles = models.CharField(max_length=200)
    equipment_needed = models.CharField(max_length=200, blank=True, null=True)
    difficulty_level = models.ForeignKey(WorkoutExperience, on_delete=models.SET_NULL, null=True)
    instruction_steps = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return self.name

class Workout(models.Model):
    """Model representing a set of exercises grouped together as a workout."""
    name = models.CharField(max_length=200)
    description = models.TextField()
    exercises = models.ManyToManyField(
        Exercise, 
        through='WorkoutExercise',
        related_name='workouts'
    )
    duration_minutes = models.IntegerField(default=45)
    suitable_for = models.ForeignKey(WorkoutExperience, on_delete=models.SET_NULL, null=True)
    
    def __str__(self):
        return self.name

class WorkoutExercise(models.Model):
    """Model representing the relationship between Workout and Exercise with additional attributes."""
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE)
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    sets = models.IntegerField(default=3)
    reps = models.CharField(max_length=50, default='10-12')  # e.g., "10-12", "AMRAP", "30s"
    rest_between_sets_seconds = models.IntegerField(default=60)
    order_in_workout = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order_in_workout']

class FitnessPlan(models.Model):
    """Model representing a personalized fitness plan for a user."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=200)
    goal = models.ForeignKey(FitnessGoal, on_delete=models.SET_NULL, null=True)
    experience_level = models.ForeignKey(WorkoutExperience, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    weeks_duration = models.IntegerField(default=4)
    days_per_week = models.IntegerField(default=3)
    schedule = models.TextField(blank=True, null=True)  # Stored as JSON
    workouts = models.ManyToManyField(Workout, related_name='fitness_plans')
    dietary_guidelines = models.TextField(blank=True, null=True)
    physical_restrictions = models.TextField(blank=True, null=True)
    workout_preference = models.CharField(max_length=50, default='home')  # e.g., "home", "gym", "outdoor"
    
    def __str__(self):
        return self.title
    
    def get_schedule(self):
        """Parse the JSON schedule data."""
        if self.schedule:
            return json.loads(self.schedule)
        return {}
    
    def set_schedule(self, schedule_dict):
        """Save the schedule as JSON."""
        self.schedule = json.dumps(schedule_dict)
        
class UserProfile(models.Model):
    """Extended user profile information."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    date_of_birth = models.DateField(null=True, blank=True)
    height_cm = models.IntegerField(null=True, blank=True)
    weight_kg = models.FloatField(null=True, blank=True)
    fitness_level = models.ForeignKey(WorkoutExperience, on_delete=models.SET_NULL, null=True)
    fitness_goals = models.ManyToManyField(FitnessGoal, blank=True)
    physical_limitations = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.user.username}'s Profile"
