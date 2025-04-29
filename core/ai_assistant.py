import os
import json
from openai import OpenAI

# Initialize the OpenAI client - the newest OpenAI model is "gpt-4o" which was released May 13, 2024
# do not change this unless explicitly requested by the user
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Language-specific system instructions
SYSTEM_INSTRUCTIONS = {
    "en": """
    You are a friendly, knowledgeable female fitness assistant named Aria. Your voice is warm, supportive, and encouraging.
    You are having a conversation with a user to help them create a personalized fitness plan.
    Keep your responses conversational, supportive, and concise. Use simple language and avoid technical jargon.
    Focus on understanding the user's fitness goals, experience level, schedule, preferences, and any physical limitations.
    Ask one question at a time in a natural, conversational flow.
    """,
    
    "az": """
    Siz Aria adlı dostcasına, bilikli qadın fitness köməkçisisiniz. Səsiniz isti, dəstəkləyici və həvəsləndiricidir.
    İstifadəçiyə fərdi fitness planı yaratmağa kömək etmək üçün bir söhbət aparırsınız.
    Cavablarınızı söhbət şəklində, dəstəkləyici və qısa saxlayın. Sadə dil istifadə edin və texniki jarqondan çəkinin.
    İstifadəçinin fitness məqsədlərini, təcrübə səviyyəsini, cədvəlini, üstünlüklərini və hər hansı fiziki məhdudiyyətlərini anlamağa diqqət yetirin.
    Təbii, söhbət axınında bir anda bir sual verin.
    """,
    
    "tr": """
    Siz Aria adında dostça, bilgili bir kadın fitness asistanısınız. Sesiniz sıcak, destekleyici ve cesaretlendiricidir.
    Kullanıcıya kişiselleştirilmiş bir fitness planı oluşturmasında yardımcı olmak için bir konuşma yapıyorsunuz.
    Yanıtlarınızı sohbet tarzında, destekleyici ve özlü tutun. Basit bir dil kullanın ve teknik jargondan kaçının.
    Kullanıcının fitness hedeflerini, deneyim seviyesini, programını, tercihlerini ve fiziksel kısıtlamalarını anlamaya odaklanın.
    Doğal bir sohbet akışında bir seferde bir soru sorun.
    """
}

# Sample questions for different languages
SAMPLE_QUESTIONS = {
    "en": [
        {"key": "name", "question": "Hi there! I'm Aria, your personal fitness assistant. What's your name?"},
        {"key": "goal", "question": "Nice to meet you, {name}! What's your main fitness goal? For example, weight loss, muscle building, overall fitness, or something else?"},
        {"key": "days", "question": "How many days per week can you realistically commit to working out?"},
        {"key": "level", "question": "What's your current fitness level? Beginner, intermediate, or advanced?"},
        {"key": "preference", "question": "Do you prefer working out at home, in a gym, or outdoors?"},
        {"key": "restrictions", "question": "Do you have any physical restrictions or injuries I should know about when creating your plan?"}
    ],
    "az": [
        {"key": "name", "question": "Salam! Mən Aria, şəxsi fitness köməkçinizəm. Adınız nədir?"},
        {"key": "goal", "question": "Tanış olmağıma şadam, {name}! Əsas fitness hədəfiniz nədir? Məsələn, çəki azaltmaq, əzələ qurmaq, ümumi fitness və ya başqa?"},
        {"key": "days", "question": "Həftədə neçə gün məşq etməyə həqiqətən vaxt ayıra bilərsiniz?"},
        {"key": "level", "question": "Hal-hazırda fitness səviyyəniz necədir? Başlanğıc, orta, yoxsa irəli?"},
        {"key": "preference", "question": "Evdə, idman zalında, yoxsa açıq havada məşq etməyi üstün tutursunuz?"},
        {"key": "restrictions", "question": "Planınızı yaradarkən bilməli olduğum hər hansı fiziki məhdudiyyətləriniz və ya zədələriniz var?"}
    ],
    "tr": [
        {"key": "name", "question": "Merhaba! Ben Aria, kişisel fitness asistanınız. Adınız nedir?"},
        {"key": "goal", "question": "Tanıştığımıza memnun oldum, {name}! Ana fitness hedefiniz nedir? Örneğin, kilo kaybı, kas yapma, genel fitness veya başka bir şey?"},
        {"key": "days", "question": "Haftada kaç gün gerçekçi olarak egzersiz yapmaya zaman ayırabilirsiniz?"},
        {"key": "level", "question": "Şu anki fitness seviyeniz nedir? Başlangıç, orta, yoksa ileri mi?"},
        {"key": "preference", "question": "Evde, spor salonunda yoksa açık havada egzersiz yapmayı mı tercih edersiniz?"},
        {"key": "restrictions", "question": "Planınızı oluştururken bilmem gereken herhangi bir fiziksel kısıtlamanız veya yaralanmanız var mı?"}
    ]
}

