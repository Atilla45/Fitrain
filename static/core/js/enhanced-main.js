/**
 * Enhanced Main JavaScript
 * Handles voice interaction, form submission, and plan display
 */

// Global variables
let speechRecognition;
let isListening = false;
let conversationContext = null;
let selectedLanguage = 'en';
let questions;
let selectedVoice;
let maxQuestions = 5;
let currentQuestionIndex = 0;
let answers = {};

// DOM Elements
const voiceInputStatus = document.getElementById('voiceInputStatus');
const conversationContainer = document.getElementById('conversationContainer');
const messagesContainer = document.getElementById('messagesContainer');
const formInput = document.getElementById('formInput');
const planResults = document.getElementById('planResults');
const completeConversationBtn = document.getElementById('completeConversationBtn');
const languageFeedback = document.getElementById('language-feedback');

// Text translations for UI elements
const uiText = {
    en: {
        conversationTitle: 'Conversation with Aria',
        listeningStatus: 'Listening...',
        processingStatus: 'Processing...',
        continueVoice: 'Continue with Voice',
        startVoice: 'Start Voice Assistant',
        useForm: 'Use Text Form',
        generatePlan: 'Generate My Plan',
        formTitle: 'Create Your Personalized Plan',
        goals: {
            general: 'General Fitness & Health',
            weight_loss: 'Weight Loss',
            muscle: 'Build Muscle',
            strength: 'Increase Strength',
            endurance: 'Improve Endurance'
        },
        levels: {
            beginner: 'Beginner',
            intermediate: 'Intermediate',
            advanced: 'Advanced'
        },
        preferences: {
            home: 'Home Workouts',
            gym: 'Gym Workouts',
            outdoor: 'Outdoor Workouts'
        },
        daysPerWeek: 'Days Per Week Available',
        days: ['2 days', '3 days', '4 days', '5 days', '6 days'],
        scheduleTabs: {
            weekly: 'Weekly Schedule',
            nutrition: 'Nutrition',
            workouts: 'Workouts'
        }
    },
    az: {
        conversationTitle: 'Aria ilə söhbət',
        listeningStatus: 'Dinləyirəm...',
        processingStatus: 'İşlənir...',
        continueVoice: 'Səslə davam edin',
        startVoice: 'Səsli Köməkçini Başlat',
        useForm: 'Mətn Formasını İstifadə Et',
        generatePlan: 'Mənim Fitness Planımı Yarat',
        formTitle: 'Şəxsi Planınızı Yaradın',
        goals: {
            general: 'Ümumi Fitness və Sağlamlıq',
            weight_loss: 'Çəki Azaltma',
            muscle: 'Əzələ Qurmaq',
            strength: 'Gücü Artırmaq',
            endurance: 'Dözümlülüyü İnkişaf Etdirmək'
        },
        levels: {
            beginner: 'Başlanğıc',
            intermediate: 'Orta səviyyə',
            advanced: 'Qabaqcıl'
        },
        preferences: {
            home: 'Ev Məşqləri',
            gym: 'Idman Zalı Məşqləri',
            outdoor: 'Açıq Hava Məşqləri'
        },
        daysPerWeek: 'Həftədə Mövcud Günlər',
        days: ['2 gün', '3 gün', '4 gün', '5 gün', '6 gün'],
        scheduleTabs: {
            weekly: 'Həftəlik Cədvəl',
            nutrition: 'Qidalanma',
            workouts: 'Məşqlər'
        }
    },
    tr: {
        conversationTitle: 'Aria ile konuşma',
        listeningStatus: 'Dinliyorum...',
        processingStatus: 'İşleniyor...',
        continueVoice: 'Sesle Devam Et',
        startVoice: 'Sesli Asistanı Başlat',
        useForm: 'Metin Formunu Kullan',
        generatePlan: 'Fitness Planımı Oluştur',
        formTitle: 'Kişiselleştirilmiş Planınızı Oluşturun',
        goals: {
            general: 'Genel Fitness ve Sağlık',
            weight_loss: 'Kilo Verme',
            muscle: 'Kas Yapma',
            strength: 'Güç Artırma',
            endurance: 'Dayanıklılık Geliştirme'
        },
        levels: {
            beginner: 'Başlangıç',
            intermediate: 'Orta Seviye',
            advanced: 'İleri Seviye'
        },
        preferences: {
            home: 'Ev Egzersizleri',
            gym: 'Spor Salonu Egzersizleri',
            outdoor: 'Açık Hava Egzersizleri'
        },
        daysPerWeek: 'Haftada Müsait Günler',
        days: ['2 gün', '3 gün', '4 gün', '5 gün', '6 gün'],
        scheduleTabs: {
            weekly: 'Haftalık Program',
            nutrition: 'Beslenme',
            workouts: 'Egzersizler'
        }
    }
};

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setupSpeechRecognition();
    getQuestions();
    
    // Set up speech synthesis
    if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = function() {
            const voices = window.speechSynthesis.getVoices();
            console.log("Available voices:", voices);
            
            // Select an appropriate voice based on language
            let voiceName;
            switch(selectedLanguage) {
                case 'az':
                    voiceName = 'Microsoft Server Speech Text to Speech Voice (az-AZ, BabekNeural)';
                    break;
                case 'tr':
                    voiceName = 'Microsoft Server Speech Text to Speech Voice (tr-TR, EmelNeural)';
                    break;
                default:
                    voiceName = 'Google UK English Female';
            }
            
            selectedVoice = voices.find(voice => voice.name === voiceName) || 
                            voices.find(voice => voice.lang.startsWith(selectedLanguage)) || 
                            voices[0];
            
            console.log("Selected voice:", selectedVoice?.name || "Default voice");
        };
        window.speechSynthesis.getVoices();
    }
    
    // Tabs functionality in the plan results
    document.querySelectorAll('.plan-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            
            // Hide all content
            document.querySelectorAll('.plan-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.plan-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected content and activate tab
            document.getElementById(target).classList.add('active');
            this.classList.add('active');
        });
    });
});

