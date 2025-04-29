document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const languageSelector = document.getElementById('language-selector');
    
    // Current language - check localStorage first, default to 'en'
    let currentLanguage = localStorage.getItem('preferredLanguage') || 'en';
    
    // Set the language selector to match stored preference
    if (languageSelector) {
        languageSelector.value = currentLanguage;
    }
    
    // Voice language mapping for speech synthesis and recognition
    const voiceLanguages = {
        en: 'en-US',
        az: 'az-AZ', 
        tr: 'tr-TR'
    };
    
    // Create language feedback element
    const languageFeedback = document.createElement('div');
    languageFeedback.className = 'language-feedback';
    languageFeedback.id = 'languageFeedback';
    document.body.appendChild(languageFeedback);
    
    // Language selector event listener
    if (languageSelector) {
        languageSelector.addEventListener('change', function(e) {
            const newLanguage = e.target.value;
            console.log("Language changed from", currentLanguage, "to", newLanguage);
            
            // Update the current language
            currentLanguage = newLanguage;
            
            // Store language preference in localStorage
            localStorage.setItem('preferredLanguage', currentLanguage);
            
            // Show confirmation message in new language
            let message = '';
            if (currentLanguage === 'en') {
                message = 'Language changed to English!';
            } else if (currentLanguage === 'az') {
                message = 'Dil Azərbaycancaya dəyişdirildi!';
            } else if (currentLanguage === 'tr') {
                message = 'Dil Türkçeye değiştirildi!';
            }
            
            // Display feedback and animate it
            languageFeedback.textContent = message;
            languageFeedback.classList.add('active');
            
            // Remove the active class after 3 seconds
            setTimeout(() => {
                languageFeedback.classList.remove('active');
            }, 3000);
            
            // Force the page to reload to apply all language changes
            // This ensures the speech synthesis and recognition are fully updated
            window.location.reload();
        });
    }
    
    // Test speech synthesis with the selected language
    function speakLanguageConfirmation() {
        if ('speechSynthesis' in window) {
            // Create a new SpeechSynthesisUtterance instance
            const utterance = new SpeechSynthesisUtterance();
            
            // Select appropriate language message
            let message = '';
            if (currentLanguage === 'en') {
                message = "The voice language is set to English.";
            } else if (currentLanguage === 'az') {
                message = "Səs dili Azərbaycancaya təyin edilib.";
            } else if (currentLanguage === 'tr') {
                message = "Ses dili Türkçeye ayarlandı.";
            }
            
            // Set language and other properties
            utterance.lang = voiceLanguages[currentLanguage];
            utterance.text = message;
            utterance.volume = 1; // 0 to 1
            utterance.rate = 0.9; // 0.1 to 10
            utterance.pitch = 1.2; // 0 to 2 - higher pitch for female voice
            
            // Wait a bit for voices to load
            setTimeout(() => {
                // Get all available voices
                const voices = speechSynthesis.getVoices();
                console.log("Available voices:", voices.map(v => `${v.name} (${v.lang})`));
                
                // Try to find a female voice
                let femaleVoice = voices.find(v => 
                    v.name.toLowerCase().includes('female') && 
                    v.lang.startsWith(utterance.lang.substring(0,2))
                );
                
                // If no female voice found, try any voice with matching language
                if (!femaleVoice) {
                    femaleVoice = voices.find(v => 
                        v.lang.startsWith(utterance.lang.substring(0,2))
                    );
                }
                
                // If we found a suitable voice, use it
                if (femaleVoice) {
                    console.log("Selected voice:", femaleVoice.name, femaleVoice.lang);
                    utterance.voice = femaleVoice;
                }
                
                // Speak the message
                speechSynthesis.speak(utterance);
            }, 500);
        }
    }
    
    // Speak language confirmation when page loads
    if (window.location.hash !== '#novoice') {
        // Add a delay to make sure the page has fully loaded
        setTimeout(speakLanguageConfirmation, 1000);
    }
});