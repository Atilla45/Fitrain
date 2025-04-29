from django.contrib import admin
from .models import (
    FitnessGoal, 
    WorkoutExperience, 
    Exercise, 
    Workout, 
    WorkoutExercise, 
    FitnessPlan, 
    UserProfile
)

class WorkoutExerciseInline(admin.TabularInline):
    model = WorkoutExercise
    extra = 3

@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ('name', 'target_muscles', 'difficulty_level')
    list_filter = ('difficulty_level', 'target_muscles')
    search_fields = ('name', 'description', 'target_muscles')

@admin.register(Workout)
class WorkoutAdmin(admin.ModelAdmin):
    list_display = ('name', 'duration_minutes', 'suitable_for')
    list_filter = ('suitable_for',)
    search_fields = ('name', 'description')
    inlines = [WorkoutExerciseInline]

@admin.register(FitnessPlan)
class FitnessPlanAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'goal', 'experience_level', 'days_per_week', 'created_at')
    list_filter = ('goal', 'experience_level', 'days_per_week')
    search_fields = ('title', 'user__username')
    filter_horizontal = ('workouts',)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'fitness_level')
    list_filter = ('fitness_level', 'fitness_goals')
    search_fields = ('user__username', 'user__email')
    filter_horizontal = ('fitness_goals',)

# Register the simpler models
admin.site.register(FitnessGoal)
admin.site.register(WorkoutExperience)