/**
 * Fetches conversation questions from the server
 */
function getQuestions() {
    // In a real app, this would fetch from the server
    // For now, using hardcoded questions
    questions = {
        en: [
            "Hello! I'm Aria, your AI fitness assistant. What's your name?",
            "Nice to meet you, {name}! What's your main fitness goal? For example, weight loss, building muscle, or improving endurance?",
            "Great! How would you describe your current fitness level? Beginner, intermediate, or advanced?",
            "How many days per week can you commit to working out?",
            "Do you prefer home workouts, gym workouts, or outdoor activities?",
            "Do you have any physical limitations or injuries I should know about?"
        ],
        az: [
            "Salam! Mən Aria, sizin süni intellekt fitness köməkçinizəm. Adınız nədir?",
            "Tanış olmağıma şadam, {name}! Əsas fitness hədəfiniz nədir? Məsələn, çəki itkisi, əzələ qurmaq və ya davamlılığı artırmaq?",
            "Əla! Hazırkı fitness səviyyənizi necə təsvir edərdiniz? Başlanğıc, orta və ya qabaqcıl?",
            "Həftədə neçə gün məşq etməyə vaxt ayıra bilərsiniz?",
            "Ev məşqləri, idman zalı məşqləri, yoxsa açıq havada fəaliyyət göstərməyi üstün tutursunuz?",
            "Bilməli olduğum hər hansı fiziki məhdudiyyətiniz və ya xəsarətiniz varmı?"
        ],
        tr: [
            "Merhaba! Ben Aria, AI fitness asistanınızım. Adınız nedir?",
            "Tanıştığımıza memnun oldum, {name}! Ana fitness hedefiniz nedir? Örneğin, kilo vermek, kas geliştirmek veya dayanıklılığı artırmak?",
            "Harika! Mevcut fitness seviyenizi nasıl tanımlarsınız? Başlangıç, orta veya ileri seviye?",
            "Haftada kaç gün antrenman yapmaya vakit ayırabilirsiniz?",
            "Ev egzersizlerini, spor salonu egzersizlerini yoksa açık hava aktivitelerini mi tercih edersiniz?",
            "Bilmem gereken herhangi bir fiziksel kısıtlamanız veya yaralanmanız var mı?"
        ]
    };
}

