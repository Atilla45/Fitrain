from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json
import tempfile
from datetime import datetime
from weasyprint import HTML, CSS

# Import the AI assistant functions
from core.ai_assistant import process_voice_input, get_next_question, generate_voice_response

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
    return render(request, 'core/modern_landing.html')


@require_POST
def generate_plan_view(request):
    """
    Handles form submission, generates a fitness plan and returns it as JSON.
    This endpoint is called by the frontend JavaScript.
    """
    try:
        # Try to parse JSON from the request
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON data'
            }, status=400)
        
        # Generate the fitness plan
        fitness_plan = create_fitness_plan(data)
        
        # Extract data for enhanced frontend display
        goal = data.get('goal', 'general').lower()
        level = data.get('level', 'beginner').lower()
        
        # Translate goal and level to text
        goal_texts = {
            'weight_loss': 'Weight Loss',
            'muscle': 'Muscle Building',
            'strength': 'Strength',
            'endurance': 'Endurance',
            'general': 'General Fitness'
        }
        level_texts = {
            'beginner': 'Beginner',
            'intermediate': 'Intermediate',
            'advanced': 'Advanced'
        }
        preference_texts = {
            'home': 'Home',
            'gym': 'Gym',
            'outdoor': 'Outdoor'
        }
        
        goal_text = goal_texts.get(goal, 'General Fitness')
        experience_level_text = level_texts.get(level, 'Beginner')
        workout_preference_text = preference_texts.get(data.get('preference', 'home'), 'Home')
        days_per_week = f"{data.get('days', '3')} days per week"
        
        # Sample exercise data for enhanced display
        upper_body_exercises = [
            {"name": "Push-ups", "sets": "3", "reps": "10-15", "rest": "60 sec", "description": "Place hands on the floor, slightly wider than shoulders. Lower your body until your chest nearly touches the floor, then push back up."},
            {"name": "Dumbbell Rows", "sets": "3", "reps": "12", "rest": "45 sec", "description": "Bend at waist with one knee on bench. Pull dumbbell to hip, keeping elbow close to body."},
            {"name": "Shoulder Press", "sets": "3", "reps": "10", "rest": "60 sec", "description": "Press dumbbells overhead until arms are extended. Lower back down with control."},
            {"name": "Bicep Curls", "sets": "3", "reps": "12-15", "rest": "45 sec", "description": "Stand with dumbbells at sides, palms forward. Curl weights to shoulders, keeping elbows still."},
            {"name": "Tricep Dips", "sets": "3", "reps": "12", "rest": "45 sec", "description": "Lower your body by bending your elbows. Push back up to the starting position."}
        ]
        
        lower_body_exercises = [
            {"name": "Squats", "sets": "4", "reps": "12-15", "rest": "60 sec", "description": "Stand with feet shoulder-width apart. Lower by bending knees and pushing hips back. Return to standing."},
            {"name": "Lunges", "sets": "3", "reps": "10 each leg", "rest": "45 sec", "description": "Step forward with one leg and lower until both knees form 90-degree angles. Push back up."},
            {"name": "Calf Raises", "sets": "3", "reps": "15-20", "rest": "30 sec", "description": "Stand on edge of step with heels hanging off. Raise up onto toes, then lower heels below level of step."},
            {"name": "Leg Raises", "sets": "3", "reps": "12-15", "rest": "45 sec", "description": "Lie on back, legs straight. Lift legs to 90 degrees, then lower without touching floor."},
            {"name": "Deadlifts", "sets": "3", "reps": "10", "rest": "60 sec", "description": "Bend at hips and knees to lower and grab weight. Keep back straight, lift by extending hips and knees."}
        ]
        
        core_exercises = [
            {"name": "Planks", "sets": "3", "reps": "30-45 sec", "rest": "30 sec", "description": "Hold position on forearms with body straight from head to heels. Keep core engaged."},
            {"name": "Crunches", "sets": "3", "reps": "15-20", "rest": "30 sec", "description": "Lie on back with knees bent. Curl up to lift shoulder blades off floor. Lower with control."},
            {"name": "Russian Twists", "sets": "3", "reps": "20 (10 each side)", "rest": "30 sec", "description": "Sit with knees bent, feet off floor. Twist torso to touch hands to floor on each side."},
            {"name": "Leg Raises", "sets": "3", "reps": "12-15", "rest": "45 sec", "description": "Lie on back, legs straight. Lift legs to 90 degrees, then lower without touching floor."},
            {"name": "Mountain Climbers", "sets": "3", "reps": "45 sec", "rest": "30 sec", "description": "Start in push-up position. Alternately bring knees toward chest in running motion."}
        ]
        
        cardio_exercises = [
            {"name": "Running", "sets": "1", "reps": "20-30 min", "rest": "N/A", "description": "Run at a challenging but sustainable pace. Focus on even breathing and good posture."},
            {"name": "Jumping Jacks", "sets": "3", "reps": "45 sec", "rest": "20 sec", "description": "Jump while spreading legs and raising arms overhead. Jump back to starting position."},
            {"name": "Jump Rope", "sets": "3", "reps": "1 min", "rest": "30 sec", "description": "Jump just high enough for rope to pass under feet. Keep elbows close to sides."},
            {"name": "Cycling", "sets": "1", "reps": "20-30 min", "rest": "N/A", "description": "Maintain a steady cadence with moderate resistance. Keep a slight bend in elbows."},
            {"name": "High Knees", "sets": "3", "reps": "45 sec", "rest": "20 sec", "description": "Run in place, bringing knees up to hip level. Pump arms for added intensity."}
        ]
        
        # Enhanced weekly schedule with exercises
        enhanced_schedule = []
        
        # Convert the dictionary schedule to an array of day objects with exercises
        for day, workout in fitness_plan['weekly_schedule'].items():
            day_data = {
                "day": day,
                "workout": workout,
                "focus": "",
                "duration": "45-60 min",
                "exercises": []
            }
            
            # Set focus and exercises based on workout type
            if "Upper" in workout:
                day_data["focus"] = "Upper Body Strength"
                day_data["exercises"] = upper_body_exercises
            elif "Lower" in workout:
                day_data["focus"] = "Lower Body Strength"
                day_data["exercises"] = lower_body_exercises
            elif "HIIT" in workout:
                day_data["focus"] = "High Intensity Interval Training"
                day_data["exercises"] = cardio_exercises + core_exercises[:2]
            elif "Circuit" in workout:
                day_data["focus"] = "Full Body Circuit"
                day_data["exercises"] = upper_body_exercises[:2] + lower_body_exercises[:2] + core_exercises[:1]
            elif "Cardio" in workout:
                day_data["focus"] = "Cardiovascular Endurance"
                day_data["exercises"] = cardio_exercises
            elif "Rest" in workout or "Recovery" in workout:
                day_data["focus"] = "Recovery"
                day_data["duration"] = "N/A"
            else:
                # Default
                day_data["focus"] = "Full Body"
                day_data["exercises"] = upper_body_exercises[:2] + lower_body_exercises[:2] + core_exercises[:1]
            
            enhanced_schedule.append(day_data)
        
        # Sample dietary guidelines based on goal
        dietary_guidelines = ""
        if goal == "weight_loss":
            dietary_guidelines = "Focus on a calorie deficit of 300-500 calories per day. Prioritize protein (1.6-2g per kg of body weight) and fiber-rich foods. Limit processed foods, sugars, and alcohol. Stay well-hydrated with 2-3 liters of water daily."
        elif goal == "muscle":
            dietary_guidelines = "Eat in a slight calorie surplus of 200-300 calories. Consume 1.8-2.2g of protein per kg of body weight. Include plenty of complex carbohydrates to fuel workouts. Time your meals around training, with carbs and protein shortly after workouts."
        elif goal == "strength":
            dietary_guidelines = "Focus on adequate calories to support strength gains. Prioritize protein intake (1.6-2g per kg of body weight) and nutrient-dense foods. Include carbohydrates before workouts for energy. Consider creatine supplementation if appropriate."
        elif goal == "endurance":
            dietary_guidelines = "Emphasize complex carbohydrates for sustained energy. Consume 5-8g of carbs per kg of body weight. Include moderate protein (1.2-1.6g per kg). Stay well-hydrated before, during, and after training. Time carbohydrate intake around longer sessions."
        else:  # general fitness
            dietary_guidelines = "Focus on a balanced diet with plenty of whole foods. Include protein with each meal (1.2-1.6g per kg of body weight). Minimize processed foods and added sugars. Stay hydrated with 2-3 liters of water daily. Adjust portions based on activity level."
        
        # Create enhanced plan
        enhanced_plan = {
            'plan_title': f"{data.get('name', 'Your')} {goal_text} Fitness Plan",
            'introduction': f"This {experience_level_text.lower()} fitness plan focuses on {goal_text.lower()} through {workout_preference_text.lower()} workouts {days_per_week}.",
            'weekly_schedule': enhanced_schedule,
            'dietary_guidelines': dietary_guidelines,
            'pdfLink': '/download-pdf/'
        }
        
        # Convert the enhanced schedule to a proper format for the template
        enhanced_schedule_data = []
        for day, workout in fitness_plan['weekly_schedule'].items():
            day_data = {
                "day": day,
                "workout": workout,
                "focus": "",
                "duration": "45-60 min" if "Rest" not in workout else "N/A",
                "exercises": []
            }
            
            # Determine focus and exercises based on workout type
            workout_type = workout.lower()
            if "upper" in workout_type:
                day_data["focus"] = "Upper Body Strength"
                day_data["exercises"] = upper_body_exercises
            elif "lower" in workout_type:
                day_data["focus"] = "Lower Body Strength"
                day_data["exercises"] = lower_body_exercises
            elif "hiit" in workout_type:
                day_data["focus"] = "High Intensity Interval Training"
                day_data["exercises"] = cardio_exercises + core_exercises[:2]
            elif "circuit" in workout_type:
                day_data["focus"] = "Full Body Circuit"
                day_data["exercises"] = upper_body_exercises[:2] + lower_body_exercises[:2] + core_exercises[:1]
            elif "cardio" in workout_type:
                day_data["focus"] = "Cardiovascular Endurance"
                day_data["exercises"] = cardio_exercises
            elif "rest" in workout_type or "recovery" in workout_type:
                day_data["focus"] = "Recovery"
                day_data["duration"] = "N/A"
                day_data["exercises"] = []
            else:
                # Try to match with the workout exercises from the plan
                if workout in fitness_plan['workouts']:
                    day_data["focus"] = f"{workout} Workout"
                    
                    # Convert the workout exercises to the enhanced format
                    workout_exercises = []
                    for ex in fitness_plan['workouts'][workout]:
                        enhanced_ex = {
                            "name": ex['name'],
                            "sets": ex['sets'],
                            "reps": ex['reps'],
                            "rest": f"{ex.get('rest_between_sets_seconds', 60)}s",
                            "description": "Perform with proper form and control throughout the movement."
                        }
                        workout_exercises.append(enhanced_ex)
                    
                    day_data["exercises"] = workout_exercises
                else:
                    # Default
                    day_data["focus"] = "General Fitness"
                    day_data["exercises"] = []
            
            enhanced_schedule_data.append(day_data)
        
        # Create an enhanced version of the plan data for PDF generation
        enhanced_pdf_data = fitness_plan.copy()
        enhanced_pdf_data['enhanced_schedule'] = enhanced_schedule_data
        
        # Add additional data for PDF rendering
        enhanced_pdf_data['upper_body_exercises'] = upper_body_exercises
        enhanced_pdf_data['lower_body_exercises'] = lower_body_exercises
        enhanced_pdf_data['core_exercises'] = core_exercises
        enhanced_pdf_data['cardio_exercises'] = cardio_exercises
        enhanced_pdf_data['dietary_guidelines_detailed'] = dietary_guidelines
        
        # Render the plan template to HTML (for PDF generation later)
        html_string = render_to_string('core/plan_template.html', {'plan': enhanced_pdf_data})
        
        # Store the rendered HTML in the session for PDF download
        request.session['plan_html'] = html_string
        request.session['plan_data'] = enhanced_pdf_data
        
        return JsonResponse({
            'success': True,
            'plan': enhanced_plan
        })
    except Exception as e:
        import traceback
        print(f"Error generating plan: {str(e)}")
        print(traceback.format_exc())
        
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@require_POST
def process_voice(request):
    """
    Processes voice input and returns an AI-generated response.
    This endpoint is called by the frontend JavaScript when using voice input.
    """
    try:
        # Parse JSON data from the request
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON data'
            }, status=400)
        
        # Extract data from the request
        speech_text = data.get('text', '')
        language = data.get('language', 'en')
        conversation_context = data.get('context', None)
        
        # Check if we just need the next question (start of conversation)
        if not speech_text and (not conversation_context or conversation_context.get('current_question', 0) == 0):
            question, updated_context = get_next_question(language)
            
            # Generate a more engaging version of the question for voice
            enhanced_question = generate_voice_response(question, language)
            
            return JsonResponse({
                'success': True,
                'text': enhanced_question,
                'original_text': question,
                'context': updated_context
            })
        
        # Process the user's voice input with AI
        response_text, updated_context = process_voice_input(speech_text, language, conversation_context)
        
        # Generate a more engaging version for voice output
        enhanced_response = generate_voice_response(response_text, language)
        
        return JsonResponse({
            'success': True,
            'text': enhanced_response,
            'original_text': response_text,
            'context': updated_context
        })
    
    except Exception as e:
        import traceback
        print(f"Error processing voice input: {str(e)}")
        print(traceback.format_exc())
        
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

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
        
        # Define custom CSS for PDF rendering
        css_string = """
            @page {
                size: letter portrait;
                margin: 1.5cm;
                @top-right {
                    content: "Page " counter(page) " of " counter(pages);
                    font-size: 9pt;
                    color: #777;
                }
                @bottom-left {
                    content: "FitPlan Builder";
                    font-size: 9pt;
                    color: #777;
                }
                @bottom-right {
                    content: "Generated on %s";
                    font-size: 9pt;
                    color: #777;
                }
            }
            /* Ensure page breaks don't happen in the middle of important elements */
            h2, h3, .exercise, .workout-box {
                page-break-inside: avoid;
            }
            /* Add page break before major sections */
            .page-break {
                page-break-before: always;
            }
        """ % (str(datetime.now().strftime("%B %d, %Y")))
        
        # Create a temporary file to store the PDF
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            # Generate the PDF from HTML with custom CSS
            HTML(string=html_string).write_pdf(
                tmp.name,
                stylesheets=[CSS(string=css_string)]
            )
            
            # Read the PDF file
            with open(tmp.name, 'rb') as pdf_file:
                response = HttpResponse(pdf_file.read(), content_type='application/pdf')
                user_name = plan_data['metadata'].get('name', '').replace(' ', '_').lower() or 'user'
                goal = plan_data['metadata'].get('goal', 'fitness').lower()
                level = plan_data['metadata'].get('level', 'beginner').lower()
                filename = f"fitness_plan_{user_name}_{goal}_{level}.pdf"
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                return response
    except Exception as e:
        return HttpResponse(f'Error generating PDF: {str(e)}', status=500)