def format_questions_for_language(lang='en', name=None):
    """Get the list of questions for a given language with name substitution if provided."""
    questions = SAMPLE_QUESTIONS.get(lang, SAMPLE_QUESTIONS['en']).copy()
    
    # Replace {name} placeholder if a name is provided
    if name and len(name.strip()) > 0:
        for q in questions:
            if '{name}' in q['question']:
                q['question'] = q['question'].replace('{name}', name)
    
    return questions

def process_voice_input(text, language='en', conversation_context=None):
    """
    Process voice input and determine the appropriate response using GPT-4o.
    Returns the response text and updated conversation context.
    """
    if not conversation_context:
        conversation_context = {
            "answers": {},
            "current_question": 0,
            "language": language,
            "questions": format_questions_for_language(language)
        }
    
    # Set system instruction based on language
    system_instruction = SYSTEM_INSTRUCTIONS.get(language, SYSTEM_INSTRUCTIONS['en'])
    
    # Build the conversation history
    messages = [
        {"role": "system", "content": system_instruction}
    ]
    
    # Add the current conversation context if any
    if "history" in conversation_context and conversation_context["history"]:
        messages.extend(conversation_context["history"])
    
    # Add the user's current message
    messages.append({"role": "user", "content": text})
    
    try:
        # Call OpenAI API - using gpt-4o which is the newest model
        response = openai_client.chat.completions.create(
            model="gpt-4o",  # the newest OpenAI model
            messages=messages,
            max_tokens=200,
            temperature=0.7
        )
        
        # Get the response text
        ai_response = response.choices[0].message.content
        
        # Update conversation history
        if "history" not in conversation_context:
            conversation_context["history"] = []
        
        conversation_context["history"].append({"role": "user", "content": text})
        conversation_context["history"].append({"role": "assistant", "content": ai_response})
        
        # Process the user's input for the current question
        questions = conversation_context["questions"]
        current_q_idx = conversation_context["current_question"]
        
        if current_q_idx < len(questions):
            current_question = questions[current_q_idx]
            key = current_question["key"]
            
            # Check if this is a response to the name question
            if key == "name" and current_q_idx == 0:
                # Extract the name from the user's input
                extracted_name = extract_name_from_text(text, language)
                if extracted_name:
                    conversation_context["answers"]["name"] = extracted_name
                    
                    # Format the remaining questions with the name
                    conversation_context["questions"] = format_questions_for_language(
                        language, extracted_name
                    )
                    
                    # Move to the next question
                    conversation_context["current_question"] = current_q_idx + 1
                    
                    # Return the next question
                    if current_q_idx + 1 < len(questions):
                        return conversation_context["questions"][current_q_idx + 1]["question"], conversation_context
                    else:
                        # All questions answered
                        return get_completion_message(language), conversation_context
            else:
                # For other questions, store the answer and move to the next question
                conversation_context["answers"][key] = text
                conversation_context["current_question"] = current_q_idx + 1
                
                # Return the next question or completion message
                if current_q_idx + 1 < len(questions):
                    return conversation_context["questions"][current_q_idx + 1]["question"], conversation_context
                else:
                    # All questions answered
                    return get_completion_message(language), conversation_context
        
        # If we're not in the structured questionnaire flow, just return the AI response
        return ai_response, conversation_context
        
    except Exception as e:
        print(f"Error calling OpenAI API: {str(e)}")
        error_messages = {
            "en": "I'm sorry, I couldn't process that. Could you try again?",
            "az": "Üzr istəyirəm, bunu emal edə bilmədim. Yenidən cəhd edə bilərsinizmi?",
            "tr": "Üzgünüm, bunu işleyemedim. Tekrar deneyebilir misiniz?"
        }
        return error_messages.get(language, error_messages["en"]), conversation_context

def extract_name_from_text(text, language='en'):
    """Extract a name from the user's input text."""
    try:
        # Use GPT to extract the name
        system_prompts = {
            "en": "Extract only the person's name from the text. Return just the name, nothing else.",
            "az": "Mətndən yalnız şəxsin adını çıxarın. Yalnız adı qaytarın, başqa heç nə.",
            "tr": "Metinden sadece kişinin adını çıkarın. Sadece adı döndürün, başka bir şey değil."
        }
        
        prompt = system_prompts.get(language, system_prompts["en"])
        
        response = openai_client.chat.completions.create(
            model="gpt-4o",  # the newest OpenAI model
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": text}
            ],
            max_tokens=50,
            temperature=0.3
        )
        
        name = response.choices[0].message.content.strip()
        
        # If the extracted content is too long, it's probably not just a name
        if len(name.split()) > 3:
            # Try a more direct approach
            prompt_words = {
                "en": "my name is",
                "az": "mənim adım",
                "tr": "benim adım"
            }
            
            prompt_word = prompt_words.get(language, prompt_words["en"]).lower()
            text_lower = text.lower()
            
            if prompt_word in text_lower:
                # Extract text after "my name is" or equivalent
                name_part = text_lower.split(prompt_word)[1].strip()
                # Take first word as name
                name = name_part.split()[0].capitalize()
            else:
                # Default to first word if all else fails
                name = text.split()[0].capitalize()
        
        return name
        
    except Exception as e:
        print(f"Error extracting name: {str(e)}")
        return None