/**
 * Sets up speech recognition for voice input
 */
function setupSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
        speechRecognition = new webkitSpeechRecognition();
        speechRecognition.continuous = false;
        speechRecognition.interimResults = true;
        
        speechRecognition.onstart = function() {
            isListening = true;
            document.getElementById('recognitionStatus').textContent = uiText[selectedLanguage].listeningStatus;
            
            // Animate progress bar
            let width = 0;
            const progressBar = document.getElementById('voiceProgress');
            const interval = setInterval(() => {
                if (width >= 100 || !isListening) {
                    clearInterval(interval);
                } else {
                    width += 0.5;
                    progressBar.style.width = width + '%';
                }
            }, 100);
        };
        
        speechRecognition.onresult = function(event) {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            
            document.getElementById('recognitionStatus').textContent = transcript;
        };
        
        speechRecognition.onend = function() {
            isListening = false;
            const finalTranscript = document.getElementById('recognitionStatus').textContent;
            
            if (finalTranscript !== uiText[selectedLanguage].listeningStatus && 
                finalTranscript !== uiText[selectedLanguage].processingStatus) {
                document.getElementById('recognitionStatus').textContent = uiText[selectedLanguage].processingStatus;
                
                // Process the voice input
                processVoiceWithAI(finalTranscript);
            } else {
                // If no speech was detected, restart recognition
                if (isListening) {
                    speechRecognition.start();
                }
            }
        };
        
        speechRecognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            isListening = false;
            
            if (event.error === 'no-speech') {
                // If no speech was detected, restart recognition
                if (document.getElementById('voiceInputStatus').classList.contains('block')) {
                    speechRecognition.start();
                }
            }
        };
    } else {
        alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
    }
}

/**
 * Starts the voice input process
 * @param {boolean} continueConversation - Whether to continue an existing conversation
 */
function startVoiceInput(continueConversation = false) {
    if (!('webkitSpeechRecognition' in window)) {
        alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
        return;
    }
    
    // Hide other input methods
    formInput.classList.add('hidden');
    planResults.classList.add('hidden');
    
    // Show voice input status
    voiceInputStatus.classList.remove('hidden');
    voiceInputStatus.classList.add('block');
    
    // Show conversation container if starting or continuing
    conversationContainer.classList.remove('hidden');
    conversationContainer.classList.add('block');
    
    // Update conversation title
    document.getElementById('conversationTitle').textContent = uiText[selectedLanguage].conversationTitle;
    
    // If continuing, don't add the initial message again
    if (!continueConversation && messagesContainer.children.length === 0) {
        // Start conversation with first question
        const loadingId = addLoadingMessage();
        
        setTimeout(() => {
            removeLoadingMessage(loadingId);
            
            // Add the first question from the AI
            const firstQuestion = questions[selectedLanguage][0];
            addAIMessage(firstQuestion);
            
            // Speak the question
            speakText(firstQuestion, () => {
                // Start listening after speaking
                if (speechRecognition) {
                    speechRecognition.lang = selectedLanguage === 'en' ? 'en-US' : 
                                             selectedLanguage === 'az' ? 'az-AZ' : 'tr-TR';
                    speechRecognition.start();
                }
            });
        }, 1000);
    } else {
        // Continue existing conversation
        if (speechRecognition) {
            speechRecognition.lang = selectedLanguage === 'en' ? 'en-US' : 
                                     selectedLanguage === 'az' ? 'az-AZ' : 'tr-TR';
            speechRecognition.start();
        }
    }
}

/**
 * Processes the user's voice input with AI
 * @param {string} text - The user's speech transcript
 */
