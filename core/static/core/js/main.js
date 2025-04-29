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

    // Form data collected through voice
    let voiceFormData = {
        name: '',
        goal: '',
        days: '',
        level: '',
        preference: '',
        restrictions: ''
    };

    // Questions to ask during voice input
    const questions = [
        { key: 'name', question: "What's your name?" },
        { key: 'goal', question: "What's your main fitness goal? For example, general fitness, weight loss, building muscle, etc." },
        { key: 'days', question: "How many days per week can you workout? Choose between 2 to 6 days." },
        { key: 'level', question: "What's your fitness experience level? Beginner, intermediate, or advanced?" },
        { key: 'preference', question: "Where do you prefer to workout? At home, in a gym, or outdoors?" },
        { key: 'restrictions', question: "Do you have any physical restrictions or limitations? If none, just say 'none'." }
    ];

    let currentQuestionIndex = 0;
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
        recognition.lang = 'en-US';

        // Handle speech recognition results
        recognition.onresult = function(event) {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            recognitionStatus.textContent = `I heard: "${transcript}"`;
            
            // Update progress bar for visual feedback
            voiceProgress.style.width = `${((currentQuestionIndex + 1) / questions.length) * 100}%`;
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
                    // If no valid transcript, ask the same question again
                    askQuestion(questions[currentQuestionIndex].question);
                }
            }
        };

        // Handle errors
        recognition.onerror = function(event) {
            console.error('Speech recognition error', event.error);
            recognitionStatus.textContent = `Error: ${event.error}. Please try again or use the form.`;
            isListening = false;
        };

        return true;
    }

    // Start voice input process
    function startVoiceInput() {
        if (!setupSpeechRecognition()) return;

        // Reset and start
        currentQuestionIndex = 0;
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

    // Ask a question using speech synthesis
    function askQuestion(question) {
        recognitionStatus.textContent = question;
        
        // Use speech synthesis to ask the question
        const utterance = new SpeechSynthesisUtterance(question);
        utterance.onend = function() {
            // Start listening after question is spoken
            isListening = true;
            recognition.start();
        };
        speechSynthesis.speak(utterance);
    }

    // Finish voice input and submit the form
    function finishVoiceInput() {
        isListening = false;
        voiceInputStatus.classList.add('hidden');
        
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
        
        // Make API request to generate the plan
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
                displayPlanResults(data.plan);
            } else {
                throw new Error(data.error || 'Unknown error occurred');
            }
        })
        .catch(error => {
            alert('Error generating plan: ' + error.message);
        })
        .finally(() => {
            document.body.style.cursor = 'default';
        });
    }

    // Display the generated plan
    function displayPlanResults(plan) {
        // Hide other sections and show results
        voiceInputStatus.classList.add('hidden');
        formInput.classList.add('hidden');
        planResults.classList.remove('hidden');
        
        // Populate plan details
        planTitle.textContent = plan.plan_title;
        planIntro.textContent = plan.introduction;
        
        // Populate weekly schedule
        weeklySchedule.innerHTML = '';
        for (const [day, workout] of Object.entries(plan.weekly_schedule)) {
            const dayElement = document.createElement('div');
            dayElement.className = 'px-3 py-2 bg-blue-100 rounded';
            dayElement.innerHTML = `<strong>${day}:</strong> ${workout}`;
            weeklySchedule.appendChild(dayElement);
        }
        
        // Setup download button
        downloadPdfBtn.setAttribute('href', '/download-pdf/');
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
        
        return csrfToken || '';
    }

    // Event listeners
    startVoiceBtn.addEventListener('click', startVoiceInput);
    
    stopVoiceBtn.addEventListener('click', function() {
        if (recognition) {
            isListening = false;
            recognition.abort();
            showFormInput();
        }
    });
    
    showFormBtn.addEventListener('click', showFormInput);
    
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

    // Initialize - show the form by default
    showFormInput();
});