def get_next_question(language='en', conversation_context=None):
    """Get the next question based on the conversation context."""
    if not conversation_context:
        # Start with the first question
        questions = format_questions_for_language(language)
        return questions[0]["question"], {
            "answers": {},
            "current_question": 0,
            "language": language,
            "questions": questions,
            "history": []
        }
    
    current_q_idx = conversation_context["current_question"]
    questions = conversation_context["questions"]
    
    if current_q_idx < len(questions):
        return questions[current_q_idx]["question"], conversation_context
    else:
        # All questions answered
        return get_completion_message(language), conversation_context

def get_completion_message(language='en'):
    """Get the completion message for the questionnaire."""
    messages = {
        "en": "Thank you for providing all this information! I'll now generate your personalized fitness plan...",
        "az": "Bütün bu məlumatları təqdim etdiyiniz üçün təşəkkür edirik! İndi sizin fərdi fitness planınızı yaradacağam...",
        "tr": "Tüm bu bilgileri sağladığınız için teşekkür ederim! Şimdi kişiselleştirilmiş fitness planınızı oluşturacağım..."
    }
    return messages.get(language, messages["en"])

def generate_voice_response(text, language='en'):
    """
    Generate a more engaging and conversational response.
    This could be used to create audio for Text-to-Speech systems.
    """
    try:
        # Define friendly intros based on language
        intros = {
            "en": ["Great! ", "Perfect! ", "Excellent! ", "Thanks for sharing that! ", "I understand. ", "Got it! "],
            "az": ["Əla! ", "Mükəmməl! ", "Əla! ", "Paylaşdığınız üçün təşəkkür edirik! ", "Başa düşürəm. ", "Anladım! "],
            "tr": ["Harika! ", "Mükemmel! ", "Mükemmel! ", "Paylaştığınız için teşekkürler! ", "Anlıyorum. ", "Anladım! "]
        }
        
        # Define follow-up questions based on language
        followups = {
            "en": [" How does that sound?", " Does that work for you?", " Is that right?", " Is there anything else you'd like to add?"],
            "az": [" Bu necə səslənir?", " Bu sizin üçün işləyir?", " Bu doğrudur?", " Əlavə etmək istədiyiniz başqa bir şey var?"],
            "tr": [" Nasıl geliyor?", " Bu sizin için uygun mu?", " Doğru mu?", " Eklemek istediğiniz başka bir şey var mı?"]
        }
        
        # Get the appropriate language options, defaulting to English
        lang_intros = intros.get(language, intros["en"])
        lang_followups = followups.get(language, followups["en"])
        
        # Generate enhanced response with OpenAI
        system_prompts = {
            "en": f"You are Aria, a friendly female fitness assistant. Rephrase the following text to sound more conversational and engaging. Add a friendly intro from this list {lang_intros} and occasionally a follow-up question from this list {lang_followups}. Keep it concise.",
            "az": f"Siz Aria, dostcasına qadın fitness köməkçisisiniz. Aşağıdakı mətni daha söhbət və cəlbedici səslənmək üçün yenidən ifadə edin. Bu siyahıdan {lang_intros} dostcasına bir giriş əlavə edin və vaxtaşırı bu siyahıdan {lang_followups} bir izləmə sualı əlavə edin. Qısa saxlayın.",
            "tr": f"Sen Aria, arkadaş canlısı bir kadın fitness asistanısın. Aşağıdaki metni daha konuşma tarzında ve ilgi çekici olacak şekilde yeniden ifade et. Bu listeden {lang_intros} arkadaş canlısı bir giriş ekle ve bazen bu listeden {lang_followups} bir takip sorusu ekle. Kısa tut."
        }
        
        prompt = system_prompts.get(language, system_prompts["en"])
        
        response = openai_client.chat.completions.create(
            model="gpt-4o",  # the newest OpenAI model
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": text}
            ],
            max_tokens=200,
            temperature=0.7
        )
        
        enhanced_text = response.choices[0].message.content.strip()
        return enhanced_text
        
    except Exception as e:
        print(f"Error generating enhanced voice response: {str(e)}")
        return text  # Return original text if there's an error