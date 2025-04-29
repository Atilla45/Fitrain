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
    if (languageSelector) {
        languageSelector.value = currentLanguage;
    }

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
                voice.lang.startsWith(utterance.lang.substring(0,2))
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
                    voice.lang.startsWith(utterance.lang.substring(0,2))
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
            // Map experience level phrases
            const levelLower = voiceFormData.level.toLowerCase();
            if (levelLower.includes('begin') || levelLower.includes('new') || levelLower.includes('start')) {
                voiceFormData.level = 'beginner';
            } else if (levelLower.includes('inter') || levelLower.includes('some')) {
                voiceFormData.level = 'intermediate';
            } else if (levelLower.includes('advan') || levelLower.includes('expert')) {
                voiceFormData.level = 'advanced';
            } else {
                voiceFormData.level = 'beginner';
            }
        }
        
        if (voiceFormData.preference) {
            // Map workout preference phrases
            const prefLower = voiceFormData.preference.toLowerCase();
            if (prefLower.includes('home')) {
                voiceFormData.preference = 'home';
            } else if (prefLower.includes('gym')) {
                voiceFormData.preference = 'gym';
            } else if (prefLower.includes('out') || prefLower.includes('park')) {
                voiceFormData.preference = 'outdoor';
            } else {
                voiceFormData.preference = 'home';
            }
        }
        
        // Generate fitness plan
        generatePlan(voiceFormData);
    }

    // Show form input
    function showFormInput() {
        voiceInputStatus.classList.add('hidden');
        formInput.classList.remove('hidden');
        planResults.classList.add('hidden');
        
        // Remove voice animation if active
        if (startVoiceBtn.classList.contains('voice-active-btn')) {
            startVoiceBtn.classList.remove('voice-active-btn');
            startVoiceBtn.querySelector('i').classList.remove('voice-active-icon');
        }
    }

    // Generate fitness plan
    function generatePlan(formData) {
        // Get CSRF token
        const csrfToken = getCsrfToken();

        // Show loading state
        planResults.classList.add('hidden');
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loadingIndicator';
        loadingIndicator.className = 'text-center py-8';
        loadingIndicator.innerHTML = `
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p class="text-gray-700">Creating your personalized fitness plan...</p>
        `;
        formInput.parentNode.insertBefore(loadingIndicator, planResults);

        // Make API request to generate plan
        fetch('/generate-plan/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            // Remove loading indicator
            const loadingElement = document.getElementById('loadingIndicator');
            if (loadingElement) loadingElement.remove();

            if (data.success) {
                // Display the generated plan
                displayPlanResults(data.plan);
            } else {
                alert('Error: ' + (data.error || 'Failed to generate fitness plan'));
            }
        })
        .catch(error => {
            console.error('Error generating plan:', error);
            
            // Remove loading indicator
            const loadingElement = document.getElementById('loadingIndicator');
            if (loadingElement) loadingElement.remove();
            
            alert('Error: Failed to generate fitness plan. Please try again.');
        });
    }

    // Helper function to get exercise image URL
    function getExerciseImageUrl(exerciseName) {
        // Handle special cases with clean mapping
        const cleanName = exerciseName.toLowerCase().replace(/[^\w\s-]/g, '');
        
        // Map exercise names to image URLs (could be expanded in the future)
        const defaultImage = 'https://via.placeholder.com/120x80/2563eb/ffffff?text=Exercise';
        
        return defaultImage;
    }

    // Helper function to get exercise instructions
    function getExerciseInstructions(exerciseName) {
        // Sample instructions for common exercises
        const instructions = {
            'push-ups': 'Start in plank position with arms straight. Lower your body until your chest nearly touches the floor, then push back up.',
            'squats': 'Stand with feet shoulder-width apart. Lower your body by bending knees and pushing hips back, as if sitting in a chair. Return to standing.',
            'planks': 'Hold a push-up position with your weight on your forearms. Keep your body straight from head to heels.',
            'lunges': 'Stand upright. Take a step forward with one leg and lower your body until both knees form 90-degree angles. Push back to starting position.',
            'burpees': 'Begin standing, then squat down, kick feet back to plank, do a push-up, jump feet forward, and jump up with hands overhead.'
        };
        
        // Clean exercise name for lookup
        const cleanName = exerciseName.toLowerCase().replace(/[^\w\s-]/g, '');
        
        // Return instructions if available, or generic message
        return instructions[cleanName] || 'Perform with proper form, focusing on controlled movements throughout the full range of motion.';
    }

    // Display the generated fitness plan
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
                rest: "Rest",
                details: "View Details",
                close: "Close",
                duration: "Duration",
                instructions: "Instructions",
                diet: "Dietary Guidelines",
                workout: "Workout",
                viewExercises: "View Exercises"
            },
            az: {
                schedule: "Həftəlik Qrafik",
                day: "Gün",
                focus: "Fokus",
                exercises: "Məşqlər",
                sets: "Setlər",
                reps: "Təkrarlar",
                rest: "İstirahət",
                details: "Ətraflı Bax",
                close: "Bağla",
                duration: "Müddət",
                instructions: "Təlimatlar",
                diet: "Qidalanma Təlimatları",
                workout: "Məşq",
                viewExercises: "Məşqləri Göstər"
            },
            tr: {
                schedule: "Haftalık Program",
                day: "Gün",
                focus: "Odak",
                exercises: "Egzersizler",
                sets: "Setler",
                reps: "Tekrarlar",
                rest: "Dinlenme",
                details: "Detayları Gör",
                close: "Kapat",
                duration: "Süre",
                instructions: "Talimatlar",
                diet: "Beslenme Kılavuzu",
                workout: "Antrenman",
                viewExercises: "Egzersizleri Göster"
            }
        };
        
        const lang = translations[currentLanguage] || translations.en;
        
        // Create exercise modal if it doesn't exist
        let exerciseModal = document.getElementById('exerciseModal');
        if (!exerciseModal) {
            exerciseModal = document.createElement('div');
            exerciseModal.id = 'exerciseModal';
            exerciseModal.className = 'exercise-modal';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'exercise-modal-content';
            modalContent.innerHTML = `
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-2xl font-bold" id="modalTitle"></h3>
                        <button id="closeModal" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>
                    <div id="modalContent"></div>
                </div>
            `;
            
            exerciseModal.appendChild(modalContent);
            document.body.appendChild(exerciseModal);
            
            // Set up modal close functionality
            document.getElementById('closeModal').addEventListener('click', function() {
                exerciseModal.classList.remove('active');
            });
            
            // Also close when clicking outside the modal
            exerciseModal.addEventListener('click', function(e) {
                if (e.target === exerciseModal) {
                    exerciseModal.classList.remove('active');
                }
            });
        }
        
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
        if (plan.weekly_schedule && Array.isArray(plan.weekly_schedule)) {
            // New format - array of day objects with exercises
            plan.weekly_schedule.forEach(dayData => {
                // Create workout card
                const dayCard = document.createElement('div');
                dayCard.className = 'bg-white shadow rounded-lg overflow-hidden transition-transform hover:shadow-lg';
                
                // Create day header with gradient
                const dayHeader = document.createElement('div');
                dayHeader.className = 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4';
                dayHeader.innerHTML = `<h4 class="font-bold">${dayData.day}</h4>`;
                
                // Create workout details
                const workoutDetails = document.createElement('div');
                workoutDetails.className = 'p-4';
                
                // Determine if it's a rest day
                const isRestDay = (dayData.workout && dayData.workout.toLowerCase().includes('rest')) || 
                                  (dayData.focus && dayData.focus.toLowerCase().includes('rest'));
                
                // Basic workout info
                workoutDetails.innerHTML = `
                    <div class="mb-3">
                        <h5 class="font-semibold mb-1">${lang.workout}:</h5>
                        <p class="text-gray-700">${dayData.workout || 'Not specified'}</p>
                    </div>
                    <div class="mb-3">
                        <h5 class="font-semibold mb-1">${lang.focus}:</h5>
                        <p class="text-gray-700">${dayData.focus || 'General'}</p>
                    </div>
                    <div class="mb-3">
                        <h5 class="font-semibold mb-1">${lang.duration}:</h5>
                        <p class="text-gray-700">${dayData.duration || '45-60 min'}</p>
                    </div>
                `;
                
                // Only add exercise button if not a rest day and we have exercises
                if (!isRestDay && dayData.exercises && dayData.exercises.length > 0) {
                    const buttonContainer = document.createElement('div');
                    buttonContainer.className = 'mt-4';
                    
                    const viewExercisesBtn = document.createElement('button');
                    viewExercisesBtn.className = 'w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition flex items-center justify-center';
                    viewExercisesBtn.innerHTML = `<i class="fas fa-dumbbell mr-2"></i> ${lang.viewExercises}`;
                    
                    viewExercisesBtn.addEventListener('click', function() {
                        // Show detailed exercises in modal
                        document.getElementById('modalTitle').textContent = `${dayData.day}: ${dayData.focus}`;
                        
                        const modalContentElement = document.getElementById('modalContent');
                        modalContentElement.innerHTML = '';
                        
                        // Create table for exercises
                        const exerciseTable = document.createElement('div');
                        exerciseTable.className = 'overflow-x-auto';
                        exerciseTable.innerHTML = `
                            <table class="min-w-full border-collapse">
                                <thead>
                                    <tr class="bg-gray-100">
                                        <th class="px-4 py-2 text-left">${lang.exercises}</th>
                                        <th class="px-4 py-2 text-center">${lang.sets}</th>
                                        <th class="px-4 py-2 text-center">${lang.reps}</th>
                                        <th class="px-4 py-2 text-center">${lang.rest}</th>
                                    </tr>
                                </thead>
                                <tbody id="exerciseTableBody">
                                </tbody>
                            </table>
                        `;
                        
                        modalContentElement.appendChild(exerciseTable);
                        
                        // Add exercises to table
                        const tableBody = exerciseTable.querySelector('#exerciseTableBody');
                        dayData.exercises.forEach((exercise, index) => {
                            const row = document.createElement('tr');
                            row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                            
                            // Make the exercise name clickable to show instructions
                            row.innerHTML = `
                                <td class="px-4 py-3 border-t">
                                    <button class="text-blue-600 hover:text-blue-800 font-medium text-left">
                                        ${exercise.name}
                                    </button>
                                </td>
                                <td class="px-4 py-3 border-t text-center">${exercise.sets}</td>
                                <td class="px-4 py-3 border-t text-center">${exercise.reps}</td>
                                <td class="px-4 py-3 border-t text-center">${exercise.rest}</td>
                            `;
                            
                            // Add event listener to show instructions
                            const nameBtn = row.querySelector('button');
                            nameBtn.addEventListener('click', function() {
                                // Create a div for instructions that slides down
                                if (row.nextElementSibling && row.nextElementSibling.classList.contains('instruction-row')) {
                                    // Instructions already shown, toggle visibility
                                    row.nextElementSibling.remove();
                                } else {
                                    // Add instructions
                                    const instructionRow = document.createElement('tr');
                                    instructionRow.className = 'instruction-row';
                                    instructionRow.innerHTML = `
                                        <td colspan="4" class="px-4 py-3 border-t bg-blue-50">
                                            <h5 class="font-medium mb-2">${lang.instructions}</h5>
                                            <p class="text-gray-700">${exercise.description || 'No detailed instructions available.'}</p>
                                        </td>
                                    `;
                                    row.insertAdjacentElement('afterend', instructionRow);
                                }
                            });
                            
                            tableBody.appendChild(row);
                        });
                        
                        // Show the modal
                        exerciseModal.classList.add('active');
                    });
                    
                    buttonContainer.appendChild(viewExercisesBtn);
                    workoutDetails.appendChild(buttonContainer);
                }
                
                // Combine elements
                dayCard.appendChild(dayHeader);
                dayCard.appendChild(workoutDetails);
                cardGrid.appendChild(dayCard);
            });
        } else if (plan.weekly_schedule) {
            // Handle old format (object with day keys)
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
                
                // Generate suggested exercises based on focus
                let suggestedExercises = [];
                if (focus === 'Upper Body') {
                    suggestedExercises = ['Push-ups', 'Pull-ups', 'Dumbbell Rows', 'Shoulder Press', 'Bicep Curls'];
                } else if (focus === 'Lower Body') {
                    suggestedExercises = ['Squats', 'Lunges', 'Deadlifts', 'Calf Raises', 'Leg Raises'];
                } else if (focus === 'Cardio') {
                    suggestedExercises = ['Running', 'Jumping Jacks', 'Jump Rope', 'Cycling', 'Swimming'];
                } else if (focus === 'Core') {
                    suggestedExercises = ['Planks', 'Crunches', 'Russian Twists', 'Leg Raises', 'Mountain Climbers'];
                } else if (focus === 'Rest Day') {
                    suggestedExercises = ['Light Walking', 'Stretching', 'Yoga', 'Foam Rolling'];
                } else {
                    suggestedExercises = ['Squats', 'Push-ups', 'Planks', 'Jumping Jacks', 'Lunges'];
                }
                
                // Add workout info to card
                workoutDetails.innerHTML = `
                    <div class="mb-3">
                        <h5 class="font-semibold mb-1">${lang.workout}:</h5>
                        <p class="text-gray-700">${workout}</p>
                    </div>
                    <div class="mb-3">
                        <h5 class="font-semibold mb-1">${lang.focus}:</h5>
                        <p class="text-gray-700">${focus}</p>
                    </div>
                    <div class="mb-3">
                        <h5 class="font-semibold mb-1">${lang.exercises}:</h5>
                        <ul class="text-gray-700 list-disc pl-5">
                            ${suggestedExercises.map(ex => `<li>${ex}</li>`).join('')}
                        </ul>
                    </div>
                `;
                
                // Combine elements
                dayCard.appendChild(dayHeader);
                dayCard.appendChild(workoutDetails);
                cardGrid.appendChild(dayCard);
            }
        }
        
        // Add dietary guidelines if available
        if (plan.dietary_guidelines) {
            const dietSection = document.createElement('div');
            dietSection.className = 'mt-8 bg-white p-6 rounded-lg shadow-md';
            
            const dietTitle = document.createElement('h4');
            dietTitle.className = 'text-xl font-semibold mb-3 text-gray-800';
            dietTitle.textContent = lang.diet;
            
            const dietText = document.createElement('p');
            dietText.className = 'text-gray-700';
            dietText.textContent = plan.dietary_guidelines;
            
            dietSection.appendChild(dietTitle);
            dietSection.appendChild(dietText);
            weeklySchedule.appendChild(dietSection);
        }
        
        // Set up PDF download link
        if (plan.pdfLink) {
            downloadPdfBtn.href = plan.pdfLink;
        }
    }

    // Get CSRF token from cookie or meta tag
    function getCsrfToken() {
        // First try to get from cookie
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
        
        if (cookieValue) return cookieValue;
        
        // Then try to get from meta tag
        const csrfTokenMeta = document.querySelector('meta[name="csrf-token"]');
        return csrfTokenMeta ? csrfTokenMeta.content : '';
    }

    // Update form options based on selected language
    function updateFormOptions() {
        // Get all form element labels and options
        const formLabels = fitnessForm.querySelectorAll('label');
        const goalOptions = document.getElementById('goal').options;
        const levelOptions = document.getElementById('level').options;
        const prefOptions = document.getElementById('preference').options;
        
        // Define translations for form elements
        const formTranslations = {
            en: {
                name: "Your Name",
                goal: "Main Fitness Goal",
                days: "Days Per Week Available",
                level: "Experience Level",
                preference: "Workout Preference",
                restrictions: "Any Physical Restrictions?",
                restrictionsPlaceholder: "e.g., knee issues, back pain, etc. Leave blank if none.",
                submitBtn: "Generate My Fitness Plan",
                goals: {
                    general: "General Fitness & Health",
                    weight_loss: "Weight Loss",
                    muscle: "Build Muscle",
                    strength: "Increase Strength",
                    endurance: "Improve Endurance"
                },
                levels: {
                    beginner: "Beginner",
                    intermediate: "Intermediate",
                    advanced: "Advanced"
                },
                preferences: {
                    home: "Home Workouts",
                    gym: "Gym Workouts",
                    outdoor: "Outdoor Workouts"
                }
            },
            az: {
                name: "Adınız",
                goal: "Əsas Fitness Hədəfi",
                days: "Həftədə Mümkün Günlər",
                level: "Təcrübə Səviyyəsi",
                preference: "Məşq Tərcih",
                restrictions: "Fiziki Məhdudiyyətlər?",
                restrictionsPlaceholder: "məs., diz problemləri, bel ağrısı və s. Yoxdursa boş saxlayın.",
                submitBtn: "Fitness Planımı Yarat",
                goals: {
                    general: "Ümumi Fitness və Sağlamlıq",
                    weight_loss: "Çəki İtirmək",
                    muscle: "Əzələ Qurmaq",
                    strength: "Gücü Artırmaq",
                    endurance: "Dözümlülüyü İnkişaf Etdirmək"
                },
                levels: {
                    beginner: "Başlanğıc",
                    intermediate: "Orta",
                    advanced: "Peşəkar"
                },
                preferences: {
                    home: "Evdə Məşqlər",
                    gym: "İdman Zalında Məşqlər",
                    outdoor: "Açıq Havada Məşqlər"
                }
            },
            tr: {
                name: "Adınız",
                goal: "Ana Fitness Hedefi",
                days: "Haftada Mevcut Günler",
                level: "Deneyim Seviyesi",
                preference: "Antrenman Tercihi",
                restrictions: "Fiziksel Kısıtlamalar?",
                restrictionsPlaceholder: "örn., diz sorunları, sırt ağrısı vb. Yoksa boş bırakın.",
                submitBtn: "Fitness Planımı Oluştur",
                goals: {
                    general: "Genel Fitness ve Sağlık",
                    weight_loss: "Kilo Kaybı",
                    muscle: "Kas Yapma",
                    strength: "Güç Artırma",
                    endurance: "Dayanıklılık Geliştirme"
                },
                levels: {
                    beginner: "Başlangıç",
                    intermediate: "Orta",
                    advanced: "İleri"
                },
                preferences: {
                    home: "Ev Antrenmanları",
                    gym: "Spor Salonu Antrenmanları",
                    outdoor: "Açık Hava Antrenmanları"
                }
            }
        };
        
        // Get translations for current language
        const translations = formTranslations[currentLanguage] || formTranslations.en;
        
        // Update form labels
        formLabels.forEach(label => {
            const forAttr = label.getAttribute('for');
            if (forAttr && translations[forAttr]) {
                label.textContent = translations[forAttr];
            }
        });
        
        // Update select options
        updateSelectOptions('goal', translations.goals);
        updateSelectOptions('level', translations.levels);
        updateSelectOptions('preference', translations.preferences);
        
        // Update restrictions placeholder
        const restrictionsField = document.getElementById('restrictions');
        if (restrictionsField) {
            restrictionsField.setAttribute('placeholder', translations.restrictionsPlaceholder);
        }
        
        // Update submit button
        const submitBtn = fitnessForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = translations.submitBtn;
        }
    }
    
    // Helper to update select options
    function updateSelectOptions(selectId, options) {
        const select = document.getElementById(selectId);
        if (select && options) {
            Array.from(select.options).forEach(option => {
                const value = option.value;
                if (options[value]) {
                    option.textContent = options[value];
                }
            });
        }
    }
    
    // Update UI text based on current language
    function updateUIText() {
        // Get all static text elements that need translation
        const uiTranslations = {
            en: {
                title: "FitPlan Builder",
                subtitle: "Your personalized fitness journey starts here",
                buildTitle: "Build Your Custom Fitness Plan",
                buildDesc: "Answer a few simple questions and we'll create a personalized workout routine that fits your goals, schedule, and preferences.",
                inputMethod: "Voice or Text Input",
                inputDesc: "Choose how you'd like to provide your information.",
                voiceBtn: "Start Voice Input",
                textBtn: "Use Text Form",
                featuresLink: "Features",
                howItWorksLink: "How It Works",
                downloadPdf: "Download PDF",
                newPlan: "Create New Plan"
            },
            az: {
                title: "FitPlan Yaradıcı",
                subtitle: "Şəxsi məşq yolçuluğunuz buradan başlayır",
                buildTitle: "Özünüzə Uyğun Fitness Planı Qurun",
                buildDesc: "Bir neçə sadə suala cavab verin və biz sizin hədəflərinizə, qrafikinizə və tərcihlərinizə uyğun şəxsi məşq planı yaradacağıq.",
                inputMethod: "Səs və ya Mətn Girişi",
                inputDesc: "Məlumatlarınızı necə təqdim etmək istədiyinizi seçin.",
                voiceBtn: "Səs Girişini Başlat",
                textBtn: "Mətn Formasından İstifadə Et",
                featuresLink: "Özəlliklər",
                howItWorksLink: "Necə İşləyir",
                downloadPdf: "PDF Yüklə",
                newPlan: "Yeni Plan Yarat"
            },
            tr: {
                title: "FitPlan Oluşturucu",
                subtitle: "Kişiselleştirilmiş fitness yolculuğunuz burada başlıyor",
                buildTitle: "Özel Fitness Planınızı Oluşturun",
                buildDesc: "Birkaç basit soruyu yanıtlayın ve hedeflerinize, programınıza ve tercihlerinize uygun kişiselleştirilmiş bir antrenman rutini oluşturacağız.",
                inputMethod: "Ses veya Metin Girişi",
                inputDesc: "Bilgilerinizi nasıl sağlamak istediğinizi seçin.",
                voiceBtn: "Ses Girişini Başlat",
                textBtn: "Metin Formunu Kullan",
                featuresLink: "Özellikler",
                howItWorksLink: "Nasıl Çalışır",
                downloadPdf: "PDF İndir",
                newPlan: "Yeni Plan Oluştur"
            }
        };
        
        const translations = uiTranslations[currentLanguage] || uiTranslations.en;
        
        // Update static text elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[key]) {
                el.textContent = translations[key];
            }
        });
        
        // Update specific elements
        const titleEl = document.querySelector('h1');
        if (titleEl) titleEl.textContent = translations.title;
        
        const subtitleEl = document.querySelector('h1 + p');
        if (subtitleEl) subtitleEl.textContent = translations.subtitle;
        
        // Update navigation links
        const featuresLink = document.querySelector('a[href="#features"]');
        if (featuresLink) featuresLink.textContent = translations.featuresLink;
        
        const howItWorksLink = document.querySelector('a[href="#how-it-works"]');
        if (howItWorksLink) howItWorksLink.textContent = translations.howItWorksLink;
        
        // Update buttons
        if (startVoiceBtn) startVoiceBtn.innerHTML = `<i class="fas fa-microphone mr-2"></i> ${translations.voiceBtn}`;
        if (showFormBtn) showFormBtn.innerHTML = `<i class="fas fa-keyboard mr-2"></i> ${translations.textBtn}`;
        if (downloadPdfBtn) downloadPdfBtn.innerHTML = `<i class="fas fa-file-pdf mr-2"></i> ${translations.downloadPdf}`;
        if (newPlanBtn) newPlanBtn.innerHTML = `<i class="fas fa-redo mr-2"></i> ${translations.newPlan}`;
    }

    // Event listeners
    if (startVoiceBtn) {
        startVoiceBtn.addEventListener('click', startVoiceInput);
    }

    if (stopVoiceBtn) {
        stopVoiceBtn.addEventListener('click', function() {
            if (recognition) {
                recognition.stop();
                isListening = false;
            }
            voiceInputStatus.classList.add('hidden');
            startVoiceBtn.classList.remove('voice-active-btn');
            startVoiceBtn.querySelector('i').classList.remove('voice-active-icon');
        });
    }

    if (showFormBtn) {
        showFormBtn.addEventListener('click', showFormInput);
    }

    if (fitnessForm) {
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
            
            // Generate fitness plan
            generatePlan(formData);
        });
    }

    if (newPlanBtn) {
        newPlanBtn.addEventListener('click', function() {
            planResults.classList.add('hidden');
            formInput.classList.remove('hidden');
        });
    }

    // Language selector event (handled in app.js)
    
    // Init - Update form options on page load
    if (fitnessForm) {
        updateFormOptions();
        updateUIText();
    }
});