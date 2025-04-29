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
    
    // AI conversation elements
    const conversationContainer = document.getElementById('conversationContainer');
    const messagesContainer = document.getElementById('messagesContainer');
    const conversationTitle = document.getElementById('conversationTitle');
    const continueVoiceBtn = document.getElementById('continueVoiceBtn');
    const completeConversationBtn = document.getElementById('completeConversationBtn');

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

    // AI conversation context
    let conversationContext = null;

    // Voice language mapping
    const voiceLanguages = {
        en: 'en-US',
        az: 'az-AZ', 
        tr: 'tr-TR'
    };

    // Get questions in current language
    function getQuestions() {
        // This function is kept for compatibility with the old code
        // The new AI-based system manages its own questions
        return [];
    }

    let recognition = null;
    let isListening = false;

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
            voiceProgress.style.width = `100%`;
        };

        // When recognition stops
        recognition.onend = function() {
            if (isListening) {
                const transcript = recognitionStatus.textContent.replace('I heard: "', '').replace('"', '').trim();
                
                // Process the answer with AI
                if (transcript && transcript !== '') {
                    // Send the transcript to the AI assistant
                    processVoiceWithAI(transcript);
                } else {
                    // If no valid transcript, ask to try again
                    let followUpMessage = "";
                    
                    if (currentLanguage === 'en') {
                        followUpMessage = "I didn't catch that. Could you please try again?";
                    } else if (currentLanguage === 'az') {
                        followUpMessage = "Eşitmədim. Zəhmət olmasa, bir daha cəhd edin?";
                    } else if (currentLanguage === 'tr') {
                        followUpMessage = "Anlamadım. Lütfen tekrar dener misiniz?";
                    }
                    
                    // Add the AI assistant message
                    addAIMessage(followUpMessage);
                    
                    // Speak the follow-up message
                    speakText(followUpMessage, () => {
                        // Start listening again after speaking
                        setTimeout(() => {
                            isListening = true;
                            recognition.start();
                        }, 500);
                    });
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
            addAIMessage(errorMessage);
            isListening = false;
        };

        return true;
    }

    // Start voice input process
    function startVoiceInput(continueConversation = false) {
        if (!setupSpeechRecognition()) return;

        // Add animation classes
        startVoiceBtn.classList.add('voice-active-btn');
        startVoiceBtn.querySelector('i').classList.add('voice-active-icon');
        
        if (continueConversation) {
            continueVoiceBtn.classList.add('voice-active-btn');
            continueVoiceBtn.querySelector('i').classList.add('voice-active-icon');
        }

        // Show conversation container if this is a new conversation
        if (!continueConversation) {
            // Reset conversation and form data
            conversationContext = null;
            voiceFormData = {
                name: '',
                goal: '',
                days: '',
                level: '',
                preference: '',
                restrictions: ''
            };
            messagesContainer.innerHTML = '';
            
            // Show conversation container, hide other sections
            conversationContainer.classList.remove('hidden');
            formInput.classList.add('hidden');
            planResults.classList.add('hidden');
            
            // Set appropriate title for conversation
            if (currentLanguage === 'en') {
                conversationTitle.textContent = "Conversation with Aria";
            } else if (currentLanguage === 'az') {
                conversationTitle.textContent = "Aria ilə söhbət";
            } else if (currentLanguage === 'tr') {
                conversationTitle.textContent = "Aria ile konuşma";
            }
            
            // Start the conversation by getting the first question
            fetchNextAIQuestion();
        } else {
            // For continuing an existing conversation
            voiceInputStatus.classList.remove('hidden');
            isListening = true;
            recognition.start();
        }
    }
    
    // Process voice input with AI
    function processVoiceWithAI(text) {
        // Add user message to conversation
        addUserMessage(text);
        
        // Prepare data for the API request
        const requestData = {
            text: text,
            language: currentLanguage,
            context: conversationContext
        };
        
        // Get CSRF token
        const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
        
        // Show loading indicator
        const loadingId = 'ai-loading-' + Date.now();
        addLoadingMessage(loadingId);
        
        // Make the API request
        fetch('/process-voice/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            // Remove loading message
            removeLoadingMessage(loadingId);
            
            if (data.success) {
                // Update conversation context
                conversationContext = data.context;
                
                // Add AI response to conversation
                addAIMessage(data.text);
                
                // Speak the AI response
                speakText(data.text, () => {
                    // Check if we're done with the questionnaire
                    if (conversationContext && 
                        conversationContext.current_question >= conversationContext.questions.length) {
                        // Show the complete button
                        completeConversationBtn.classList.remove('hidden');
                        
                        // Extract answers from context
                        voiceFormData = conversationContext.answers;
                    } else {
                        // Start listening again after speaking
                        setTimeout(() => {
                            isListening = true;
                            recognition.start();
                        }, 500);
                    }
                });
            } else {
                // Handle error
                const errorMessage = data.error || "Sorry, there was an error processing your request.";
                addAIMessage(errorMessage);
                speakText(errorMessage);
                console.error('Error processing voice input:', errorMessage);
            }
        })
        .catch(error => {
            // Remove loading message
            removeLoadingMessage(loadingId);
            
            // Handle network error
            console.error('Network error:', error);
            const errorMessage = "Sorry, there was a network error. Please try again.";
            addAIMessage(errorMessage);
            speakText(errorMessage);
        });
    }
    
    // Fetch the next question from the AI
    function fetchNextAIQuestion() {
        // Prepare data for the API request
        const requestData = {
            text: '',  // Empty text indicates we want the next question
            language: currentLanguage,
            context: conversationContext
        };
        
        // Get CSRF token
        const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
        
        // Show loading indicator
        const loadingId = 'ai-loading-' + Date.now();
        addLoadingMessage(loadingId);
        
        // Make the API request
        fetch('/process-voice/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            // Remove loading message
            removeLoadingMessage(loadingId);
            
            if (data.success) {
                // Update conversation context
                conversationContext = data.context;
                
                // Add AI question to conversation
                addAIMessage(data.text);
                
                // Show voice input status
                voiceInputStatus.classList.remove('hidden');
                
                // Speak the question
                speakText(data.text, () => {
                    // Start listening after question is spoken
                    isListening = true;
                    recognition.start();
                });
            } else {
                // Handle error
                const errorMessage = data.error || "Sorry, there was an error starting the conversation.";
                addAIMessage(errorMessage);
                console.error('Error fetching AI question:', errorMessage);
            }
        })
        .catch(error => {
            // Remove loading message
            removeLoadingMessage(loadingId);
            
            // Handle network error
            console.error('Network error:', error);
            const errorMessage = "Sorry, there was a network error. Please try again.";
            addAIMessage(errorMessage);
        });
    }
    
    // Add a message from the AI to the conversation
    function addAIMessage(text) {
        const messageEl = document.createElement('div');
        messageEl.className = 'ai-message';
        messageEl.textContent = text;
        messagesContainer.appendChild(messageEl);
        
        // Scroll to the bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Add a user message to the conversation
    function addUserMessage(text) {
        const messageEl = document.createElement('div');
        messageEl.className = 'user-message';
        messageEl.textContent = text;
        messagesContainer.appendChild(messageEl);
        
        // Scroll to the bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Add a loading message
    function addLoadingMessage(id) {
        const messageEl = document.createElement('div');
        messageEl.className = 'ai-message';
        messageEl.id = id;
        messageEl.innerHTML = '<div class="flex items-center"><div class="w-4 h-4 bg-blue-600 rounded-full animate-pulse mr-2"></div><div class="w-4 h-4 bg-blue-600 rounded-full animate-pulse mr-2 animation-delay-200"></div><div class="w-4 h-4 bg-blue-600 rounded-full animate-pulse animation-delay-400"></div></div>';
        messagesContainer.appendChild(messageEl);
        
        // Scroll to the bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Remove a loading message
    function removeLoadingMessage(id) {
        const messageEl = document.getElementById(id);
        if (messageEl) {
            messageEl.remove();
        }
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
            
            // Execute callback when speech is done
            if (callback) {
                utterance.onend = callback;
            }
            
            speechSynthesis.speak(utterance);
        }, 100);
        
        return utterance;
    }

    // Finish voice input
    function finishVoiceInput() {
        isListening = false;
        voiceInputStatus.classList.add('hidden');
        
        // Remove animation classes
        startVoiceBtn.classList.remove('voice-active-btn');
        startVoiceBtn.querySelector('i').classList.remove('voice-active-icon');
        
        if (continueVoiceBtn.classList.contains('voice-active-btn')) {
            continueVoiceBtn.classList.remove('voice-active-btn');
            continueVoiceBtn.querySelector('i').classList.remove('voice-active-icon');
        }
        
        if (recognition) {
            recognition.stop();
        }
    }
    
    // Complete the conversation and generate plan
    function completeConversation() {
        // Extract the data from the conversation context
        if (conversationContext && conversationContext.answers) {
            // Process the data and generate the plan
            generatePlan(conversationContext.answers);
        } else {
            alert('No conversation data available. Please start over.');
        }
    }

    // Show form input
    function showFormInput() {
        formInput.classList.remove('hidden');
        voiceInputStatus.classList.add('hidden');
        conversationContainer.classList.add('hidden');
        planResults.classList.add('hidden');
        
        // Reset conversation
        finishVoiceInput();
    }

    // Generate plan
    function generatePlan(formData) {
        // Show a loading indicator
        const loadingHTML = '<div class="text-center py-8"><div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div><p class="text-gray-700">Creating your personalized fitness plan...</p></div>';
        
        if (conversationContainer.classList.contains('hidden')) {
            formInput.innerHTML = loadingHTML;
        } else {
            // Add a loading message to conversation
            addAIMessage("Creating your personalized fitness plan...");
            conversationContainer.classList.add('hidden');
        }
        
        // Get CSRF token
        const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
        
        // Clean up form data if needed
        const cleanFormData = {...formData};
        
        // For days field, extract number if it's a string response
        if (typeof cleanFormData.days === 'string' && isNaN(cleanFormData.days)) {
            const daysMatch = cleanFormData.days.match(/\d+/);
            if (daysMatch) {
                cleanFormData.days = daysMatch[0];
            } else {
                cleanFormData.days = '3'; // Default
            }
        }
        
        // For goal field, map common phrases
        if (typeof cleanFormData.goal === 'string') {
            const goalLower = cleanFormData.goal.toLowerCase();
            if (goalLower.includes('weight') || goalLower.includes('fat') || goalLower.includes('slim')) {
                cleanFormData.goal = 'weight_loss';
            } else if (goalLower.includes('muscle') || goalLower.includes('bulk')) {
                cleanFormData.goal = 'muscle';
            } else if (goalLower.includes('strength') || goalLower.includes('strong')) {
                cleanFormData.goal = 'strength';
            } else if (goalLower.includes('endurance') || goalLower.includes('stamina')) {
                cleanFormData.goal = 'endurance';
            } else {
                cleanFormData.goal = 'general';
            }
        }
        
        // For level field, map common phrases
        if (typeof cleanFormData.level === 'string') {
            const levelLower = cleanFormData.level.toLowerCase();
            if (levelLower.includes('beginner') || levelLower.includes('new')) {
                cleanFormData.level = 'beginner';
            } else if (levelLower.includes('intermediate')) {
                cleanFormData.level = 'intermediate';
            } else if (levelLower.includes('advanced') || levelLower.includes('expert')) {
                cleanFormData.level = 'advanced';
            } else {
                cleanFormData.level = 'beginner';
            }
        }
        
        // For preference field, map common phrases
        if (typeof cleanFormData.preference === 'string') {
            const prefLower = cleanFormData.preference.toLowerCase();
            if (prefLower.includes('home')) {
                cleanFormData.preference = 'home';
            } else if (prefLower.includes('gym')) {
                cleanFormData.preference = 'gym';
            } else if (prefLower.includes('outdoor') || prefLower.includes('outside')) {
                cleanFormData.preference = 'outdoor';
            } else {
                cleanFormData.preference = 'home';
            }
        }
        
        // Make the API request
        fetch('/generate-plan/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(cleanFormData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Hide form and conversation
                formInput.classList.add('hidden');
                conversationContainer.classList.add('hidden');
                
                // Display the plan
                const plan = data.plan;
                planTitle.textContent = plan.plan_title || 'Your Personalized Fitness Plan';
                planIntro.textContent = plan.introduction || 'Here is your customized fitness plan.';
                
                // Set up download link
                if (plan.pdfLink) downloadPdfBtn.href = plan.pdfLink;
                
                // Show the results section
                planResults.classList.remove('hidden');
                
                // Display weekly schedule
                displayWeeklySchedule(plan);
                
                // Display dietary guidelines
                displayDietaryGuidelines(plan);
                
                // Add workout details
                displayWorkoutDetails(plan);
            } else {
                alert('Error: ' + (data.error || 'Failed to generate fitness plan'));
                // Reset UI
                formInput.innerHTML = '';
                showFormInput();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error: Failed to generate fitness plan. Please try again.');
            // Reset UI
            formInput.innerHTML = '';
            showFormInput();
        });
    }

    // Display weekly schedule
    function displayWeeklySchedule(plan) {
        const weeklySchedule = document.getElementById('weeklySchedule');
        weeklySchedule.innerHTML = '';
        
        // Get the weekly schedule
        const schedule = plan.weekly_schedule;
        
        // Create a card for each day
        for (const day in schedule) {
            const dayCard = document.createElement('div');
            dayCard.className = 'bg-white p-4 rounded-lg shadow-sm';
            
            const dayTitle = document.createElement('h5');
            dayTitle.className = 'font-semibold text-gray-800';
            dayTitle.textContent = day;
            
            const activity = document.createElement('p');
            activity.className = 'text-gray-600';
            activity.textContent = schedule[day];
            
            dayCard.appendChild(dayTitle);
            dayCard.appendChild(activity);
            weeklySchedule.appendChild(dayCard);
        }
    }
    
    // Display dietary guidelines
    function displayDietaryGuidelines(plan) {
        const dietText = document.getElementById('dietText');
        dietText.innerHTML = '';
        
        // Get the dietary guidelines
        const guidelines = plan.diet_guidelines;
        
        if (Array.isArray(guidelines)) {
            const list = document.createElement('ul');
            list.className = 'list-disc pl-5 space-y-2';
            
            guidelines.forEach(guideline => {
                const item = document.createElement('li');
                item.textContent = guideline;
                list.appendChild(item);
            });
            
            dietText.appendChild(list);
        } else {
            dietText.textContent = guidelines || 'No dietary guidelines available.';
        }
    }
    
    // Display workout details
    function displayWorkoutDetails(plan) {
        const workoutDetailsContainer = document.getElementById('workoutDetails') || document.createElement('div');
        workoutDetailsContainer.id = 'workoutDetails';
        workoutDetailsContainer.className = 'mt-8 space-y-6';
        workoutDetailsContainer.innerHTML = '<h4 class="text-xl font-semibold">Workout Details</h4>';
        
        // Get the workouts
        const workouts = plan.workouts;
        
        // Create a section for each workout
        for (const workoutName in workouts) {
            const workoutSection = document.createElement('div');
            workoutSection.className = 'bg-white p-6 rounded-lg shadow-sm';
            
            const workoutTitle = document.createElement('h5');
            workoutTitle.className = 'text-lg font-semibold mb-4';
            workoutTitle.textContent = workoutName;
            
            const exercisesList = document.createElement('div');
            exercisesList.className = 'space-y-3';
            
            workouts[workoutName].forEach(exercise => {
                const exerciseItem = document.createElement('div');
                exerciseItem.className = 'flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2';
                
                const exerciseName = document.createElement('div');
                exerciseName.className = 'font-medium text-blue-800 cursor-pointer hover:text-blue-600 transition';
                exerciseName.textContent = exercise.name;
                exerciseName.onclick = () => showExerciseDetails(exercise.name);
                
                const exerciseDetails = document.createElement('div');
                exerciseDetails.className = 'text-gray-600 text-sm';
                exerciseDetails.textContent = `${exercise.sets} sets × ${exercise.reps}`;
                
                exerciseItem.appendChild(exerciseName);
                exerciseItem.appendChild(exerciseDetails);
                exercisesList.appendChild(exerciseItem);
            });
            
            workoutSection.appendChild(workoutTitle);
            workoutSection.appendChild(exercisesList);
            workoutDetailsContainer.appendChild(workoutSection);
        }
        
        // If workout details container is not already in the document, add it
        if (!document.getElementById('workoutDetails')) {
            planResults.querySelector('.bg-gray-100').appendChild(workoutDetailsContainer);
        }
    }

    // Get exercise image URL based on name
    function getExerciseImageUrl(exerciseName) {
        // Map of exercise names to image URLs
        const exerciseImages = {
            'push-ups': 'https://cdn.imgbin.com/1/1/12/push-up-illustration-png-WDNgDvMh.jpg',
            'squats': 'https://qph.cf2.quoracdn.net/main-qimg-cf9b412d533486267afb9e5c8ecfdabf-lq',
            'lunges': 'https://img.freepik.com/premium-vector/woman-doing-forward-lunge-exercise-flat-vector-illustration-isolated_132971-120.jpg',
            'plank': 'https://i.pinimg.com/originals/d1/45/35/d14535b33c06b0c5f1a69bccbc9a4ae8.gif',
            'glute bridges': 'https://i.pinimg.com/originals/dd/4a/8e/dd4a8e50da6c95830e76e9317d1a0f3f.jpg',
            'jumping jacks': 'https://i.pinimg.com/originals/6d/67/94/6d6794e7b31058ae20db31e7ac97ea6b.jpg',
            'mountain climbers': 'https://i.pinimg.com/originals/0f/36/e1/0f36e13768b448bd56562b468334c894.jpg',
            'burpees': 'https://i.pinimg.com/736x/78/92/85/7892853356ef612efd682a040fd7bb5e.jpg',
            'bench press': 'https://i.pinimg.com/originals/51/8a/a2/518aa210f4e4ac5be2a4a88797598888.jpg',
            'deadlifts': 'https://i.pinimg.com/originals/a0/b6/98/a0b698cb9959c8af6f8bc67e70c5fe5b.jpg',
            'rows': 'https://i.pinimg.com/originals/35/58/b1/3558b17316c8a953907cebc3b38f04ae.jpg',
            'overhead press': 'https://i.pinimg.com/originals/6a/86/78/6a867881f09a4a7bdeb897b4cff0e798.jpg',
            'pull-ups': 'https://i.pinimg.com/originals/7c/b3/95/7cb3952f88ddf932a6b46099b71d3fbe.jpg',
            'bicep curls': 'https://i.pinimg.com/originals/3f/00/a9/3f00a9b579a6c29823ea02c4f3de72fe.jpg',
            'tricep dips': 'https://img.myloview.com/stickers/triceps-dips-exercise-workout-illustration-400-109972818.jpg',
            'calf raises': 'https://i.pinimg.com/originals/8f/87/01/8f8701d9e82ca2bd254b3a61df228ecf.jpg',
            'leg raises': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgVF00pFkXejD8KZRG7Syc9wcPRKiJrPFW3A&usqp=CAU',
            'crunches': 'https://i.pinimg.com/originals/48/d4/6d/48d46d8be27a27b6162616d39fae3588.jpg',
            'russian twists': 'https://assets.myworkouts.io/exercises-media/Vg2njCmGPzS6QraMB/russian_twist_female_v14_gif.gif',
            'high knees': 'https://i.pinimg.com/736x/13/2c/37/132c372ab48b87faf6b3c21d48e82b8c.jpg'
        };
        
        // Convert exercise name to lowercase for case-insensitive matching
        const exerciseNameLower = exerciseName.toLowerCase();
        
        // Find the most similar exercise in our database
        for (const key in exerciseImages) {
            if (exerciseNameLower.includes(key) || key.includes(exerciseNameLower)) {
                return exerciseImages[key];
            }
        }
        
        // If no match found, return a default image
        return 'https://i.pinimg.com/originals/3f/2c/97/3f2c979b214d49faf3997e1b05481aee.png';
    }
    
    // Get exercise instructions
    function getExerciseInstructions(exerciseName) {
        // Map of exercise names to instructions
        const exerciseInstructions = {
            'push-ups': [
                'Start in a plank position with hands slightly wider than shoulder-width apart.',
                'Keep your body in a straight line from head to heels.',
                'Lower your chest to the floor by bending your elbows.',
                'Push back up to the starting position.',
                'For beginners, you can modify by doing push-ups on your knees.'
            ],
            'squats': [
                'Stand with feet shoulder-width apart, toes slightly turned out.',
                'Keep your chest up and back straight.',
                'Lower your body as if sitting in a chair, aiming to get thighs parallel to the ground.',
                'Keep your knees in line with your toes, not pushed forward beyond them.',
                'Push through your heels to return to the starting position.'
            ],
            'lunges': [
                'Stand with feet hip-width apart.',
                'Take a step forward with one leg.',
                'Lower your body until both knees are bent at about 90-degree angles.',
                'Keep your front knee aligned over your ankle, not pushed forward.',
                'Push off the front foot to return to the starting position.',
                'Repeat with the other leg.'
            ],
            'plank': [
                'Start in a push-up position, then lower onto your forearms.',
                'Keep your body in a straight line from head to heels.',
                'Engage your core and keep your shoulders relaxed, not hunched.',
                'Hold the position without letting your hips sag or lift.',
                'Breathe normally throughout the exercise.'
            ],
            'glute bridges': [
                'Lie on your back with knees bent and feet flat on the floor, hip-width apart.',
                'Place arms at your sides with palms down.',
                'Tighten your abs and glutes, then lift your hips off the ground.',
                'Form a straight line from your shoulders to your knees.',
                'Hold briefly at the top, then lower back down with control.'
            ]
        };
        
        // Convert exercise name to lowercase for case-insensitive matching
        const exerciseNameLower = exerciseName.toLowerCase();
        
        // Find the most similar exercise in our database
        for (const key in exerciseInstructions) {
            if (exerciseNameLower.includes(key) || key.includes(exerciseNameLower)) {
                return exerciseInstructions[key];
            }
        }
        
        // If no match found, return a default instruction
        return [
            'Maintain proper form throughout the exercise.',
            'Start with a lighter weight or easier variation if needed.',
            'Breathe regularly during the exercise.',
            'If you feel pain (not just muscle fatigue), stop the exercise.',
            'Increase difficulty gradually as you build strength.'
        ];
    }
    
    // Show exercise details in a modal
    function showExerciseDetails(exerciseName) {
        // Get the exercise modal elements
        let modal = document.getElementById('exerciseModal');
        
        // If modal doesn't exist, create it
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'exerciseModal';
            modal.className = 'exercise-modal';
            modal.innerHTML = `
                <div class="exercise-modal-content">
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 id="modalExerciseTitle" class="text-xl font-semibold text-gray-800"></h3>
                            <button onclick="document.getElementById('exerciseModal').classList.remove('active')" class="text-gray-600 hover:text-gray-800">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="text-center mb-6">
                            <img id="modalExerciseImage" src="" alt="Exercise demonstration" class="exercise-image">
                        </div>
                        <div class="mb-4">
                            <h4 class="font-semibold mb-2">Instructions:</h4>
                            <ol id="modalExerciseInstructions" class="list-decimal ml-6 space-y-2"></ol>
                        </div>
                        <div class="mt-6 pt-4 border-t border-gray-200">
                            <h4 class="font-semibold mb-2">Tips:</h4>
                            <p class="text-gray-700">Start with fewer repetitions and perfect your form before increasing the volume. Always warm up before beginning your workout.</p>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // Set modal content
        document.getElementById('modalExerciseTitle').textContent = exerciseName;
        document.getElementById('modalExerciseImage').src = getExerciseImageUrl(exerciseName);
        
        // Set instructions
        const instructionsList = document.getElementById('modalExerciseInstructions');
        instructionsList.innerHTML = '';
        
        const instructions = getExerciseInstructions(exerciseName);
        instructions.forEach(instruction => {
            const item = document.createElement('li');
            item.className = 'text-gray-700 mb-1';
            item.textContent = instruction;
            instructionsList.appendChild(item);
        });
        
        // Show the modal
        modal.classList.add('active');
    }

    // Language change handler
    function changeLanguage(lang) {
        // Store preference
        localStorage.setItem('preferredLanguage', lang);
        currentLanguage = lang;
        
        // Update UI text
        updateUIText();
    }
    
    // Function to update UI text based on language
    function updateUIText() {
        // Object with translations for various UI elements
        const uiText = {
            startVoiceBtn: {
                en: 'Start Voice Input',
                az: 'Səsli Giriş Başlat',
                tr: 'Sesli Giriş Başlat'
            },
            showFormBtn: {
                en: 'Use Text Form',
                az: 'Mətn Formasından İstifadə Et',
                tr: 'Metin Formunu Kullan'
            },
            // Add more UI elements as needed
        };
        
        // Update text for elements that exist in the uiText object
        for (const elementId in uiText) {
            const element = document.getElementById(elementId);
            if (element) {
                // Update the text node (not the icon)
                Array.from(element.childNodes).forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        node.nodeValue = ' ' + uiText[elementId][currentLanguage];
                    }
                });
            }
        }
        
        // Update form options based on language
        updateFormOptions();
    }
    
    // Update form select options based on language
    function updateFormOptions() {
        // Define translations for form options
        const formOptions = {
            goal: {
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
                    { value: 'strength', text: 'Güc Artırmaq' },
                    { value: 'endurance', text: 'Dözümlülüyü Artırmaq' }
                ],
                tr: [
                    { value: 'general', text: 'Genel Fitness ve Sağlık' },
                    { value: 'weight_loss', text: 'Kilo Kaybı' },
                    { value: 'muscle', text: 'Kas Yapmak' },
                    { value: 'strength', text: 'Güç Arttırmak' },
                    { value: 'endurance', text: 'Dayanıklılığı Geliştirmek' }
                ]
            },
            level: {
                en: [
                    { value: 'beginner', text: 'Beginner' },
                    { value: 'intermediate', text: 'Intermediate' },
                    { value: 'advanced', text: 'Advanced' }
                ],
                az: [
                    { value: 'beginner', text: 'Başlanğıc' },
                    { value: 'intermediate', text: 'Orta' },
                    { value: 'advanced', text: 'İrəli' }
                ],
                tr: [
                    { value: 'beginner', text: 'Başlangıç' },
                    { value: 'intermediate', text: 'Orta' },
                    { value: 'advanced', text: 'İleri' }
                ]
            },
            preference: {
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
                    { value: 'home', text: 'Ev Egzersizleri' },
                    { value: 'gym', text: 'Spor Salonu Egzersizleri' },
                    { value: 'outdoor', text: 'Açık Hava Egzersizleri' }
                ]
            }
        };
        
        // Update select options
        for (const selectId in formOptions) {
            updateSelectOptions(selectId, formOptions[selectId][currentLanguage]);
        }
    }
    
    // Helper function to update select options
    function updateSelectOptions(selectId, options) {
        const select = document.getElementById(selectId);
        if (select) {
            // Get currently selected value
            const currentValue = select.value;
            
            // Clear current options
            select.innerHTML = '';
            
            // Add new options
            options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.text;
                select.appendChild(optionElement);
            });
            
            // Restore selected value if it exists in new options
            if (options.some(option => option.value === currentValue)) {
                select.value = currentValue;
            }
        }
    }

    // Expose necessary functions to the window
    window.startVoiceInput = startVoiceInput;
    window.showFormInput = showFormInput;
    window.finishVoiceInput = finishVoiceInput;
    window.changeLanguage = changeLanguage;
    window.completeConversation = completeConversation;
    window.showExerciseDetails = showExerciseDetails;
    
    // Initialize language
    updateUIText();
});