function processVoiceWithAI(text) {
    // Show user's message
    addUserMessage(text);
    
    // In a real app, send to server for processing
    // For the demo, simulate AI processing
    const loadingId = addLoadingMessage();
    
    if (conversationContext === null) {
        // Initialize context with the first answer (name)
        conversationContext = {
            questionIndex: 0,
            answers: {
                name: text
            }
        };
        currentQuestionIndex = 1;
    } else {
        // Store answer based on the current question
        switch(conversationContext.questionIndex) {
            case 0:
                conversationContext.answers.name = text;
                break;
            case 1:
                conversationContext.answers.goal = text.toLowerCase();
                break;
            case 2:
                conversationContext.answers.level = text.toLowerCase();
                break;
            case 3:
                conversationContext.answers.days = text.replace(/\D/g, ''); // Extract number
                break;
            case 4:
                conversationContext.answers.preference = text.toLowerCase().includes('gym') ? 'gym' : 
                                                        text.toLowerCase().includes('outdoor') ? 'outdoor' : 'home';
                break;
            case 5:
                conversationContext.answers.restrictions = text;
                break;
        }
        
        conversationContext.questionIndex++;
        currentQuestionIndex = conversationContext.questionIndex;
    }
    
    // If all questions are answered, show completion button
    if (currentQuestionIndex >= questions[selectedLanguage].length - 1) {
        completeConversationBtn.classList.remove('hidden');
    }
    
    // Fetch next question or completion message
    setTimeout(() => {
        removeLoadingMessage(loadingId);
        fetchNextAIQuestion();
    }, 1500);
}

/**
 * Fetches the next question from the AI
 */
function fetchNextAIQuestion() {
    if (currentQuestionIndex < questions[selectedLanguage].length) {
        let nextQuestion = questions[selectedLanguage][currentQuestionIndex];
        
        // Replace {name} placeholder with the actual name
        if (conversationContext && conversationContext.answers.name) {
            nextQuestion = nextQuestion.replace('{name}', conversationContext.answers.name);
        }
        
        // Add AI message to the conversation
        addAIMessage(nextQuestion);
        
        // Speak the question
        speakText(nextQuestion, () => {
            // Continue listening
            finishVoiceInput();
        });
    } else {
        // All questions answered - show completion message
        const completionMessage = get_completion_message();
        addAIMessage(completionMessage);
        
        // Show the generate plan button
        completeConversationBtn.classList.remove('hidden');
        
        // Stop listening
        finishVoiceInput();
    }
}

/**
 * Gets the completion message for the questionnaire
 * @returns {string} The completion message
 */
function get_completion_message() {
    const messages = {
        en: "Great! I have all the information I need to create your personalized fitness plan. Click 'Generate My Plan' when you're ready!",
        az: "Əla! Şəxsi fitness planınızı yaratmaq üçün lazım olan bütün məlumatları əldə etdim. Hazır olduğunuzda 'Planımı Yarat' düyməsini basın!",
        tr: "Harika! Kişiselleştirilmiş fitness planınızı oluşturmak için ihtiyacım olan tüm bilgilere sahibim. Hazır olduğunuzda 'Planımı Oluştur' butonuna tıklayın!"
    };
    
    return messages[selectedLanguage] || messages.en;
}

/**
 * Adds an AI message to the conversation
 * @param {string} text - The message text
 */
function addAIMessage(text) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message ai-message scale-in';
    
    messageElement.innerHTML = `
        <div class="message-avatar ai-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-bubble">
            <div class="message-name">Aria</div>
            <div class="message-text">${text}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Adds a user message to the conversation
 * @param {string} text - The message text
 */
function addUserMessage(text) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message user-message scale-in';
    
    messageElement.innerHTML = `
        <div class="message-avatar user-avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="message-bubble">
            <div class="message-name">You</div>
            <div class="message-text">${text}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Adds a loading message to the conversation
 * @returns {string} The loading message ID
 */
