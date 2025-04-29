document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const startVoiceBtn = document.getElementById('startVoiceBtn');
    const stopVoiceBtn = document.getElementById('stopVoiceBtn');
    const showFormBtn = document.getElementById('showFormBtn');
    const voiceInputStatus = document.getElementById('voiceInputStatus');
    const recognitionStatus = document.getElementById('recognitionStatus');
    const voiceProgress = document.getElementById('voiceProgress');
    const formInput = document.getElementById('formInput');
    const fitnessForm = document.getElementById('fitnessForm');
    const planResults = document.getElementById('planResults');
    const planTitle = document.getElementById('planTitle');
    const planIntro = document.getElementById('planIntro');
    const weeklySchedule = document.getElementById('weeklySchedule');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const newPlanBtn = document.getElementById('newPlanBtn');
    const languageSelector = document.getElementById('language-selector');

    // Current language - check localStorage first, default to 'en'
    let currentLanguage = localStorage.getItem('preferredLanguage') || 'en';
    
    // Set the language selector to match stored preference
    languageSelector.value = currentLanguage;

    // Form data collected through voice
    let voiceFormData = {
        name: '',
        goal: '',
        days: '',
        level: '',
        preference: '',
        restrictions: ''
    };

    // Questions to ask during voice input - in multiple languages
    const questionsMultilingual = {
        en: [
            { key: 'name', question: "What's your name?" },
            { key: 'goal', question: "What's your main fitness goal? For example, general fitness, weight loss, building muscle, etc." },
            { key: 'days', question: "How many days per week can you workout? Choose between 2 to 6 days." },
            { key: 'level', question: "What's your fitness experience level? Beginner, intermediate, or advanced?" },
            { key: 'preference', question: "Where do you prefer to workout? At home, in a gym, or outdoors?" },
            { key: 'restrictions', question: "Do you have any physical restrictions or limitations? If none, just say 'none'." }
        ],
        az: [
            { key: 'name', question: "Adınız nədir?" },
            { key: 'goal', question: "Əsas fitness hədəfiniz nədir? Məsələn, ümumi fitness, çəki azaltma, əzələ qurmaq və s." },
            { key: 'days', question: "Həftədə neçə gün məşq edə bilərsiniz? 2-dən 6-ya qədər gün seçin." },
            { key: 'level', question: "Fitness təcrübə səviyyəniz nədir? Başlanğıc, orta və ya peşəkar?" },
            { key: 'preference', question: "Məşq etməyi harada üstün tutursunuz? Evdə, idman zalında və ya açıq havada?" },
            { key: 'restrictions', question: "Hər hansı fiziki məhdudiyyətiniz var? Yoxdursa, sadəcə 'yox' deyin." }
        ],
        tr: [
            { key: 'name', question: "Adınız nedir?" },
            { key: 'goal', question: "Ana fitness hedefiniz nedir? Örneğin, genel fitness, kilo kaybı, kas yapma, vb." },
            { key: 'days', question: "Haftada kaç gün antrenman yapabilirsiniz? 2 ile 6 gün arasında seçin." },
            { key: 'level', question: "Fitness deneyim seviyeniz nedir? Başlangıç, orta veya ileri seviye?" },
            { key: 'preference', question: "Nerede antrenman yapmayı tercih edersiniz? Evde, spor salonunda veya açık havada?" },
            { key: 'restrictions', question: "Herhangi bir fiziksel kısıtlamanız var mı? Yoksa, sadece 'yok' deyin." }
        ]
    };

    // Voice language mapping
    const voiceLanguages = {
        en: 'en-US',
        az: 'az-AZ', 
        tr: 'tr-TR'
    };

    // Get questions in current language
    function getQuestions() {
        return questionsMultilingual[currentLanguage] || questionsMultilingual.en;
    }

    let questions = getQuestions();
    let currentQuestionIndex = 0;
    let recognition = null;
    let isListening = false;
    let attemptCount = 0; // To track how many times we've asked the same question

    // Speech recognition setup
    function setupSpeechRecognition() {
        // Check if browser supports speech recognition
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Sorry, your browser doesn't support speech recognition. Please use the form input instead.");
            showFormInput();
            return false;
        }

        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = voiceLanguages[currentLanguage];

        // Handle speech recognition results
        recognition.onresult = function(event) {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            recognitionStatus.textContent = `I heard: "${transcript}"`;
            
            // Update progress bar for visual feedback
            voiceProgress.style.width = `${((currentQuestionIndex + 1) / questions.length) * 100}%`;
            
            // Reset attempt counter when we get a response
            attemptCount = 0;
        };

        // When recognition stops
        recognition.onend = function() {
            if (isListening) {
                const transcript = recognitionStatus.textContent.replace('I heard: "', '').replace('"', '').trim();
                
                // Process the answer
                if (transcript && transcript !== '') {
                    voiceFormData[questions[currentQuestionIndex].key] = transcript;
                    
                    // Move to next question or finish
                    currentQuestionIndex++;
                    attemptCount = 0; // Reset for the next question
                    
                    if (currentQuestionIndex < questions.length) {
                        // Ask next question
                        setTimeout(() => {
                            askQuestion(questions[currentQuestionIndex].question);
                        }, 1000);
                    } else {
                        // Finish voice input
                        finishVoiceInput();
                    }
                } else {
                    // If no valid transcript, ask the same question again but differently
                    attemptCount++;
                    
                    let followUpMessage = "";
                    
                    if (currentLanguage === 'en') {
                        followUpMessage = attemptCount === 1 ? 
                            "I didn't catch that. Could you please try again?" : 
                            "I'm still having trouble understanding. Let me ask again...";
                    } else if (currentLanguage === 'az') {
                        followUpMessage = attemptCount === 1 ? 
                            "Eşitmədim. Zəhmət olmasa, bir daha cəhd edin?" : 
                            "Hələ də başa düşməkdə çətinlik çəkirəm. Yenidən soruşum...";
                    } else if (currentLanguage === 'tr') {
                        followUpMessage = attemptCount === 1 ? 
                            "Anlamadım. Lütfen tekrar dener misiniz?" : 
                            "Hala anlamakta zorlanıyorum. Tekrar sorayım...";
                    }
                    
                    // First give feedback, then repeat the question
                    setTimeout(() => {
                        speakText(followUpMessage, () => {
                            setTimeout(() => {
                                askQuestion(questions[currentQuestionIndex].question);
                            }, 500);
                        });
                    }, 500);
                }
            }
        };

        // Handle errors
        recognition.onerror = function(event) {
            console.error('Speech recognition error', event.error);
            
            let errorMessage = "";
            if (currentLanguage === 'en') {
                errorMessage = `There was a small issue with the voice recognition. Let's try again or you can use the form instead.`;
            } else if (currentLanguage === 'az') {
                errorMessage = `Səs tanıma ilə bağlı kiçik bir problem oldu. Yenidən cəhd edək və ya bunun əvəzinə formanı istifadə edə bilərsiniz.`;
            } else if (currentLanguage === 'tr') {
                errorMessage = `Ses tanıma ile ilgili küçük bir sorun oluştu. Tekrar deneyelim veya form kullanabilirsiniz.`;
            }
            
            recognitionStatus.textContent = errorMessage;
            isListening = false;
        };

        return true;
    }

    // Start voice input process
    function startVoiceInput() {
        // Update questions based on current language
        questions = getQuestions();
        
        if (!setupSpeechRecognition()) return;

        // Add animation classes
        startVoiceBtn.classList.add('voice-active-btn');
        startVoiceBtn.querySelector('i').classList.add('voice-active-icon');

        // Reset and start
        currentQuestionIndex = 0;
        attemptCount = 0;
        voiceFormData = {
            name: '',
            goal: '',
            days: '',
            level: '',
            preference: '',
            restrictions: ''
        };
        
        voiceInputStatus.classList.remove('hidden');
        formInput.classList.add('hidden');
        planResults.classList.add('hidden');
        
        askQuestion(questions[currentQuestionIndex].question);
    }
    
    // Helper function to speak text and call a callback when done
    function speakText(text, callback) {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Preload voices
        speechSynthesis.getVoices();
        
        // Set voice properties
        utterance.lang = voiceLanguages[currentLanguage];
        utterance.pitch = 1.2;          // Higher pitch for more feminine voice (1.0 is default)
        utterance.rate = 0.95;          // Slightly slower rate for better clarity
        utterance.volume = 1.0;         // Full volume
        
        // Try to find the best female voice for the current language
        window.setTimeout(() => {
            // Get all available voices
            const voices = speechSynthesis.getVoices();
            console.log("Available voices:", voices.map(v => v.name));
            
            // Try to find a female voice for the current language
            let selectedVoice = null;
            
            // First priority: female voice that matches the language
            selectedVoice = voices.find(voice => 
                (voice.name.toLowerCase().includes('female') || 
                 voice.name.toLowerCase().includes('woman') ||
                 voice.name.toLowerCase().includes('girl')) && 
                voice.lang.startsWith(utterance.lang.split('-')[0])
            );
            
            // Second priority: any female voice
            if (!selectedVoice) {
                selectedVoice = voices.find(voice => 
                    voice.name.toLowerCase().includes('female') || 
                    voice.name.toLowerCase().includes('woman') ||
                    voice.name.toLowerCase().includes('girl')
                );
            }
            
            // Third priority: just use the first voice for the language
            if (!selectedVoice) {
                selectedVoice = voices.find(voice => 
                    voice.lang.startsWith(utterance.lang.split('-')[0])
                );
            }
            
            if (selectedVoice) {
                console.log("Selected voice:", selectedVoice.name);
                utterance.voice = selectedVoice;
            }
            
            // Make the text more friendly - add conversational touches
            let friendlyText = text;
            
            // Only add friendly elements for questions, not for feedback statements
            if (text.endsWith("?")) {
                // Add friendly intros based on language
                const randomIntro = Math.random() > 0.5;
                
                if (currentLanguage === 'en') {
                    if (currentQuestionIndex === 0) {
                        friendlyText = "Hi there! " + friendlyText;
                    } else if (randomIntro) {
                        const intros = ["Great! ", "Wonderful! ", "Awesome! ", "Perfect! ", "Thanks! "];
                        friendlyText = intros[Math.floor(Math.random() * intros.length)] + friendlyText;
                    }
                } else if (currentLanguage === 'az') {
                    if (currentQuestionIndex === 0) {
                        friendlyText = "Salam! " + friendlyText;
                    } else if (randomIntro) {
                        const intros = ["Əla! ", "Gözəl! ", "Təşəkkürlər! "];
                        friendlyText = intros[Math.floor(Math.random() * intros.length)] + friendlyText;
                    }
                } else if (currentLanguage === 'tr') {
                    if (currentQuestionIndex === 0) {
                        friendlyText = "Merhaba! " + friendlyText;
                    } else if (randomIntro) {
                        const intros = ["Harika! ", "Mükemmel! ", "Teşekkürler! "];
                        friendlyText = intros[Math.floor(Math.random() * intros.length)] + friendlyText;
                    }
                }
            }
            
            utterance.text = friendlyText;
            
            // Execute callback when speech is done
            if (callback) {
                utterance.onend = callback;
            }
            
            speechSynthesis.speak(utterance);
        }, 100);
        
        return utterance;
    }

    // Ask a question using speech synthesis
    function askQuestion(question) {
        recognitionStatus.textContent = question;
        
        // Use speech synthesis to ask the question with a female voice if possible
        speakText(question, function() {
            // Start listening after question is spoken
            isListening = true;
            recognition.start();
        });
    }

    // Finish voice input and submit the form
    function finishVoiceInput() {
        isListening = false;
        voiceInputStatus.classList.add('hidden');
        
        // Remove animation classes
        startVoiceBtn.classList.remove('voice-active-btn');
        startVoiceBtn.querySelector('i').classList.remove('voice-active-icon');
        
        // Process the collected voice data
        recognitionStatus.textContent = "Processing your plan...";
        
        // Clean up and process the data
        if (voiceFormData.days) {
            // Extract the number from the days answer
            const daysMatch = voiceFormData.days.match(/\d+/);
            if (daysMatch) {
                voiceFormData.days = daysMatch[0];
            } else {
                voiceFormData.days = '3'; // Default to 3 if no number found
            }
        }
        
        if (voiceFormData.goal) {
            // Map common phrases to specific goals
            const goalLower = voiceFormData.goal.toLowerCase();
            if (goalLower.includes('weight') || goalLower.includes('fat') || goalLower.includes('slim')) {
                voiceFormData.goal = 'weight_loss';
            } else if (goalLower.includes('muscle') || goalLower.includes('bulk')) {
                voiceFormData.goal = 'muscle';
            } else if (goalLower.includes('strength') || goalLower.includes('strong')) {
                voiceFormData.goal = 'strength';
            } else if (goalLower.includes('endurance') || goalLower.includes('stamina')) {
                voiceFormData.goal = 'endurance';
            } else {
                voiceFormData.goal = 'general';
            }
        }
        
        if (voiceFormData.level) {
            // Map experience level
            const levelLower = voiceFormData.level.toLowerCase();
            if (levelLower.includes('begin') || levelLower.includes('new') || levelLower.includes('start')) {
                voiceFormData.level = 'beginner';
            } else if (levelLower.includes('inter') || levelLower.includes('some')) {
                voiceFormData.level = 'intermediate';
            } else if (levelLower.includes('adv') || levelLower.includes('expert')) {
                voiceFormData.level = 'advanced';
            } else {
                voiceFormData.level = 'beginner';
            }
        }
        
        if (voiceFormData.preference) {
            // Map workout preference
            const prefLower = voiceFormData.preference.toLowerCase();
            if (prefLower.includes('home') || prefLower.includes('house')) {
                voiceFormData.preference = 'home';
            } else if (prefLower.includes('gym') || prefLower.includes('fitness')) {
                voiceFormData.preference = 'gym';
            } else if (prefLower.includes('out') || prefLower.includes('park')) {
                voiceFormData.preference = 'outdoor';
            } else {
                voiceFormData.preference = 'home';
            }
        }
        
        if (voiceFormData.restrictions && 
            (voiceFormData.restrictions.toLowerCase().includes('none') || 
             voiceFormData.restrictions.toLowerCase().includes('no'))) {
            voiceFormData.restrictions = '';
        }
        
        // Submit the collected data
        generatePlan(voiceFormData);
    }

    // Show the form input
    function showFormInput() {
        voiceInputStatus.classList.add('hidden');
        formInput.classList.remove('hidden');
        planResults.classList.add('hidden');
        
        // Remove animation classes if they exist
        startVoiceBtn.classList.remove('voice-active-btn');
        startVoiceBtn.querySelector('i').classList.remove('voice-active-icon');
        
        if (recognition) {
            isListening = false;
            recognition.abort();
        }
    }

    // Generate a fitness plan from form data
    function generatePlan(formData) {
        // Show a loading indicator
        planResults.classList.add('hidden');
        document.body.style.cursor = 'wait';
        
        // Get CSRF token from form or meta tag
        const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]')?.value || getCsrfToken();
        
        // Show loading message
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'fixed top-0 left-0 w-full bg-blue-600 text-white text-center py-2 z-50';
        loadingMessage.id = 'loadingMessage';
        loadingMessage.innerHTML = 'Generating your fitness plan...';
        document.body.appendChild(loadingMessage);
        
        // Make API request to generate the plan
        fetch('/generate-plan/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                console.error('Server returned error:', response.status, response.statusText);
                throw new Error(`Server error: ${response.status}. Please try again.`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                displayPlanResults(data.plan);
            } else {
                throw new Error(data.error || 'Unknown error occurred');
            }
        })
        .catch(error => {
            console.error('Error details:', error);
            
            // Show error message in the appropriate language
            let errorMsg = '';
            if (currentLanguage === 'en') {
                errorMsg = 'Error generating plan: ' + error.message + '. Please try again.';
            } else if (currentLanguage === 'az') {
                errorMsg = 'Plan yaradılanda xəta: ' + error.message + '. Zəhmət olmasa bir daha cəhd edin.';
            } else if (currentLanguage === 'tr') {
                errorMsg = 'Plan oluşturulurken hata: ' + error.message + '. Lütfen tekrar deneyin.';
            } else {
                errorMsg = 'Error generating plan: ' + error.message;
            }
            
            // Create a nicer error message element instead of using alert
            const errorElement = document.createElement('div');
            errorElement.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4';
            errorElement.innerHTML = `
                <strong class="font-bold">Error!</strong>
                <span class="block sm:inline">${errorMsg}</span>
            `;
            
            formInput.insertBefore(errorElement, fitnessForm);
            
            // Remove the error after 5 seconds
            setTimeout(() => {
                if (errorElement.parentNode === formInput) {
                    formInput.removeChild(errorElement);
                }
            }, 5000);
        })
        .finally(() => {
            document.body.style.cursor = 'default';
            
            // Remove loading message
            const loadingMsg = document.getElementById('loadingMessage');
            if (loadingMsg) {
                document.body.removeChild(loadingMsg);
            }
        });
    }

    // Display the generated plan
    // Helper function to get exercise image URL based on exercise name
    function getExerciseImageUrl(exerciseName) {
        // Map of exercise names to image URLs
        const exerciseImages = {
            // Cardio
            'Running': 'https://cdn.pixabay.com/photo/2016/11/18/13/23/action-1834465_640.jpg',
            'Jogging': 'https://cdn.pixabay.com/photo/2020/01/21/11/39/running-4782722_640.jpg',
            'Jumping Jacks': 'https://cdn.pixabay.com/photo/2022/07/09/16/57/exercise-7311493_640.jpg',
            'Cycling': 'https://cdn.pixabay.com/photo/2014/09/19/22/09/bicycle-452271_640.jpg',
            'Jump Rope': 'https://cdn.pixabay.com/photo/2019/09/01/20/25/skipping-rope-4446219_640.jpg',
            'Swimming': 'https://cdn.pixabay.com/photo/2016/06/25/12/52/laptop-1478822_640.jpg',
            
            // Upper Body
            'Push-ups': 'https://cdn.pixabay.com/photo/2018/10/01/22/57/sport-3716668_640.jpg',
            'Pull-ups': 'https://cdn.pixabay.com/photo/2019/06/19/11/40/pull-ups-4284216_640.jpg',
            'Dumbbell Rows': 'https://cdn.pixabay.com/photo/2015/07/02/10/27/training-828741_640.jpg',
            'Bench Press': 'https://cdn.pixabay.com/photo/2016/03/27/07/08/man-1282232_640.jpg',
            'Shoulder Press': 'https://cdn.pixabay.com/photo/2014/11/26/16/40/pull-up-546232_640.jpg',
            'Tricep Dips': 'https://cdn.pixabay.com/photo/2021/01/03/03/43/man-5884546_640.jpg',
            'Bicep Curls': 'https://cdn.pixabay.com/photo/2015/01/10/17/32/physiotherapy-596257_640.jpg',
            
            // Lower Body
            'Squats': 'https://cdn.pixabay.com/photo/2015/07/02/10/23/training-828726_640.jpg',
            'Lunges': 'https://cdn.pixabay.com/photo/2017/04/22/10/15/woman-2250970_640.jpg',
            'Deadlifts': 'https://cdn.pixabay.com/photo/2016/11/29/12/10/barbell-1869146_640.jpg',
            'Leg Press': 'https://cdn.pixabay.com/photo/2017/01/09/14/40/bodybuilder-1966804_640.jpg',
            'Calf Raises': 'https://cdn.pixabay.com/photo/2020/11/24/16/35/man-5772408_640.jpg',
            
            // Core
            'Planks': 'https://cdn.pixabay.com/photo/2017/08/07/14/02/people-2604149_640.jpg',
            'Crunches': 'https://cdn.pixabay.com/photo/2015/07/02/10/26/training-828738_640.jpg',
            'Russian Twists': 'https://cdn.pixabay.com/photo/2020/11/24/16/35/man-5772403_640.jpg',
            'Leg Raises': 'https://cdn.pixabay.com/photo/2017/04/27/08/29/man-2264825_640.jpg',
            
            // Default
            'default': 'https://cdn.pixabay.com/photo/2014/11/17/13/17/crossfit-534615_640.jpg'
        };
        
        // Try to match the exercise name (case insensitive)
        const normalized = exerciseName.trim();
        for (const [name, url] of Object.entries(exerciseImages)) {
            if (normalized.toLowerCase().includes(name.toLowerCase())) {
                return url;
            }
        }
        
        // Return default image if no match
        return exerciseImages.default;
    }
    
    // Helper function to get exercise instructions
    function getExerciseInstructions(exerciseName) {
        const exerciseInstructions = {
            // Common exercises with detailed instructions
            'Push-ups': 'Place hands slightly wider than shoulders. Keep body in straight line from head to heels. Bend elbows to lower chest to the floor, then push back up.',
            'Pull-ups': 'Hang from bar with palms facing away. Pull your body up until chin is above the bar. Lower with control.',
            'Squats': 'Stand with feet shoulder-width apart. Lower your body as if sitting in a chair. Keep chest up and knees behind toes. Push through heels to stand back up.',
            'Lunges': 'Stand with feet hip-width apart. Step one foot forward and lower body until both knees form 90-degree angles. Push back to start position and repeat with other leg.',
            'Planks': 'Start in push-up position, lower onto forearms. Keep body in straight line from head to heels. Engage core and hold the position.',
            'Running': 'Maintain upright posture with slight forward lean. Land midfoot and roll to push off with toes. Bend arms at 90 degrees and swing from shoulders.',
            'Jumping Jacks': 'Start with feet together and arms at sides. Jump feet apart while raising arms overhead. Jump back to starting position and repeat.',
            'Bicep Curls': 'Stand with weights at sides, palms forward. Keeping upper arms stationary, bend elbows to lift weights to shoulders. Lower with control and repeat.'
        };
        
        // Try to match the exercise name (case insensitive)
        const normalized = exerciseName.trim();
        for (const [name, instructions] of Object.entries(exerciseInstructions)) {
            if (normalized.toLowerCase().includes(name.toLowerCase())) {
                return instructions;
            }
        }
        
        // Return generic instructions if no match
        return 'Perform the exercise with proper form, focusing on controlled movements. Breathe steadily throughout the movement.';
    }
    
    function displayPlanResults(plan) {
        // Hide other sections and show results
        voiceInputStatus.classList.add('hidden');
        formInput.classList.add('hidden');
        planResults.classList.remove('hidden');
        
        // Populate plan details
        planTitle.textContent = plan.plan_title || 'Your Personalized Fitness Plan';
        planIntro.textContent = plan.introduction || 'Here is your customized fitness plan based on your goals and preferences.';
        
        // Get translations based on current language
        const translations = {
            en: {
                schedule: "Weekly Schedule",
                day: "Day",
                focus: "Focus",
                exercises: "Exercises",
                sets: "Sets",
                reps: "Reps",
                details: "View Details",
                rest: "Rest",
                diet: "Dietary Guidelines",
                workout: "Workout"
            },
            az: {
                schedule: "Həftəlik Qrafik",
                day: "Gün",
                focus: "Fokus",
                exercises: "Məşqlər",
                sets: "Setlər",
                reps: "Təkrarlar",
                details: "Ətraflı Bax",
                rest: "İstirahət",
                diet: "Qidalanma Təlimatları",
                workout: "Məşq"
            },
            tr: {
                schedule: "Haftalık Program",
                day: "Gün",
                focus: "Odak",
                exercises: "Egzersizler",
                sets: "Setler",
                reps: "Tekrarlar",
                details: "Detayları Gör",
                rest: "Dinlenme",
                diet: "Beslenme Kılavuzu",
                workout: "Antrenman"
            }
        };
        
        const lang = translations[currentLanguage] || translations.en;
        
        // Populate weekly schedule with enhanced details
        weeklySchedule.innerHTML = '';
        
        // Add section title
        const scheduleTitle = document.createElement('h3');
        scheduleTitle.className = 'text-xl font-bold text-gray-800 mb-4';
        scheduleTitle.textContent = lang.schedule;
        weeklySchedule.appendChild(scheduleTitle);
        
        // Create grid for workout cards
        const cardGrid = document.createElement('div');
        cardGrid.className = 'grid grid-cols-1 md:grid-cols-3 gap-4';
        weeklySchedule.appendChild(cardGrid);
        
        // Process the weekly schedule
        if (plan.weekly_schedule) {
            for (const [day, workout] of Object.entries(plan.weekly_schedule)) {
                // Create workout card
                const dayCard = document.createElement('div');
                dayCard.className = 'bg-white shadow rounded-lg overflow-hidden transition-transform hover:shadow-lg';
                
                // Create day header with gradient
                const dayHeader = document.createElement('div');
                dayHeader.className = 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4';
                dayHeader.innerHTML = `<h4 class="font-bold">${day}</h4>`;
                
                // Create workout details
                const workoutDetails = document.createElement('div');
                workoutDetails.className = 'p-4';
                
                // Extract focus/target areas from workout text
                let focus = 'Full Body';
                if (workout.toLowerCase().includes('upper')) {
                    focus = 'Upper Body';
                } else if (workout.toLowerCase().includes('lower')) {
                    focus = 'Lower Body';
                } else if (workout.toLowerCase().includes('cardio')) {
                    focus = 'Cardio';
                } else if (workout.toLowerCase().includes('core')) {
                    focus = 'Core';
                } else if (workout.toLowerCase().includes('rest')) {
                    focus = 'Rest Day';
                }
                
                // Choose image based on workout focus
                let workoutImage = getExerciseImageUrl(focus);
                
                // Generate suggested exercises based on focus
                let suggestedExercises = [];
                if (focus === 'Upper Body') {
                    suggestedExercises = ['Push-ups', 'Pull-ups', 'Dumbbell Rows', 'Shoulder Press', 'Bicep Curls'];
                } else if (focus === 'Lower Body') {
                    suggestedExercises = ['Squats', 'Lunges', 'Deadlifts', 'Calf Raises', 'Leg Raises'];
                } else if (focus === 'Cardio') {
                    suggestedExercises = ['Running', 'Jumping Jacks', 'Jump Rope', 'Cycling', 'Swimming'];
                } else if (focus === 'Core') {
                    suggestedExercises = ['Planks', 'Crunches', 'Russian Twists', 'Leg Raises'];
                } else {
                    suggestedExercises = ['Push-ups', 'Squats', 'Planks', 'Jumping Jacks', 'Lunges'];
                }
                
                // Add a small thumbnail image
                workoutDetails.innerHTML = `
                    <div class="flex items-start">
                        <div class="mr-3 flex-shrink-0">
                            <img src="${workoutImage}" alt="${focus}" class="w-16 h-16 rounded object-cover shadow">
                        </div>
                        <div>
                            <p class="text-blue-600 font-medium">${workout}</p>
                            <p class="text-gray-600 text-sm">${lang.focus}: ${focus}</p>
                        </div>
                    </div>
                `;
                
                // Only show exercise details for workout days (not rest days)
                if (!workout.toLowerCase().includes('rest')) {
                    // Add suggested exercises with toggle button
                    const exercisesContainer = document.createElement('div');
                    exercisesContainer.className = 'mt-4 pt-3 border-t border-gray-200';
                    
                    // Create toggle button for exercise details
                    const toggleButton = document.createElement('button');
                    toggleButton.className = 'w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded flex justify-between items-center';
                    toggleButton.innerHTML = `
                        <span>${lang.exercises} (${suggestedExercises.length})</span>
                        <i class="fas fa-chevron-down"></i>
                    `;
                    
                    // Create collapsible content
                    const exerciseDetails = document.createElement('div');
                    exerciseDetails.className = 'hidden mt-3 bg-gray-50 rounded p-3';
                    exerciseDetails.innerHTML = '<ul class="space-y-2"></ul>';
                    
                    // Add exercises to the list
                    const exerciseList = exerciseDetails.querySelector('ul');
                    suggestedExercises.forEach((exercise) => {
                        const exerciseItem = document.createElement('li');
                        exerciseItem.className = 'flex items-center';
                        
                        // Get small icon image
                        const iconUrl = getExerciseImageUrl(exercise);
                        
                        exerciseItem.innerHTML = `
                            <img src="${iconUrl}" alt="${exercise}" class="w-8 h-8 rounded-full object-cover mr-2">
                            <span class="flex-grow">${exercise}</span>
                            <span class="text-gray-500 text-sm">3×12</span>
                        `;
                        
                        exerciseList.appendChild(exerciseItem);
                    });
                    
                    // Toggle visibility when button is clicked
                    toggleButton.addEventListener('click', () => {
                        exerciseDetails.classList.toggle('hidden');
                        toggleButton.querySelector('i').classList.toggle('fa-chevron-down');
                        toggleButton.querySelector('i').classList.toggle('fa-chevron-up');
                    });
                    
                    exercisesContainer.appendChild(toggleButton);
                    exercisesContainer.appendChild(exerciseDetails);
                    workoutDetails.appendChild(exercisesContainer);
                }
                
                // Assemble card
                dayCard.appendChild(dayHeader);
                dayCard.appendChild(workoutDetails);
                cardGrid.appendChild(dayCard);
            }
        }
        
        // Add dietary guidelines section if available
        if (plan.dietary_guidelines) {
            const dietSection = document.createElement('div');
            dietSection.className = 'mt-8 bg-white shadow rounded-lg p-6';
            
            dietSection.innerHTML = `
                <h3 class="text-xl font-bold text-gray-800 mb-4">${lang.diet}</h3>
                <div class="prose max-w-none">
                    <p>${plan.dietary_guidelines}</p>
                </div>
            `;
            
            weeklySchedule.appendChild(dietSection);
        }
        
        // Setup download button
        downloadPdfBtn.setAttribute('href', '/download-pdf/');
        
        // Scroll to results
        planResults.scrollIntoView({ behavior: 'smooth' });
    }

    // Get CSRF token for POST requests
    function getCsrfToken() {
        // Look for the CSRF token in the cookie
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
        
        if (cookieValue) return cookieValue;
        
        // If not found in cookie, look for it in a meta tag (Django often puts it there)
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        // If still not found, get it from the form (Django includes it in all forms)
        if (!csrfToken) {
            const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
            if (csrfInput) return csrfInput.value;
        }
        
        return csrfToken || '';
    }

    // Event listeners
    startVoiceBtn.addEventListener('click', startVoiceInput);
    
    stopVoiceBtn.addEventListener('click', function() {
        if (recognition) {
            isListening = false;
            recognition.abort();
            
            // Remove animation classes
            startVoiceBtn.classList.remove('voice-active-btn');
            startVoiceBtn.querySelector('i').classList.remove('voice-active-icon');
            
            showFormInput();
        }
    });
    
    showFormBtn.addEventListener('click', showFormInput);
    
    // Language selector event listener
    languageSelector.addEventListener('change', function(e) {
        currentLanguage = e.target.value;
        questions = getQuestions();
        
        console.log("Language changed to:", currentLanguage);
        
        // Immediately update the recognition language if recognition is active
        if (recognition) {
            recognition.lang = voiceLanguages[currentLanguage];
            console.log("Recognition language updated to:", recognition.lang);
        }
        
        // Update UI text based on language
        updateUIText();
        
        // Update dropdown selection to visually confirm change
        languageSelector.value = currentLanguage;
        
        // Store language preference in localStorage
        localStorage.setItem('preferredLanguage', currentLanguage);
        
        // Show a confirmation message
        const message = document.createElement('div');
        message.className = 'fixed top-0 left-0 w-full bg-green-500 text-white text-center py-2 z-50';
        message.id = 'languageMessage';
        
        // Language-specific confirmation message
        if (currentLanguage === 'en') {
            message.innerHTML = 'Language changed to English!';
        } else if (currentLanguage === 'az') {
            message.innerHTML = 'Dil Azərbaycancaya dəyişdirildi!';
        } else if (currentLanguage === 'tr') {
            message.innerHTML = 'Dil Türkçeye değiştirildi!';
        }
        
        document.body.appendChild(message);
        
        // Remove the message after 2 seconds
        setTimeout(() => {
            if (document.getElementById('languageMessage')) {
                document.body.removeChild(document.getElementById('languageMessage'));
            }
        }, 2000);
        
        // Also test the voice in the new language - force a small delay to ensure the speech engine is ready
        setTimeout(() => {
            try {
                if (currentLanguage === 'en') {
                    speakText("Language changed to English! The voice will now speak in English.", null);
                } else if (currentLanguage === 'az') {
                    speakText("Dil Azərbaycancaya dəyişdirildi! Artıq səs Azərbaycanca danışacaq.", null);
                } else if (currentLanguage === 'tr') {
                    speakText("Dil Türkçeye değiştirildi! Ses artık Türkçe konuşacak.", null);
                }
            } catch (e) {
                console.error("Error while trying to speak:", e);
            }
        }, 300);
        
        // Force reload page options for form inputs
        updateFormOptions();
    });
    
    // Update form options based on selected language
    function updateFormOptions() {
        const goalOptions = {
            en: [
                { value: 'general', text: 'General Fitness & Health' },
                { value: 'weight_loss', text: 'Weight Loss' },
                { value: 'muscle', text: 'Build Muscle' },
                { value: 'strength', text: 'Increase Strength' },
                { value: 'endurance', text: 'Improve Endurance' }
            ],
            az: [
                { value: 'general', text: 'Ümumi Fitness və Sağlamlıq' },
                { value: 'weight_loss', text: 'Çəki Vermək' },
                { value: 'muscle', text: 'Əzələ Qurmaq' },
                { value: 'strength', text: 'Gücü Artırmaq' },
                { value: 'endurance', text: 'Dözümlülüyü Artırmaq' }
            ],
            tr: [
                { value: 'general', text: 'Genel Fitness ve Sağlık' },
                { value: 'weight_loss', text: 'Kilo Vermek' },
                { value: 'muscle', text: 'Kas Yapmak' },
                { value: 'strength', text: 'Güç Artırmak' },
                { value: 'endurance', text: 'Dayanıklılığı Artırmak' }
            ]
        };
        
        const levelOptions = {
            en: [
                { value: 'beginner', text: 'Beginner' },
                { value: 'intermediate', text: 'Intermediate' },
                { value: 'advanced', text: 'Advanced' }
            ],
            az: [
                { value: 'beginner', text: 'Başlanğıc' },
                { value: 'intermediate', text: 'Orta' },
                { value: 'advanced', text: 'Peşəkar' }
            ],
            tr: [
                { value: 'beginner', text: 'Başlangıç' },
                { value: 'intermediate', text: 'Orta Seviye' },
                { value: 'advanced', text: 'İleri Seviye' }
            ]
        };
        
        const prefOptions = {
            en: [
                { value: 'home', text: 'Home Workouts' },
                { value: 'gym', text: 'Gym Workouts' },
                { value: 'outdoor', text: 'Outdoor Workouts' }
            ],
            az: [
                { value: 'home', text: 'Ev Məşqləri' },
                { value: 'gym', text: 'İdman Zalı Məşqləri' },
                { value: 'outdoor', text: 'Açıq Havada Məşqlər' }
            ],
            tr: [
                { value: 'home', text: 'Ev Antrenmanları' },
                { value: 'gym', text: 'Spor Salonu Antrenmanları' },
                { value: 'outdoor', text: 'Açık Hava Antrenmanları' }
            ]
        };
        
        const daysOptions = {
            en: [
                { value: '2', text: '2 days' },
                { value: '3', text: '3 days' },
                { value: '4', text: '4 days' },
                { value: '5', text: '5 days' },
                { value: '6', text: '6 days' }
            ],
            az: [
                { value: '2', text: '2 gün' },
                { value: '3', text: '3 gün' },
                { value: '4', text: '4 gün' },
                { value: '5', text: '5 gün' },
                { value: '6', text: '6 gün' }
            ],
            tr: [
                { value: '2', text: '2 gün' },
                { value: '3', text: '3 gün' },
                { value: '4', text: '4 gün' },
                { value: '5', text: '5 gün' },
                { value: '6', text: '6 gün' }
            ]
        };
        
        // Update all select elements with localized options
        updateSelectOptions('goal', goalOptions[currentLanguage] || goalOptions.en);
        updateSelectOptions('level', levelOptions[currentLanguage] || levelOptions.en);
        updateSelectOptions('preference', prefOptions[currentLanguage] || prefOptions.en);
        updateSelectOptions('days', daysOptions[currentLanguage] || daysOptions.en);
    }
    
    // Helper function to update select options
    function updateSelectOptions(selectId, options) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        // Save current value
        const currentValue = select.value;
        
        // Clear current options
        select.innerHTML = '';
        
        // Add new options
        options.forEach(option => {
            const optElement = document.createElement('option');
            optElement.value = option.value;
            optElement.textContent = option.text;
            select.appendChild(optElement);
        });
        
        // Restore previous selection if possible
        select.value = currentValue;
    }
    
    // Update UI text based on selected language
    function updateUIText() {
        const translations = {
            en: {
                startVoice: "Start Voice Input",
                useForm: "Use Text Form",
                generate: "Generate My Fitness Plan",
                download: "Download PDF",
                newPlan: "Create New Plan",
                nameLabel: "Your Name",
                goalLabel: "Main Fitness Goal",
                daysLabel: "Days Per Week Available",
                levelLabel: "Experience Level",
                prefLabel: "Workout Preference",
                restrictionsLabel: "Any Physical Restrictions?",
                // New translations for sections
                planTitle: "Your Personalized Fitness Plan",
                weeklySchedule: "Weekly Schedule",
                exercises: "Exercises",
                instructions: "Instructions",
                dietaryGuidelines: "Dietary Guidelines",
                setsReps: "Sets & Reps"
            },
            az: {
                startVoice: "Səsli Daxil Etməyə Başlayın",
                useForm: "Mətn Formunu İstifadə Edin",
                generate: "Fitnes Planımı Yarat",
                download: "PDF Yüklə",
                newPlan: "Yeni Plan Yarat",
                nameLabel: "Adınız",
                goalLabel: "Əsas Fitness Hədəfiniz",
                daysLabel: "Həftədə Neçə Gün Çalışa Bilərsiniz",
                levelLabel: "Təcrübə Səviyyəsi",
                prefLabel: "Məşq Üstünlüyü",
                restrictionsLabel: "Hər Hansı Fiziki Məhdudiyyətlər?",
                // New translations for sections
                planTitle: "Sizin Fərdi Fitness Planınız",
                weeklySchedule: "Həftəlik Qrafik",
                exercises: "Məşqlər",
                instructions: "Təlimatlar",
                dietaryGuidelines: "Qidalanma Təlimatları",
                setsReps: "Setlər və Təkrarlar"
            },
            tr: {
                startVoice: "Sesli Girişe Başla",
                useForm: "Metin Formunu Kullan",
                generate: "Fitness Planımı Oluştur",
                download: "PDF İndir",
                newPlan: "Yeni Plan Oluştur",
                nameLabel: "Adınız",
                goalLabel: "Ana Fitness Hedefiniz",
                daysLabel: "Haftada Kaç Gün Müsaitsiniz",
                levelLabel: "Deneyim Seviyesi",
                prefLabel: "Antrenman Tercihi",
                restrictionsLabel: "Herhangi Bir Fiziksel Kısıtlamanız Var Mı?",
                // New translations for sections
                planTitle: "Kişiselleştirilmiş Fitness Planınız",
                weeklySchedule: "Haftalık Program",
                exercises: "Egzersizler",
                instructions: "Talimatlar",
                dietaryGuidelines: "Beslenme Kılavuzu",
                setsReps: "Set ve Tekrarlar"
            }
        };
        
        const lang = translations[currentLanguage] || translations.en;
        
        // Update button text
        startVoiceBtn.innerHTML = `<i class="fas fa-microphone mr-2"></i> ${lang.startVoice}`;
        showFormBtn.innerHTML = `<i class="fas fa-keyboard mr-2"></i> ${lang.useForm}`;
        document.querySelector('#fitnessForm button[type="submit"]').textContent = lang.generate;
        downloadPdfBtn.innerHTML = `<i class="fas fa-file-pdf mr-2"></i> ${lang.download}`;
        newPlanBtn.innerHTML = `<i class="fas fa-redo mr-2"></i> ${lang.newPlan}`;
        
        // Update labels
        document.querySelector('label[for="name"]').textContent = lang.nameLabel;
        document.querySelector('label[for="goal"]').textContent = lang.goalLabel;
        document.querySelector('label[for="days"]').textContent = lang.daysLabel;
        document.querySelector('label[for="level"]').textContent = lang.levelLabel;
        document.querySelector('label[for="preference"]').textContent = lang.prefLabel;
        document.querySelector('label[for="restrictions"]').textContent = lang.restrictionsLabel;
        
        // Update form options as well
        updateFormOptions();
    }
    
    fitnessForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Collect form data
        const formData = {
            name: document.getElementById('name').value,
            goal: document.getElementById('goal').value,
            days: document.getElementById('days').value,
            level: document.getElementById('level').value,
            preference: document.getElementById('preference').value,
            restrictions: document.getElementById('restrictions').value
        };
        
        generatePlan(formData);
    });
    
    newPlanBtn.addEventListener('click', function() {
        // Reset to initial state
        planResults.classList.add('hidden');
        showFormInput();
    });

    // Initialize - show the form by default and setup initial UI language
    showFormInput();
    updateUIText();
    
    // Initialize the language dropdown with the current language
    document.getElementById('language-selector').value = currentLanguage;
    
    // Trigger updateUIText immediately to ensure all UI elements are in the correct language
    setTimeout(updateUIText, 100);
});