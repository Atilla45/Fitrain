from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json
import tempfile
from weasyprint import HTML, CSS

# --- Placeholder for AI/Rule-Based Logic ---
def create_fitness_plan(answers):
    """
    Generates a fitness plan structure based on user answers.
    This is a simple rule-based system that could be replaced with a more sophisticated approach.
    """
    plan_data = {
        'metadata': answers,
        'plan_title': "Your Personalized Fitness Plan",
        'introduction': f"Hi {answers.get('name', 'there')}! Based on your goal ({answers.get('goal', 'Not specified')}) and preferences, here's a plan to get you started.",
        'duration_weeks': 4,  # Example
        'weekly_schedule': {},  # To be populated
        'workouts': {},  # To be populated
        'diet_guidelines': [
            "Drink plenty of water throughout the day.",
            "Focus on whole foods: lean proteins, vegetables, fruits, whole grains.",
            "Limit processed foods, sugary drinks, and excessive saturated fats.",
            "Adjust portion sizes based on your activity level and goals.",
        ],
        'tips': [
            "Consistency is key! Stick to your schedule as much as possible.",
            "Listen to your body. Rest when you need to.",
            "Warm-up before each workout and cool-down afterwards.",
            "Focus on proper form over lifting heavy weight.",
            "Stay motivated! Track your progress and celebrate small wins.",
        ],
    }

    # Extract user data
    goal = answers.get('goal', 'general').lower()
    days = int(answers.get('days', 3))
    level = answers.get('level', 'beginner').lower()
    preference = answers.get('preference', 'home').lower()
    restrictions = answers.get('restrictions', '').lower()

    # Basic workout structure with logic based on user preferences
    if 'muscle' in goal or 'strength' in goal:
        plan_data['workouts']['Workout A'] = [
            {'name': 'Squats' if preference == 'gym' else 'Bodyweight Squats', 'sets': 3, 'reps': '8-12'},
            {'name': 'Bench Press' if preference == 'gym' else 'Push-ups', 'sets': 3, 'reps': '8-12'},
            {'name': 'Rows' if preference == 'gym' else 'Resistance Band Rows', 'sets': 3, 'reps': '10-15'},
        ]
        plan_data['workouts']['Workout B'] = [
            {'name': 'Deadlifts' if preference == 'gym' else 'Glute Bridges', 'sets': 3, 'reps': '6-10'},
            {'name': 'Overhead Press' if preference == 'gym' else 'Pike Push-ups', 'sets': 3, 'reps': '8-12'},
            {'name': 'Pull-ups/Lat Pulldowns' if preference == 'gym' else 'Inverted Rows / Band Pull-aparts', 'sets': 3, 'reps': 'As many as possible (AMRAP) or 10-15'},
        ]
        schedule = {'Monday': 'Workout A', 'Tuesday': 'Rest', 'Wednesday': 'Workout B', 'Thursday': 'Rest', 'Friday': 'Workout A', 'Saturday': 'Rest', 'Sunday': 'Rest'}
        if days == 5:
            schedule = {'Monday': 'Workout A', 'Tuesday': 'Workout B', 'Wednesday': 'Rest', 'Thursday': 'Workout A', 'Friday': 'Workout B', 'Saturday': 'Cardio/Active Recovery', 'Sunday': 'Rest'}
        plan_data['weekly_schedule'] = schedule

    elif 'weight' in goal or 'fat' in goal or 'slim' in goal:
        plan_data['workouts']['Full Body HIIT'] = [
            {'name': 'Jumping Jacks', 'sets': 1, 'reps': '60s'},
            {'name': 'High Knees', 'sets': 1, 'reps': '45s'},
            {'name': 'Burpees', 'sets': 3, 'reps': '30s work / 30s rest'},
            {'name': 'Mountain Climbers', 'sets': 3, 'reps': '30s work / 30s rest'},
            {'name': 'Alternating Lunges', 'sets': 3, 'reps': '45s work / 15s rest'},
        ]
        schedule = {'Monday': 'Full Body HIIT', 'Tuesday': 'Active Recovery (Walk/Stretch)', 'Wednesday': 'Full Body HIIT', 'Thursday': 'Rest', 'Friday': 'Full Body HIIT', 'Saturday': 'Longer Cardio (Optional)', 'Sunday': 'Rest'}
        if days >= 4:
            schedule['Thursday'] = 'Moderate Cardio (e.g., Jogging)'
        plan_data['weekly_schedule'] = schedule

    else:  # General Fitness
        plan_data['workouts']['Full Body Circuit'] = [
            {'name': 'Bodyweight Squats', 'sets': 3, 'reps': '15-20'},
            {'name': 'Push-ups (on knees if needed)', 'sets': 3, 'reps': 'AMRAP'},
            {'name': 'Walking Lunges', 'sets': 3, 'reps': '10-12 per leg'},
            {'name': 'Plank', 'sets': 3, 'reps': '30-60s hold'},
            {'name': 'Glute Bridges', 'sets': 3, 'reps': '15-20'},
        ]
        schedule = {'Monday': 'Full Body Circuit', 'Tuesday': 'Rest', 'Wednesday': 'Cardio (30 min)', 'Thursday': 'Rest', 'Friday': 'Full Body Circuit', 'Saturday': 'Active Recovery / Fun Activity', 'Sunday': 'Rest'}
        if days < 3:
            schedule = {'Monday': 'Full Body Circuit', 'Wednesday': 'Cardio (30 min)', 'Friday': 'Rest'}  # Adjust for fewer days
        plan_data['weekly_schedule'] = schedule
    
    # Adjust based on experience level
    if level == 'beginner':
        # Reduce intensity for beginners
        for workout_name, exercises in plan_data['workouts'].items():
            for exercise in exercises:
                if 'sets' in exercise and exercise['sets'] > 2:
                    exercise['sets'] = 2  # Reduce sets for beginners
    elif level == 'advanced':
        # Increase intensity for advanced users
        for workout_name, exercises in plan_data['workouts'].items():
            for exercise in exercises:
                if 'sets' in exercise:
                    exercise['sets'] += 1  # Add an extra set for advanced users
    
    # Adjust for restrictions
    if 'knee' in restrictions:
        # Replace exercises that stress knees
        for workout_name, exercises in plan_data['workouts'].items():
            for i, exercise in enumerate(exercises):
                if any(knee_stress in exercise['name'].lower() for knee_stress in ['squat', 'lunge', 'jump']):
                    exercises[i] = {'name': 'Modified Glute Bridges', 'sets': exercise['sets'], 'reps': exercise['reps']}
    
    if 'back' in restrictions:
        # Replace exercises that stress back
        for workout_name, exercises in plan_data['workouts'].items():
            for i, exercise in enumerate(exercises):
                if any(back_stress in exercise['name'].lower() for back_stress in ['deadlift', 'row', 'burpee']):
                    exercises[i] = {'name': 'Wall Push-ups', 'sets': exercise['sets'], 'reps': exercise['reps']}

    return plan_data