function addLoadingMessage() {
    const id = 'loading-' + Date.now();
    const loadingElement = document.createElement('div');
    loadingElement.className = 'message ai-message scale-in';
    loadingElement.id = id;
    
    loadingElement.innerHTML = `
        <div class="message-avatar ai-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-bubble message-loading">
            <div class="typing-indicator">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(loadingElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return id;
}

/**
 * Removes a loading message from the conversation
 * @param {string} id - The loading message ID
 */
function removeLoadingMessage(id) {
    const loadingElement = document.getElementById(id);
    if (loadingElement) {
        loadingElement.remove();
    }
}

/**
 * Uses the speech synthesis API to speak text
 * @param {string} text - The text to speak
 * @param {Function} callback - Function to call after speaking
 */
function speakText(text, callback) {
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        
        // Match language to selected language
        switch(selectedLanguage) {
            case 'az':
                utterance.lang = 'az-AZ';
                break;
            case 'tr':
                utterance.lang = 'tr-TR';
                break;
            default:
                utterance.lang = 'en-GB';
        }
        
        utterance.rate = 1;
        utterance.pitch = 1;
        
        utterance.onend = function() {
            if (callback) callback();
        };
        
        window.speechSynthesis.speak(utterance);
    } else {
        // Speech synthesis not supported, just call the callback
        if (callback) callback();
    }
}

/**
 * Finishes the voice input process
 */
function finishVoiceInput() {
    if (speechRecognition) {
        speechRecognition.stop();
    }
    
    voiceInputStatus.classList.remove('block');
    voiceInputStatus.classList.add('hidden');
}

/**
 * Completes the conversation and generates the fitness plan
 */
function completeConversation() {
    finishVoiceInput();
    
    // Show a loading message in the conversation
    const loadingId = addLoadingMessage();
    
    // Use the answers from the conversation to generate a plan
    setTimeout(() => {
        removeLoadingMessage(loadingId);
        
        // Add a final message
        const finalMessage = {
            en: "Your fitness plan is ready! You can see it below.",
            az: "Fitness planınız hazırdır! Aşağıda görə bilərsiniz.",
            tr: "Fitness planınız hazır! Aşağıda görebilirsiniz."
        }[selectedLanguage];
        
        addAIMessage(finalMessage);
        
        // Hide the conversation UI elements
        document.getElementById('continueVoiceBtn').classList.add('hidden');
        completeConversationBtn.classList.add('hidden');
        
        // Convert conversation answers to form data structure
        const formData = {
            name: conversationContext.answers.name,
            goal: conversationContext.answers.goal.includes('weight') ? 'weight_loss' :
                  conversationContext.answers.goal.includes('muscle') ? 'muscle' :
                  conversationContext.answers.goal.includes('strength') ? 'strength' :
                  conversationContext.answers.goal.includes('endurance') ? 'endurance' : 'general',
            days: conversationContext.answers.days || '3',
            level: conversationContext.answers.level.includes('begin') ? 'beginner' :
                   conversationContext.answers.level.includes('advanced') ? 'advanced' : 'intermediate',
            preference: conversationContext.answers.preference || 'home',
            restrictions: conversationContext.answers.restrictions || ''
        };
        
        // Generate and display the plan
        generatePlan(formData);
    }, 2000);
}

/**
 * Shows the form input for manual data entry
 */
function showFormInput() {
    conversationContainer.classList.add('hidden');
    voiceInputStatus.classList.add('hidden');
    planResults.classList.add('hidden');
    
    formInput.classList.remove('hidden');
    formInput.classList.add('block');
    
    // Update form labels based on language
    document.querySelectorAll('.form-label').forEach(label => {
        const forAttr = label.getAttribute('for');
        if (forAttr === 'goal') {
            label.textContent = uiText[selectedLanguage].formTitle;
        }
    });
    
    // Update form options based on language
    updateFormOptions();
}

/**
 * Generates a fitness plan based on form data
 * @param {Object} formData - The form data
 */
function generatePlan(formData) {
    // In a real app, this would be an API call
    // For the demo, we'll simulate it
    
    fetch('/generate-plan/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Hide input containers
            conversationContainer.classList.add('hidden');
            formInput.classList.add('hidden');
            
            // Show results
            planResults.classList.remove('hidden');
            
            // Display the plan data
            document.getElementById('planTitle').textContent = data.plan.plan_title;
            document.getElementById('planIntroduction').textContent = data.plan.introduction;
            
            // Set up the PDF download link
            document.getElementById('downloadPdfBtn').href = data.plan.pdfLink;
            
            // Display different sections of the plan
            displayWeeklySchedule(data.plan);
            displayDietaryGuidelines(data.plan);
            
            // Make the first tab active by default
            document.querySelector('.plan-tab').click();
        } else {
            alert('There was an error generating your plan. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error generating plan:', error);
        alert('There was an error generating your plan. Please try again.');
    });
}

/**
 * Displays the weekly schedule section of the plan
 * @param {Object} plan - The plan data
 */
function displayWeeklySchedule(plan) {
    const weeklyScheduleContainer = document.getElementById('weeklyScheduleContainer');
    
    if (!plan.weekly_schedule || plan.weekly_schedule.length === 0) {
        weeklyScheduleContainer.innerHTML = '<p>No schedule available</p>';
        return;
    }
    
    // Create the week grid
    const weekGrid = document.createElement('div');
    weekGrid.className = 'week-grid';
    
    // Add each day card to the grid
    plan.weekly_schedule.forEach(day => {
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card fade-in';
        
        const isRestDay = day.workout.toLowerCase().includes('rest');
        
        dayCard.innerHTML = `
            <div class="day-header">
                <h3 class="day-name">${day.day}</h3>
                <div class="day-focus">${day.focus}</div>
            </div>
            <div class="day-body">
                <div class="day-workout">${day.workout}</div>
                <div class="day-duration">
                    <i class="far fa-clock"></i> ${day.duration}
                </div>
                
                ${isRestDay ? `
                    <p class="text-gray-600">Recovery day. Focus on stretching, hydration, and proper nutrition.</p>
                ` : `
                    <ul class="exercise-list">
                        ${day.exercises.slice(0, 3).map(ex => `
                            <li class="exercise-item">
                                <div class="exercise-icon">
                                    <i class="fas fa-dumbbell"></i>
                                </div>
                                <div class="exercise-info">
                                    <h4 class="exercise-name">${ex.name}</h4>
                                    <div class="exercise-details">${ex.sets} sets × ${ex.reps}</div>
                                </div>
                                <button class="view-button" onclick="showExerciseDetails('${ex.name}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </li>
                        `).join('')}
                    </ul>
                    ${day.exercises.length > 3 ? `
                        <div class="mt-4 text-center">
                            <button class="text-primary text-sm font-medium hover:underline">
                                View all ${day.exercises.length} exercises
                            </button>
                        </div>
                    ` : ''}
                `}
            </div>
        `;
        
        weekGrid.appendChild(dayCard);
    });
    
    // Add the week grid to the container
    weeklyScheduleContainer.innerHTML = '';
    weeklyScheduleContainer.appendChild(weekGrid);
}

/**
 * Displays the dietary guidelines section of the plan
 * @param {Object} plan - The plan data
 */
function displayDietaryGuidelines(plan) {
    const nutritionContainer = document.getElementById('nutritionContainer');
    
    nutritionContainer.innerHTML = `
        <div class="nutrition-section fade-in">
            <div class="nutrition-header">
                <div class="nutrition-icon">
                    <i class="fas fa-utensils"></i>
                </div>
                <h3 class="nutrition-title">Dietary Guidelines</h3>
            </div>
            <div class="nutrition-content">
                <p>${plan.dietary_guidelines}</p>
            </div>
        </div>
    `;
}

/**
 * Changes the UI language
 * @param {string} lang - The language code
 */
function changeLanguage(lang) {
    if (lang === selectedLanguage) return;
    
    selectedLanguage = lang;
    
    // Update UI text
    updateUIText();
    
    // Show feedback message
    showLanguageFeedback();
    
    // If using the form, update the options
    updateFormOptions();
    
    // Update the selected option in the selector
    document.getElementById('language-selector').value = lang;
}

/**
 * Updates the UI text based on the selected language
 */
function updateUIText() {
    // Update button text
    document.getElementById('startVoiceBtn').innerHTML = `<i class="fas fa-microphone mr-2"></i> ${uiText[selectedLanguage].startVoice}`;
    document.getElementById('showFormBtn').innerHTML = `<i class="fas fa-keyboard mr-2"></i> ${uiText[selectedLanguage].useForm}`;
    document.getElementById('continueVoiceBtn').innerHTML = `<i class="fas fa-microphone mr-2"></i> ${uiText[selectedLanguage].continueVoice}`;
    document.getElementById('completeConversationBtn').innerHTML = `<i class="fas fa-check mr-2"></i> ${uiText[selectedLanguage].generatePlan}`;
    
    // Update conversation title if it exists
    if (conversationContainer.classList.contains('block')) {
        document.getElementById('conversationTitle').textContent = uiText[selectedLanguage].conversationTitle;
    }
}

/**
 * Shows a brief feedback message when language is changed
 */
function showLanguageFeedback() {
    const feedbackTexts = {
        en: 'Language changed to English!',
        az: 'Dil Azərbaycancaya dəyişdirildi!',
        tr: 'Dil Türkçeye değiştirildi!'
    };
    
    languageFeedback.textContent = feedbackTexts[selectedLanguage];
    languageFeedback.classList.remove('opacity-0');
    
    setTimeout(() => {
        languageFeedback.classList.add('opacity-0');
    }, 2000);
}

/**
 * Updates form options based on the selected language
 */
function updateFormOptions() {
    // Update goal options
    updateSelectOptions('goal', [
        { value: 'general', text: uiText[selectedLanguage].goals.general },
        { value: 'weight_loss', text: uiText[selectedLanguage].goals.weight_loss },
        { value: 'muscle', text: uiText[selectedLanguage].goals.muscle },
        { value: 'strength', text: uiText[selectedLanguage].goals.strength },
        { value: 'endurance', text: uiText[selectedLanguage].goals.endurance }
    ]);
    
    // Update level options
    updateSelectOptions('level', [
        { value: 'beginner', text: uiText[selectedLanguage].levels.beginner },
        { value: 'intermediate', text: uiText[selectedLanguage].levels.intermediate },
        { value: 'advanced', text: uiText[selectedLanguage].levels.advanced }
    ]);
    
    // Update preference options
    updateSelectOptions('preference', [
        { value: 'home', text: uiText[selectedLanguage].preferences.home },
        { value: 'gym', text: uiText[selectedLanguage].preferences.gym },
        { value: 'outdoor', text: uiText[selectedLanguage].preferences.outdoor }
    ]);
    
    // Update days options
    updateSelectOptions('days', [
        { value: '2', text: uiText[selectedLanguage].days[0] },
        { value: '3', text: uiText[selectedLanguage].days[1] },
        { value: '4', text: uiText[selectedLanguage].days[2] },
        { value: '5', text: uiText[selectedLanguage].days[3] },
        { value: '6', text: uiText[selectedLanguage].days[4] }
    ]);
}

/**
 * Updates select options
 * @param {string} selectId - The select element ID
 * @param {Array} options - The options array
 */
function updateSelectOptions(selectId, options) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Save the current value
    const currentValue = select.value;
    
    // Clear existing options
    select.innerHTML = '';
    
    // Add new options
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        select.appendChild(optionElement);
    });
    
    // Restore the selected value
    select.value = currentValue;
}

/**
 * Gets the CSRF token from cookies
 * @returns {string} The CSRF token
 */
function getCsrfToken() {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('csrftoken=')) {
            return cookie.substring('csrftoken='.length, cookie.length);
        }
    }
    return '';
}