# --- Django Views ---

def landing_page(request):
    """Serves the main landing/conversation page."""
    return render(request, 'core/landing.html')


@csrf_exempt  # Required for AJAX POST requests
@require_POST
def generate_plan_view(request):
    """
    Handles form submission, generates a fitness plan and returns it as JSON.
    This endpoint is called by the frontend JavaScript.
    """
    try:
        data = json.loads(request.body)
        fitness_plan = create_fitness_plan(data)
        
        # Render the plan template to HTML (for PDF generation later)
        html_string = render_to_string('core/plan_template.html', {'plan': fitness_plan})
        
        # Store the rendered HTML in the session for PDF download
        request.session['plan_html'] = html_string
        request.session['plan_data'] = fitness_plan
        
        return JsonResponse({
            'success': True,
            'plan': fitness_plan
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


def download_pdf(request):
    """
    Generates and serves a PDF file of the fitness plan.
    """
    try:
        # Get the rendered HTML from the session
        html_string = request.session.get('plan_html')
        plan_data = request.session.get('plan_data')
        
        if not html_string or not plan_data:
            return HttpResponse('No plan data found. Please generate a plan first.', status=400)
        
        # Create a temporary file to store the PDF
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            # Generate the PDF from HTML
            HTML(string=html_string).write_pdf(tmp.name)
            
            # Read the PDF file
            with open(tmp.name, 'rb') as pdf_file:
                response = HttpResponse(pdf_file.read(), content_type='application/pdf')
                filename = f"fitness_plan_{plan_data['metadata'].get('name', 'user')}.pdf"
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                return response
    except Exception as e:
        return HttpResponse(f'Error generating PDF: {str(e)}', status=500)
