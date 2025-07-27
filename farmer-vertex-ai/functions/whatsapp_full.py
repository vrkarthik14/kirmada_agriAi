import threading
import os
import json
import pickle
import numpy as np
from datetime import datetime, timedelta
from typing import Any, Dict, List
from flask import Flask, request, jsonify, send_file
from twilio.twiml.messaging_response import MessagingResponse
from twilio.rest import Client
import requests
from PIL import Image
import base64
from io import BytesIO
import tempfile
import time
import mimetypes
import tensorflow as tf
from google.cloud import storage
import logging

# Configure logging for Cloud Functions
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Audio processing imports
try:
    import whisper
    WHISPER_AVAILABLE = True
    logger.info("✅ Whisper available for audio processing")
except ImportError:
    WHISPER_AVAILABLE = False
    logger.warning("⚠️ Whisper not available - install with: pip install openai-whisper")

try:
    from gtts import gTTS
    TTS_AVAILABLE = True
    logger.info("✅ Google Text-to-Speech available")
except ImportError:
    TTS_AVAILABLE = False
    logger.warning("⚠️ gTTS not available - install with: pip install gtts")

# LangChain imports
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import PydanticOutputParser, StrOutputParser
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.tools import tool
from langchain.agents import create_openai_tools_agent, AgentExecutor
from langchain_core.messages import HumanMessage, AIMessage

# Import your Firestore configuration
try:
    from firestore_config import get_db
    db = get_db()
    logger.info("✅ Database connected")
except ImportError:
    logger.warning("⚠️ firestore_config.py not found. Database features disabled.")
    db = None

# Firebase specific configurations
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "your-project-id")
BUCKET_NAME = os.getenv("STORAGE_BUCKET", f"{PROJECT_ID}.appspot.com")

# Initialize Cloud Storage client
try:
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)
    logger.info(f"✅ Cloud Storage initialized: {BUCKET_NAME}")
except Exception as e:
    logger.error(f"⚠️ Cloud Storage initialization failed: {e}")
    storage_client = None
    bucket = None

# Twilio Configuration - now from environment variables
ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")

if not ACCOUNT_SID or not AUTH_TOKEN:
    logger.error("❌ Twilio credentials not found in environment variables!")
    client = None
else:
    client = Client(ACCOUNT_SID, AUTH_TOKEN)
    logger.info("✅ Twilio client initialized")

app = Flask(__name__)

# Global storage - using Cloud Storage for persistence
user_sessions = {}
current_image_data = {}
BASE_URL = os.getenv("BASE_URL", "https://your-project-id.web.app")

# --- Cloud Storage Helper Functions ---
def upload_to_cloud_storage(file_data: bytes, filename: str, content_type: str = None) -> str:
    """Upload file to Cloud Storage and return public URL"""
    try:
        if not bucket:
            logger.error("Cloud Storage not available")
            return None
        
        blob = bucket.blob(f"audio/{filename}")
        if content_type:
            blob.content_type = content_type
        
        blob.upload_from_string(file_data)
        blob.make_public()
        
        public_url = blob.public_url
        logger.info(f"✅ Uploaded to Cloud Storage: {filename}")
        return public_url
        
    except Exception as e:
        logger.error(f"❌ Error uploading to Cloud Storage: {e}")
        return None

def download_model_from_storage(model_filename: str, local_path: str) -> bool:
    """Download model file from Cloud Storage to local temp directory"""
    try:
        if not bucket:
            return False
        
        blob = bucket.blob(f"models/{model_filename}")
        if not blob.exists():
            logger.warning(f"Model {model_filename} not found in Cloud Storage")
            return False
        
        blob.download_to_filename(local_path)
        logger.info(f"✅ Downloaded model: {model_filename}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error downloading model {model_filename}: {e}")
        return False

# --- Enhanced Multilingual Audio Processing ---
SUPPORTED_LANGUAGES = {
    'en': {'name': 'English', 'tts_code': 'en', 'whisper_code': 'en'},
    'hi': {'name': 'Hindi', 'tts_code': 'hi', 'whisper_code': 'hi'}, 
    'kn': {'name': 'Kannada', 'tts_code': 'kn', 'whisper_code': 'kn'}
}

def detect_language_from_text(text: str) -> str:
    """Detect language from text using keyword matching"""
    try:
        hindi_keywords = ['है', 'की', 'का', 'से', 'में', 'को', 'और', 'यह', 'वह', 'हम', 'आप', 'मैं', 'हूं', 'हूँ', 'नहीं', 'हां', 'जी', 'क्या', 'कैसे', 'कहां', 'कब', 'फसल', 'खेती', 'किसान']
        kannada_keywords = ['ಇದು', 'ಅದು', 'ನಾನು', 'ನೀವು', 'ಅವರು', 'ಮತ್ತು', 'ಆದರೆ', 'ಹೇಗೆ', 'ಎಲ್ಲಿ', 'ಎಂದು', 'ಅಲ್ಲ', 'ಹೌದು', 'ಏನು', 'ಯಾವಾಗ', 'ಬೆಳೆ', 'ಕೃಷಿ', 'ರೈತ']
        
        hindi_count = sum(1 for word in hindi_keywords if word in text)
        kannada_count = sum(1 for word in kannada_keywords if word in text)
        
        if hindi_count > kannada_count and hindi_count > 0:
            return 'hi'
        elif kannada_count > 0:
            return 'kn'
        else:
            return 'en'
        
    except Exception as e:
        logger.error(f"Error in language detection: {e}")
        return 'en'

def get_user_preferred_language(phone_number: str) -> str:
    """Get user's preferred language from session"""
    try:
        session = get_user_session(phone_number)
        
        if 'preferred_language' in session.context:
            lang = session.context['preferred_language']
            return lang
        
        recent_messages = session.chat_history[-3:]
        all_text = " ".join([msg['content'] for msg in recent_messages if msg['role'] == 'user'])
        
        if all_text:
            detected_lang = detect_language_from_text(all_text)
            session.context['preferred_language'] = detected_lang
            return detected_lang
        
        return 'en'
        
    except Exception as e:
        logger.error(f"Error getting user language: {e}")
        return 'en'

def set_user_language(phone_number: str, language_code: str):
    """Set user's preferred language"""
    try:
        if language_code in SUPPORTED_LANGUAGES:
            session = get_user_session(phone_number)
            session.context['preferred_language'] = language_code
            logger.info(f"✅ Set language for {phone_number} to {SUPPORTED_LANGUAGES[language_code]['name']}")
            return True
        else:
            logger.error(f"❌ Unsupported language code: {language_code}")
            return False
    except Exception as e:
        logger.error(f"Error setting user language: {e}")
        return False

def transcribe_with_whisper_multilingual(audio_file_path: str, expected_language: str = 'en') -> tuple:
    """Enhanced Whisper transcription with language detection"""
    try:
        if not WHISPER_AVAILABLE or whisper_model is None:
            return "Whisper not available", 'en'
        
        logger.info(f"🎤 Starting Whisper transcription...")
        
        result = whisper_model.transcribe(
            audio_file_path,
            language=None,
            task="transcribe",
            verbose=False
        )
        
        transcribed_text = result["text"].strip()
        detected_language = result.get("language", "en")
        
        language_mapping = {
            'en': 'en', 'hi': 'hi', 'kn': 'kn',
            'hindi': 'hi', 'kannada': 'kn', 'english': 'en'
        }
        
        detected_language = language_mapping.get(detected_language.lower(), 'en')
        
        if detected_language == 'en' and transcribed_text:
            text_detected = detect_language_from_text(transcribed_text)
            if text_detected != 'en':
                detected_language = text_detected
        
        logger.info(f"✅ Transcription: '{transcribed_text[:100]}', Language: {detected_language}")
        
        return transcribed_text if len(transcribed_text) > 0 else "No speech detected", detected_language
            
    except Exception as e:
        logger.error(f"❌ Whisper error: {e}")
        return f"Transcription failed: {str(e)}", 'en'

def text_to_speech_multilingual(text: str, language: str = "en") -> str:
    """Convert text to speech and upload to Cloud Storage"""
    try:
        if not TTS_AVAILABLE:
            logger.error("❌ TTS not available")
            return None
        
        lang_info = SUPPORTED_LANGUAGES.get(language, SUPPORTED_LANGUAGES['en'])
        tts_code = lang_info['tts_code']
        
        logger.info(f"🔊 Converting text to speech in {lang_info['name']}...")
        
        # Clean text for TTS
        clean_text = text.replace("*", "").replace("_", "").replace("#", "")
        emoji_list = ["📢", "🌱", "💡", "✅", "❌", "🎤", "📸", "🤖", "🔍", "🦠", "🌍", "🐛", "💰", "📊", "🏛️", "🌾", "🔧", "🏪"]
        for emoji in emoji_list:
            clean_text = clean_text.replace(emoji, "")
        
        clean_text = " ".join(clean_text.split())
        
        # Limit length based on language
        max_length = 500 if language == 'en' else 400 if language == 'hi' else 300
        if len(clean_text) > max_length:
            clean_text = clean_text[:max_length] + "..."
        
        # Create TTS
        try:
            tts = gTTS(text=clean_text, lang=tts_code, slow=False)
        except Exception:
            logger.warning(f"⚠️ TTS failed for {lang_info['name']}, falling back to English")
            tts = gTTS(text=clean_text, lang='en', slow=False)
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_file:
            tts.save(temp_file.name)
            
            # Read file data
            with open(temp_file.name, 'rb') as f:
                audio_data = f.read()
            
            # Upload to Cloud Storage
            timestamp = str(int(time.time()))
            filename = f"tts_{language}_{timestamp}.mp3"
            public_url = upload_to_cloud_storage(audio_data, filename, 'audio/mpeg')
            
            # Clean up temp file
            os.unlink(temp_file.name)
            
            if public_url:
                logger.info(f"✅ TTS audio uploaded: {filename}")
                return public_url
            else:
                logger.error("❌ Failed to upload TTS audio")
                return None
        
    except Exception as e:
        logger.error(f"❌ Error in multilingual TTS: {e}")
        return None

# --- Load Models ---
def load_crop_model():
    """Load crop recommendation model from Cloud Storage"""
    try:
        temp_model_path = "/tmp/RandomForest-2.pkl"
        
        # Try to download from Cloud Storage first
        if download_model_from_storage("RandomForest-2.pkl", temp_model_path):
            with open(temp_model_path, 'rb') as file:
                crop_model = pickle.load(file)
            logger.info("✅ Crop model loaded from Cloud Storage")
            return crop_model, True
        
        # Fallback to local file if exists
        local_model_path = "RandomForest-2.pkl"
        if os.path.exists(local_model_path):
            with open(local_model_path, 'rb') as file:
                crop_model = pickle.load(file)
            logger.info("✅ Crop model loaded from local file")
            return crop_model, True
        
        logger.warning("⚠️ Crop model not found")
        return None, False
        
    except Exception as e:
        logger.error(f"⚠️ Error loading crop model: {e}")
        return None, False

def load_disease_model():
    """Load disease model from Cloud Storage"""
    try:
        temp_model_path = "/tmp/plant_disease_prediction_model.h5"
        temp_class_path = "/tmp/class_indices.json"
        
        # Download model files
        model_downloaded = download_model_from_storage("plant_disease_prediction_model.h5", temp_model_path)
        class_downloaded = download_model_from_storage("class_indices.json", temp_class_path)
        
        if model_downloaded and class_downloaded:
            disease_model = tf.keras.models.load_model(temp_model_path)
            with open(temp_class_path) as f:
                class_indices = json.load(f)
            logger.info("✅ Disease model loaded from Cloud Storage")
            return disease_model, class_indices, True
        
        # Fallback to local files
        if os.path.exists("plant_disease_prediction_model.h5") and os.path.exists("class_indices.json"):
            disease_model = tf.keras.models.load_model("plant_disease_prediction_model.h5")
            with open("class_indices.json") as f:
                class_indices = json.load(f)
            logger.info("✅ Disease model loaded from local files")
            return disease_model, class_indices, True
        
        logger.warning("⚠️ Disease model not found")
        return None, {}, False
        
    except Exception as e:
        logger.error(f"⚠️ Error loading disease model: {e}")
        return None, {}, False

# Initialize models
crop_model, CROP_MODEL_LOADED = load_crop_model()
disease_model, class_indices, DISEASE_MODEL_LOADED = load_disease_model()

# Initialize LLM - using environment variable for API key
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    logger.error("❌ GOOGLE_API_KEY environment variable not set!")
    llm_gemini = None
else:
    llm_gemini = ChatGoogleGenerativeAI(
        model="gemini-2.5-pro", 
        temperature=0.3, 
        convert_system_message_to_human=True,
        google_api_key=GOOGLE_API_KEY
    )
    logger.info("✅ Gemini LLM initialized")

# Load Whisper model
whisper_model = None
if WHISPER_AVAILABLE:
    try:
        logger.info("Loading Whisper model...")
        whisper_model = whisper.load_model("base")
        logger.info("✅ Whisper model loaded successfully")
    except Exception as e:
        logger.error(f"⚠️ Error loading Whisper model: {e}")
        WHISPER_AVAILABLE = False

# --- User Session Management ---
class UserSession:
    def __init__(self, phone_number: str):
        self.phone_number = phone_number
        self.chat_history = []
        self.context = {}
        self.last_activity = datetime.utcnow()
    
    def add_message(self, role: str, content: str):
        self.chat_history.append({"role": role, "content": content})
        self.last_activity = datetime.utcnow()
        if len(self.chat_history) > 20:
            self.chat_history = self.chat_history[-20:]

def get_user_session(phone_number: str) -> UserSession:
    """Get or create user session"""
    if phone_number not in user_sessions:
        user_sessions[phone_number] = UserSession(phone_number)
    return user_sessions[phone_number]

# --- Media Processing Functions ---
def download_whatsapp_media(media_url: str, auth_token: str) -> bytes:
    """Download media from WhatsApp via Twilio"""
    try:
        response = requests.get(
            media_url,
            auth=(ACCOUNT_SID, auth_token),
            timeout=30
        )
        response.raise_for_status()
        return response.content
    except Exception as e:
        logger.error(f"Error downloading media: {e}")
        return None

def send_whatsapp_audio_message(from_number: str, audio_url: str, caption: str = ""):
    """Send audio file via WhatsApp using Cloud Storage URL"""
    try:
        if not TTS_AVAILABLE or not audio_url:
            send_whatsapp_message(from_number, caption)
            return
        
        whatsapp_from = TWILIO_WHATSAPP_NUMBER
        whatsapp_to = from_number
        
        if not whatsapp_to.startswith('whatsapp:'):
            if not whatsapp_to.startswith('+'):
                whatsapp_to = '+' + whatsapp_to
            whatsapp_to = 'whatsapp:' + whatsapp_to
        
        message = client.messages.create(
            from_=whatsapp_from,
            to=whatsapp_to,
            media_url=[audio_url],
            body=caption if caption else "🎤 Voice response"
        )
        
        logger.info(f"✅ Audio message sent successfully. SID: {message.sid}")
        
    except Exception as e:
        logger.error(f"❌ Error sending audio message: {e}")
        send_whatsapp_message(from_number, caption)

# --- Image Processing Functions ---
def load_and_preprocess_image(image_file, target_size=(224, 224)):
    """Preprocess image for ML model prediction"""
    img = Image.open(image_file).resize(target_size)
    img_array = np.array(img)
    if img_array.shape[2] == 4:
        img_array = img_array[:, :, :3]
    img_array = np.expand_dims(img_array, axis=0)
    img_array = img_array.astype('float32') / 255.
    return img_array

def predict_image_class(model, image_file, class_indices_map):
    """Predict class using ML model"""
    preprocessed_img = load_and_preprocess_image(image_file)
    predictions = model.predict(preprocessed_img)
    predicted_class_index = np.argmax(predictions, axis=1)[0]
    return class_indices_map[str(predicted_class_index)]

def analyze_image_with_ml_and_llm(image_data: bytes, user_message: str = "", analysis_type: str = "general") -> str:
    """Unified image analysis: ML model first, then LLM formatting"""
    try:
        logger.info("📸 Running unified ML + LLM image analysis...")
        
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
            temp_file.write(image_data)
            temp_path = temp_file.name

        ml_prediction = None
        if DISEASE_MODEL_LOADED:
            try:
                logger.info("🤖 Running ML disease detection...")
                ml_result = predict_image_class(disease_model, temp_path, class_indices)
                ml_prediction = ml_result.replace('___', ' ').replace('_', ' ')
                logger.info(f"ML Model predicted: {ml_prediction}")
            except Exception as e:
                logger.error(f"⚠️ ML model failed: {e}")
                ml_prediction = None
        
        if ml_prediction:
            if "healthy" in ml_prediction.lower():
                response = f"✅ *ML Detection: {ml_prediction}*\n\n🌱 Your plant looks healthy! Keep up the good care with regular watering and monitoring."
            else:
                format_prompt = ChatPromptTemplate.from_template(
                    """A plant disease detection model identified: **{ml_prediction}**
                    
                    User context: "{user_message}"
                    Analysis type: {analysis_type}
                    
                    Provide a WhatsApp-friendly response (max 250 words) with:
                    1. Brief disease confirmation
                    2. 3 key symptoms to look for
                    3. Immediate treatment steps (2-3 actions)
                    4. Prevention tip
                    
                    Use *bold* for emphasis, minimal emojis, keep practical for farmers.
                    Format for WhatsApp messaging."""
                )
                
                if llm_gemini:
                    format_chain = format_prompt | llm_gemini | StrOutputParser()
                    llm_analysis = format_chain.invoke({
                        "ml_prediction": ml_prediction,
                        "user_message": user_message,
                        "analysis_type": analysis_type
                    })
                    response = f"🤖 *ML Detection:* {ml_prediction}\n\n{llm_analysis}"
                else:
                    response = f"🤖 *ML Detection:* {ml_prediction}\n\nI detected this condition in your plant. Please consult with local agricultural experts for specific treatment recommendations."
        else:
            response = """🔍 *Image Analysis:*

I can see your plant image, but the disease detection model isn't available right now. 

*For best help:*
• Describe what symptoms you see
• Mention which part of plant is affected
• Ask specific questions about the issue

*Common issues to check:*
• Yellow/brown spots on leaves
• Wilting or drooping
• Unusual growth patterns
• Signs of pests"""
        
        try:
            os.unlink(temp_path)
        except:
            pass
        
        if len(response) > 1400:
            response = response[:1400] + "...\n\n💡 *Need more details?* Ask specific questions!"
        
        return response
        
    except Exception as e:
        logger.error(f"Error in unified image analysis: {e}")
        return "❌ Sorry, I couldn't analyze the image. Please try again or describe what you see."

# --- Audio Processing ---
def process_audio_message_multilingual(from_number: str, media_url: str, media_content_type: str, user_message: str = ""):
    """Enhanced multilingual audio processing"""
    try:
        logger.info(f"🎤 Processing multilingual audio from {from_number}")
        
        user_language = get_user_preferred_language(from_number)
        logger.info(f"👤 User preferred language: {SUPPORTED_LANGUAGES[user_language]['name']}")
        
        audio_data = download_whatsapp_media(media_url, AUTH_TOKEN)
        if not audio_data:
            return get_audio_error_message(user_language, "download_failed")
        
        audio_extension = "ogg"
        if "mp3" in media_content_type:
            audio_extension = "mp3"
        elif "m4a" in media_content_type:
            audio_extension = "m4a"
        elif "wav" in media_content_type:
            audio_extension = "wav"
        
        with tempfile.NamedTemporaryFile(suffix=f".{audio_extension}", delete=False) as temp_file:
            temp_file.write(audio_data)
            audio_file_path = temp_file.name
        
        transcribed_text, detected_language = None, user_language
        
        if WHISPER_AVAILABLE:
            transcribed_text, detected_language = transcribe_with_whisper_multilingual(
                audio_file_path, user_language
            )
            
            if (detected_language != user_language and 
                detected_language in SUPPORTED_LANGUAGES and
                len(transcribed_text) > 10):
                
                set_user_language(from_number, detected_language)
                user_language = detected_language
        
        try:
            os.unlink(audio_file_path)
        except:
            pass
        
        if (not transcribed_text or 
            len(transcribed_text.strip()) == 0 or 
            transcribed_text.startswith("Whisper") or
            transcribed_text.startswith("Transcription") or
            transcribed_text in ["No speech detected"]):
            
            return get_audio_error_message(user_language, "transcription_failed")
        
        if user_message and user_message.strip():
            text_language = detect_language_from_text(user_message)
            if text_language != detected_language:
                full_message = f"Voice message in {SUPPORTED_LANGUAGES[detected_language]['name']}: '{transcribed_text}'. Text message in {SUPPORTED_LANGUAGES[text_language]['name']}: {user_message}"
            else:
                full_message = f"Voice message: '{transcribed_text}'. Additional text: {user_message}"
        else:
            full_message = transcribed_text
        
        agent_response = process_message_with_agent(from_number, full_message)
        text_response = format_voice_response(transcribed_text, agent_response, user_language)
        
        if TTS_AVAILABLE and BASE_URL:
            try:
                audio_text = create_audio_response_text(transcribed_text, agent_response, user_language)
                audio_url = text_to_speech_multilingual(audio_text, user_language)
                
                if audio_url:
                    send_whatsapp_audio_message(from_number, audio_url, text_response)
                    return "audio_sent"
                else:
                    return text_response
                    
            except Exception as e:
                logger.error(f"❌ Error generating audio response: {e}")
                return text_response
        else:
            return text_response
        
    except Exception as e:
        logger.error(f"❌ Error in multilingual audio processing: {e}")
        user_lang = get_user_preferred_language(from_number)
        return get_audio_error_message(user_lang, "general_error")

def get_audio_error_message(language: str, error_type: str) -> str:
    """Get appropriate error message in user's language"""
    error_messages = {
        'download_failed': {
            'en': "❌ Couldn't download audio. Please try again.",
            'hi': "❌ ऑडियो डाउनलोड नहीं हो सका। कृपया पुनः प्रयास करें।",
            'kn': "❌ ಆಡಿಯೋ ಡೌನ್‌ಲೋಡ್ ಆಗಲಿಲ್ಲ। ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ।"
        },
        'transcription_failed': {
            'en': """🎤 *Audio Processing Failed*

Sorry, I couldn't understand your voice message. Please try:
• Speaking more clearly and slowly
• Recording in a quiet environment
• Getting closer to your phone
• Sending a text message instead

You can also try recording again!""",
            'hi': """🎤 *ऑडियो प्रोसेसिंग असफल*

माफ़ करें, मैं आपका वॉयस मैसेज नहीं समझ सका। कृपया कोशिश करें:
• अधिक स्पष्ट और धीरे बोलें
• शांत वातावरण में रिकॉर्ड करें
• फोन के करीब जाएं
• टेक्स्ट मैसेज भेजें

आप दोबारा रिकॉर्ड भी कर सकते हैं!""",
            'kn': """🎤 *ಆಡಿಯೋ ಪ್ರಕ್ರಿಯೆ ವಿಫಲವಾಗಿದೆ*

ಕ್ಷಮಿಸಿ, ನಿಮ್ಮ ಧ್ವನಿ ಸಂದೇಶವನ್ನು ನಾನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲಾಗಲಿಲ್ಲ। ದಯವಿಟ್ಟು ಪ್ರಯತ್ನಿಸಿ:
• ಹೆಚ್ಚು ಸ್ಪಷ್ಟವಾಗಿ ಮತ್ತು ನಿಧಾನವಾಗಿ ಮಾತನಾಡಿ
• ಶಾಂತ ವಾತಾವರಣದಲ್ಲಿ ರೆಕಾರ್ಡ್ ಮಾಡಿ
• ಫೋನ್‌ಗೆ ಹತ್ತಿರ ಬನ್ನಿ
• ಪಠ್ಯ ಸಂದೇಶ ಕಳುಹಿಸಿ

ನೀವು ಮತ್ತೆ ರೆಕಾರ್ಡ್ ಮಾಡಲೂ ಸಹ ಪ್ರಯತ್ನಿಸಬಹುದು!"""
        },
        'general_error': {
            'en': "❌ Audio processing error. Please try text instead.",
            'hi': "❌ ऑडियो प्रोसेसिंग त्रुटि। कृपया टेक्स्ट का उपयोग करें।",
            'kn': "❌ ಆಡಿಯೋ ಪ್ರಕ್ರಿಯೆಯ ದೋಷ। ದಯವಿಟ್ಟು ಪಠ್ಯವನ್ನು ಬಳಸಿ।"
        }
    }
    
    return error_messages.get(error_type, {}).get(language, error_messages.get(error_type, {}).get('en', "❌ Error occurred"))

def format_voice_response(transcribed_text: str, agent_response: str, language: str) -> str:
    """Format the voice response in appropriate language"""
    templates = {
        'en': """🎤 *Voice Message:*
"{transcribed_text}"

📢 *Response:*
{agent_response}""",
        'hi': """🎤 *वॉयस संदेश:*
"{transcribed_text}"

📢 *उत्तर:*
{agent_response}""",
        'kn': """🎤 *ಧ್ವನಿ ಸಂದೇಶ:*
"{transcribed_text}"

📢 *ಉತ್ತರ:*
{agent_response}"""
    }
    
    template = templates.get(language, templates['en'])
    return template.format(
        transcribed_text=transcribed_text,
        agent_response=agent_response
    )

def create_audio_response_text(question: str, answer: str, language: str) -> str:
    """Create audio response text in appropriate language"""
    templates = {
        'en': "You asked: {question}. Here's my response: {answer}",
        'hi': "आपने पूछा: {question}। यहाँ मेरा उत्तर है: {answer}",
        'kn': "ನೀವು ಕೇಳಿದ್ದು: {question}। ಇಲ್ಲಿ ನನ್ನ ಉತ್ತರ: {answer}"
    }
    
    template = templates.get(language, templates['en'])
    question_short = question[:100] + "..." if len(question) > 100 else question
    answer_short = answer[:300] + "..." if len(answer) > 300 else answer
    
    return template.format(question=question_short, answer=answer_short)

# --- Multilingual Welcome and Help Messages ---
def get_multilingual_welcome(language: str) -> str:
    """Get welcome message in user's language"""
    welcome_messages = {
        'en': """🌾 *Welcome to Agri-Connect!*

I help with:
🏪 *Campaigns* - Create & view
🌱 *Crop Planning* - Recommendations & plans
📊 *Data* - Orders, bids, contracts
🏛️ *Gov Schemes* - Find relevant schemes
📸 *Image Analysis* - Send crop/soil photos
🎤 *Voice Messages* - Speak in English, Hindi, or Kannada
🌐 *Languages* - Type 'language' to change

*How can I help you today?*""",

        'hi': """🌾 *एग्री-कनेक्ट में आपका स्वागत है!*

मैं इसमें मदद करता हूँ:
🏪 *अभियान* - बनाएं और देखें
🌱 *फसल योजना* - सुझाव और योजनाएं
📊 *डेटा* - ऑर्डर, बिड, अनुबंध
🏛️ *सरकारी योजनाएं* - संबंधित योजनाएं खोजें
📸 *इमेज विश्लेषण* - फसल/मिट्टी की तस्वीरें भेजें
🎤 *वॉयस संदेश* - अंग्रेजी, हिंदी या कन्नड़ में बोलें
🌐 *भाषाएं* - बदलने के लिए 'भाषा' टाइप करें

*आज मैं आपकी कैसे मदद कर सकता हूँ?*""",

        'kn': """🌾 *ಅಗ್ರಿ-ಕನೆಕ್ಟ್‌ಗೆ ಸ್ವಾಗತ!*

ನಾನು ಇದರಲ್ಲಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ:
🏪 *ಅಭಿಯಾನಗಳು* - ರಚಿಸಿ ಮತ್ತು ವೀಕ್ಷಿಸಿ
🌱 *ಬೆಳೆ ಯೋಜನೆ* - ಶಿಫಾರಸುಗಳು ಮತ್ತು ಯೋಜನೆಗಳು
📊 *ಡೇಟಾ* - ಆರ್ಡರ್‌ಗಳು, ಬಿಡ್‌ಗಳು, ಒಪ್ಪಂದಗಳು
🏛️ *ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು* - ಸಂಬಂಧಿತ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ
📸 *ಚಿತ್ರ ವಿಶ್ಲೇಷಣೆ* - ಬೆಳೆ/ಮಣ್ಣಿನ ಫೋಟೋಗಳನ್ನು ಕಳುಹಿಸಿ
🎤 *ಧ್ವನಿ ಸಂದೇಶಗಳು* - ಇಂಗ್ಲೀಷ್, ಹಿಂದಿ ಅಥವಾ ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ
🌐 *ಭಾಷೆಗಳು* - ಬದಲಾಯಿಸಲು 'ಭಾಷೆ' ಟೈಪ್ ಮಾಡಿ

*ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?*"""
    }
    
    return welcome_messages.get(language, welcome_messages['en'])

# --- Language Command Handling ---
def handle_language_commands(from_number: str, message: str) -> str:
    """Handle language-related commands"""
    message_lower = message.lower().strip()
    
    if (message_lower.startswith('language ') or 
        message_lower.startswith('भाषा ') or 
        message_lower.startswith('ಭಾಷೆ ')):
        
        parts = message.split()
        if len(parts) >= 2:
            lang_code = parts[1].lower()
            if lang_code in SUPPORTED_LANGUAGES:
                if set_user_language(from_number, lang_code):
                    lang_name = SUPPORTED_LANGUAGES[lang_code]['name']
                    confirmations = {
                        'en': f"✅ Language set to {lang_name}! How can I help you?",
                        'hi': f"✅ भाषा {lang_name} में सेट की गई! मैं आपकी कैसे मदद कर सकता हूँ?",
                        'kn': f"✅ ಭಾಷೆ {lang_name} ಗೆ ಹೊಂದಿಸಲಾಗಿದೆ! ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?"
                    }
                    return confirmations.get(lang_code, confirmations['en'])
                else:
                    return "❌ Error setting language. Please try again."
            else:
                return get_language_menu()
        else:
            return get_language_menu()
    
    if message_lower in ['language', 'languages', 'भाषा', 'ಭಾಷೆ']:
        return get_language_menu()
    
    return None

def get_language_menu() -> str:
    """Generate language selection menu"""
    return """🌐 *Choose Your Language:*

*EN* - English
*HI* - Hindi / हिंदी  
*KN* - Kannada / ಕನ್ನಡ

💬 *Example:* Send 'language hi' for Hindi
*उदाहरण:* हिंदी के लिए 'language hi' भेजें
*ಉದಾಹರಣೆ:* ಕನ್ನಡಕ್ಕಾಗಿ 'language kn' ಕಳುಹಿಸಿ"""

# --- Pydantic Models ---
class CampaignInput(BaseModel):
    title: str = Field(description="The main title or name of the campaign.")
    crop: str = Field(description="The specific crop being sold, e.g., 'Tomato', 'Wheat'.")
    cropType: str = Field(description="The variety or type of the crop, e.g., 'Heirloom', 'Basmati'.")
    location: str = Field(description="The city or district where the produce is located.")
    duration: str = Field(description="The duration for which the campaign will be active, e.g., '7 days', '2 weeks'.")
    estimatedYield: str = Field(description="The total estimated amount of produce available, e.g., '10 tons', '50 quintals'.")
    minimumQuotation: str = Field(description="The starting price or minimum bid, e.g., '₹1500 per quintal'.")
    notes: str = Field(description="Any additional notes or details about the produce or campaign.", default="")

class FetchFilter(BaseModel):
    field: str = Field(description="The name of the document field to filter on.")
    op: str = Field(description="The comparison operator, e.g., '==', '>', '<', '>=', '<=', 'in'.")
    value: Any = Field(description="The value to compare against.")

class CropPlannerInput(BaseModel):
    N: int = Field(description="Nitrogen (N) value in soil (kg/ha)")
    P: int = Field(description="Phosphorus (P) value in soil (kg/ha)")
    K: int = Field(description="Potassium (K) value in soil (kg/ha)")
    ph: float = Field(description="Soil pH value, from 0.0 to 14.0")
    area_in_acres: float = Field(description="Area of the land in acres")

class FinancialPlanInput(BaseModel):
    crop_name: str = Field(description="The specific name of the crop selected by the user.")
    area_in_acres: float = Field(description="The area of the land in acres, as provided by the user.")

class CropPlanOutput(BaseModel):
    estimated_yield: str = Field(description="Projected output for the given land area, in tons or quintals.")
    estimated_revenue: str = Field(description="Gross income expected based on local market prices, in INR.")
    investment_required: str = Field(description="Approximate cost for seeds, fertilizers, labor, etc., in INR.")
    roi_percent: float = Field(description="Return on Investment as a percentage.")
    summary: str = Field(description="A brief summary of the plan and justification for the recommended crop.")

class ImageAnalysisInput(BaseModel):
    analysis_type: str = Field(description="Type of analysis: 'disease', 'general', 'soil', 'pest'", default="general")
    additional_context: str = Field(description="Any additional context about the image", default="")

# --- Helper Functions ---
def predict_top_3_crops_with_rf(N, P, K, temp, humidity, ph, rainfall):
    """Uses the loaded RandomForest model to predict the top 3 most likely crops."""
    if not CROP_MODEL_LOADED:
        return None
    input_data = np.array([[N, P, K, temp, humidity, ph, rainfall]])
    probabilities = crop_model.predict_proba(input_data)[0]
    top_3_indices = np.argsort(probabilities)[-3:][::-1]
    top_3_crops = crop_model.classes_[top_3_indices]
    return top_3_crops

def get_weather_data(location="Bengaluru"):
    """Returns placeholder weather data."""
    return {"temperature": 27.5, "humidity": 75.0, "rainfall": 120.0}

# --- Agent Tools ---
@tool(args_schema=CampaignInput)
def create_campaign(title: str, crop: str, cropType: str, location: str, duration: str, estimatedYield: str, minimumQuotation: str, notes: str = "") -> str:
    """Creates a new campaign document in the 'campaigns' collection in Firestore."""
    if not db:
        return "❌ Error: Database is not initialized."
    try:
        data = {
            "title": title,
            "crop": crop,
            "cropType": cropType,
            "location": location,
            "duration": duration,
            "status": "active",
            "estimatedYield": estimatedYield,
            "minimumQuotation": minimumQuotation,
            "notes": notes,
            "currentBid": minimumQuotation,
            "totalBids": 0,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        doc_ref = db.collection("campaigns").add(data)
        return f"✅ Campaign '{title}' created successfully! ID: {doc_ref[1].id}"
    except Exception as e:
        return f"❌ Error creating campaign: {e}"

@tool
def fetch_documents_from_firestore(collection_name: str, filters: list[dict] = None, limit: int = None) -> list:
    """Fetches documents from a specified Firestore collection."""
    if not db: 
        return "❌ Error: Database is not initialized."
    try:
        query = db.collection(collection_name)
        if filters:
            for f in filters:
                validated_filter = FetchFilter(**f)
                query = query.where(field_path=validated_filter.field, op_string=validated_filter.op, value=validated_filter.value)
        
        if limit:
            query = query.limit(limit)

        docs = query.stream()
        results = [{"id": doc.id, **doc.to_dict()} for doc in docs]
        return results if results else f"📭 No documents found in '{collection_name}'."
    except Exception as e:
        return f"❌ Error fetching documents: {e}"

@tool(args_schema=CropPlannerInput)
def ai_crop_planner(N: int, P: int, K: int, ph: float, area_in_acres: float) -> str:
    """Recommends the top 3 suitable crops based on soil conditions."""
    if not CROP_MODEL_LOADED:
        return "❌ Error: Crop recommendation model is not available."

    weather = get_weather_data()
    recommended_crops = predict_top_3_crops_with_rf(N, P, K, weather['temperature'], weather['humidity'], ph, weather['rainfall'])
    
    if recommended_crops is None:
        return "❌ Error: Could not generate crop recommendations."

    return f"""🌱 *Top 3 Crop Recommendations:*

1. *{recommended_crops[0]}* 🥇
2. *{recommended_crops[1]}* 🥈  
3. *{recommended_crops[2]}* 🥉

💡 Which crop would you like a detailed financial plan for?"""

@tool(args_schema=FinancialPlanInput)
def generate_financial_plan(crop_name: str, area_in_acres: float) -> str:
    """Generates a detailed financial plan for a specific crop and land area."""
    if not llm_gemini:
        return "❌ Error: LLM service is not available."
    
    plan_parser = PydanticOutputParser(pydantic_object=CropPlanOutput)
    plan_prompt = ChatPromptTemplate.from_template(
        """You are an expert agricultural economist for Bengaluru, Karnataka, India.
        The farmer has chosen to cultivate **{crop_name}** on **{area} acres** of land.
        Generate a concise financial plan with realistic estimates for this region. Today is July 2025.
        {format_instructions}"""
    )
    plan_chain = plan_prompt | llm_gemini | plan_parser
    
    try:
        financial_plan = plan_chain.invoke({
            "crop_name": crop_name,
            "area": area_in_acres,
            "format_instructions": plan_parser.get_format_instructions()
        })

        return f"""📊 *Financial Plan for {crop_name}*

*Cultivation:* {crop_name} on {area_in_acres} acres

*💰 Financial Forecast:*
• *Revenue:* {financial_plan.estimated_revenue}
• *Investment:* {financial_plan.investment_required}
• *Yield:* {financial_plan.estimated_yield}
• *ROI:* {financial_plan.roi_percent:.1f}%

*📋 Summary:*
{financial_plan.summary}"""
    except Exception as e:
        logger.error(f"Error generating financial plan: {e}")
        return "❌ Error generating financial plan. Please try again later."

@tool
def government_schemes_analyzer(query: str) -> str:
    """Answers questions about Indian government schemes for farmers."""
    if not llm_gemini:
        return "❌ Error: LLM service is not available for scheme analysis."
    
    analysis_prompt = ChatPromptTemplate.from_template(
        """You are an expert on Indian government schemes for farmers.
        Answer the farmer's query with clear, concise information suitable for WhatsApp messaging.
        Keep responses under 300 words. Use simple formatting with asterisks for emphasis.
        
        Farmer's Query: "{query}"
        Answer:"""
    )
    
    try:
        analysis_chain = analysis_prompt | llm_gemini | StrOutputParser()
        answer = analysis_chain.invoke({"query": query})
        return f"🏛️ *Government Schemes Info:*\n\n{answer}"
    except Exception as e:
        logger.error(f"Error in government schemes analysis: {e}")
        return "❌ Error analyzing government schemes. Please try again later."

@tool(args_schema=ImageAnalysisInput)
def analyze_uploaded_image(analysis_type: str = "general", additional_context: str = "") -> str:
    """Analyzes the most recently uploaded image using ML model first, then LLM formatting."""
    try:
        if not current_image_data:
            return "❌ No image found. Please upload an image first and then ask for analysis."
        
        latest_key = max(current_image_data.keys())
        image_data = current_image_data[latest_key]
        
        logger.info(f"🤖 Agent analyzing image with type: {analysis_type}")
        
        result = analyze_image_with_ml_and_llm(image_data, additional_context, analysis_type)
        
        if analysis_type == "disease":
            emoji = "🦠"
            title = "Disease Analysis"
        elif analysis_type == "soil":
            emoji = "🌍"
            title = "Soil Analysis"
        elif analysis_type == "pest":
            emoji = "🐛"
            title = "Pest Analysis"
        else:
            emoji = "📸"
            title = "Image Analysis"
        
        agent_response = f"{emoji} *{title}:*\n\n{result}"
        
        if len(agent_response) > 1400:
            agent_response = agent_response[:1400] + "...\n\n💡 *Ask for specific details if needed!*"
        
        return agent_response
        
    except Exception as e:
        logger.error(f"Error in agent image analysis tool: {e}")
        return "❌ Sorry, I couldn't analyze the image. Please try uploading it again."

# --- Agent Setup ---
tools = [
    create_campaign,
    fetch_documents_from_firestore,
    ai_crop_planner,
    generate_financial_plan,
    government_schemes_analyzer,
    analyze_uploaded_image
]

agent_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are Agri-Connect Assistant, a helpful agricultural AI assistant for WhatsApp.

IMPORTANT FORMATTING RULES FOR WHATSAPP:
- Keep responses under 400 words
- Use simple formatting: *bold* for emphasis, no markdown
- Use emojis sparingly but effectively
- Be conversational and friendly

**Your Capabilities:**
- Campaign Management: Create and view farming campaigns
- Crop Planning: Soil-based recommendations and financial plans  
- Data Viewing: Orders, bids, contracts
- Government Schemes: Information about farmer schemes
- Image Analysis: Analyze crop photos for diseases, pests, soil conditions using ML models
- Voice Messages: Process audio messages and respond

**Image Analysis Process:**
When a user uploads an image, you can:
1. Use `analyze_uploaded_image` tool to analyze it with ML disease detection model
2. Choose analysis type: 'disease', 'soil', 'pest', or 'general'
3. Provide additional context if the user mentions specific concerns

Always be helpful, concise, and guide users step by step."""),
    MessagesPlaceholder(variable_name="chat_history"),
    ("user", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

def create_agent():
    """Create the agent"""
    if not llm_gemini:
        logger.error("❌ Cannot create agent: LLM not available")
        return None
    
    main_agent = create_openai_tools_agent(llm_gemini, tools, agent_prompt)
    return AgentExecutor(agent=main_agent, tools=tools, verbose=True)

agent_executor = create_agent()
if agent_executor:
    logger.info("✅ Agent initialized with all tools")
else:
    logger.error("❌ Failed to initialize agent")

# --- Message Processing ---
def process_message_with_agent(phone_number: str, message: str) -> str:
    """Process message using the agent and return response"""
    try:
        if not agent_executor:
            return "❌ Sorry, the AI service is temporarily unavailable. Please try again later."
        
        session = get_user_session(phone_number)
        session.add_message("user", message)
        
        chat_history = []
        for msg in session.chat_history[:-1]:
            if msg["role"] == "user":
                chat_history.append(HumanMessage(content=msg["content"]))
            else:
                chat_history.append(AIMessage(content=msg["content"]))
        
        result = agent_executor.invoke({
            "input": message,
            "chat_history": chat_history
        })
        
        response = result["output"]
        session.add_message("assistant", response)
        
        return response
        
    except Exception as e:
        logger.error(f"Error processing message: {e}")
        return "❌ Sorry, I encountered an error. Please try again or contact support."

def process_message_and_respond(from_number: str, message: str):
    """Enhanced message processing with multilingual support"""
    try:
        logger.info(f"💬 Processing text message from {from_number}: {message}")
        
        language_response = handle_language_commands(from_number, message)
        if language_response:
            send_whatsapp_message(from_number, language_response)
            return
        
        user_language = get_user_preferred_language(from_number)
        message_lower = message.lower().strip()
        
        if message_lower in ['/start', 'hi', 'hello', 'start', 'नमस्ते', 'हैलो', 'ನಮಸ್ಕಾರ', 'हाय']:
            response = get_multilingual_welcome(user_language)
        elif message_lower == '/clear':
            if from_number in user_sessions:
                del user_sessions[from_number]
            
            clear_messages = {
                'en': "🗑️ *Chat history cleared!* How can I help you today?",
                'hi': "🗑️ *चैट इतिहास साफ़ किया गया!* आज मैं आपकी कैसे मदद कर सकता हूँ?",
                'kn': "🗑️ *ಚಾಟ್ ಇತಿಹಾಸ ತೆರವುಗೊಳಿಸಲಾಗಿದೆ!* ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?"
            }
            response = clear_messages.get(user_language, clear_messages['en'])
        else:
            response = process_message_with_agent(from_number, message)
        
        send_whatsapp_message(from_number, response)
        
    except Exception as e:
        logger.error(f"Error in process_message_and_respond: {e}")
        error_messages = {
            'en': "❌ Sorry, I encountered an error. Please try again later.",
            'hi': "❌ माफ़ करें, मुझे एक त्रुटि का सामना करना पड़ा। कृपया बाद में पुनः प्रयास करें।",
            'kn': "❌ ಕ್ಷಮಿಸಿ, ನಾನು ದೋಷವನ್ನು ಎದುರಿಸಿದೆ। ದಯವಿಟ್ಟು ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ।"
        }
        user_lang = get_user_preferred_language(from_number)
        error_msg = error_messages.get(user_lang, error_messages['en'])
        send_whatsapp_message(from_number, error_msg)

def process_image_message(from_number: str, media_url: str, media_content_type: str, user_message: str = ""):
    """Process image message using unified ML + LLM analysis"""
    try:
        logger.info(f"📸 Processing image from {from_number}")
        
        image_data = download_whatsapp_media(media_url, AUTH_TOKEN)
        if not image_data:
            return "❌ Sorry, I couldn't download the image. Please try again."
        
        timestamp = str(int(time.time()))
        current_image_data[timestamp] = image_data
        
        analysis_type = "general"
        if user_message:
            message_lower = user_message.lower()
            if any(word in message_lower for word in ['disease', 'sick', 'problem', 'issue', 'spot', 'blight']):
                analysis_type = "disease"
            elif any(word in message_lower for word in ['soil', 'ground', 'earth']):
                analysis_type = "soil"
            elif any(word in message_lower for word in ['pest', 'bug', 'insect', 'damage']):
                analysis_type = "pest"
        
        analysis = analyze_image_with_ml_and_llm(image_data, user_message, analysis_type)
        response = f"{analysis}\n\n💡 *Need more help?* Ask specific questions!"
        
        return response
        
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        return "❌ Sorry, I encountered an error analyzing the image. Please try again."

def send_whatsapp_message(from_number: str, message: str):
    """Send WhatsApp message with proper formatting and error handling"""
    try:
        if not client:
            logger.error("❌ Twilio client not available")
            return
        
        whatsapp_from = TWILIO_WHATSAPP_NUMBER
        whatsapp_to = from_number
        
        if not whatsapp_to.startswith('whatsapp:'):
            if not whatsapp_to.startswith('+'):
                whatsapp_to = '+' + whatsapp_to
            whatsapp_to = 'whatsapp:' + whatsapp_to
        
        logger.info(f"📤 Sending to {whatsapp_to}")
        
        if len(message) > 1500:
            message = message[:1500] + "..."
            logger.warning("⚠️ Message truncated due to length")
        
        msg = client.messages.create(
            from_=whatsapp_from,
            to=whatsapp_to,
            body=message
        )
        
        logger.info(f"✅ Message sent successfully. SID: {msg.sid}")
        
    except Exception as e:
        logger.error(f"❌ Error sending WhatsApp message: {e}")

def process_image_and_respond(from_number: str, media_url: str, media_content_type: str, user_message: str):
    """Process image and send response via Twilio"""
    try:
        logger.info(f"📸 Processing image from {from_number}")
        
        image_data = download_whatsapp_media(media_url, AUTH_TOKEN)
        if not image_data:
            send_whatsapp_message(from_number, "❌ Sorry, I couldn't download the image. Please try again.")
            return
        
        timestamp = str(int(time.time()))
        current_image_data[timestamp] = image_data
        
        if user_message and user_message.strip():
            logger.info("📝 Image with text - using agent for processing")
            combined_message = f"I uploaded an image. {user_message}"
            response = process_message_with_agent(from_number, combined_message)
        else:
            logger.info("📸 Image only - using direct ML analysis")
            response = process_image_message(from_number, media_url, media_content_type, "")
        
        send_whatsapp_message(from_number, response)
        
    except Exception as e:
        logger.error(f"Error in process_image_and_respond: {e}")
        send_whatsapp_message(from_number, "❌ Sorry, I couldn't process your image. Please try again.")

def process_audio_and_respond(from_number: str, media_url: str, media_content_type: str, user_message: str):
    """Process audio with multilingual support and send response via Twilio"""
    try:
        logger.info(f"🎤 Processing multilingual audio from {from_number}")
        
        response = process_audio_message_multilingual(from_number, media_url, media_content_type, user_message)
        
        if response == "audio_sent":
            logger.info("✅ Audio response already sent")
            return
        
        send_whatsapp_message(from_number, response)
        
    except Exception as e:
        logger.error(f"Error in process_audio_and_respond: {e}")
        user_lang = get_user_preferred_language(from_number)
        error_msg = get_audio_error_message(user_lang, "general_error")
        send_whatsapp_message(from_number, error_msg)

# --- Flask Routes ---
@app.route("/webhook", methods=["POST"])
def whatsapp_webhook():
    """Handle incoming WhatsApp messages - Firebase Cloud Functions compatible"""
    try:
        incoming_msg = request.values.get("Body", "").strip()
        from_number = request.values.get("From", "")
        num_media = int(request.values.get("NumMedia", 0))
        
        logger.info(f"📲 Received webhook from {from_number}")
        logger.info(f"💬 Message: {incoming_msg}")
        logger.info(f"📎 Media files: {num_media}")
        
        if not from_number:
            logger.error("❌ Missing phone number")
            return str(MessagingResponse())
        
        # Handle media messages
        if num_media > 0:
            media_url = request.values.get("MediaUrl0", "")
            media_content_type = request.values.get("MediaContentType0", "")
            
            logger.info(f"📎 Media URL: {media_url}")
            logger.info(f"🔧 Media Type: {media_content_type}")
            
            # Handle images
            if media_content_type and media_content_type.startswith('image/'):
                logger.info("📸 Processing image...")
                # For Firebase, process synchronously to avoid cold starts
                process_image_and_respond(from_number, media_url, media_content_type, incoming_msg)
            
            # Handle audio
            elif media_content_type and media_content_type.startswith('audio/'):
                logger.info("🎤 Processing audio...")
                process_audio_and_respond(from_number, media_url, media_content_type, incoming_msg)
            
            else:
                logger.warning(f"❌ Unsupported media type: {media_content_type}")
                send_whatsapp_message(from_number, "📎 I can process images and audio messages. Please send photos of crops/soil or voice messages!")
        
        # Handle text messages
        elif incoming_msg:
            logger.info("💬 Processing text message...")
            process_message_and_respond(from_number, incoming_msg)
        
        else:
            logger.warning("❌ No message content received")
        
        return str(MessagingResponse())
        
    except Exception as e:
        logger.error(f"❌ Error in webhook: {e}")
        return str(MessagingResponse())

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint for Firebase"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": "firebase",
        "project_id": PROJECT_ID,
        "features": {
            "text_processing": True,
            "image_processing": True,
            "ml_disease_detection": DISEASE_MODEL_LOADED,
            "audio_processing": WHISPER_AVAILABLE,
            "crop_model_loaded": CROP_MODEL_LOADED,
            "database_connected": db is not None,
            "tts_available": TTS_AVAILABLE,
            "cloud_storage_available": storage_client is not None,
            "llm_available": llm_gemini is not None,
        },
        "system_info": {
            "active_sessions": len(user_sessions),
            "stored_images": len(current_image_data),
            "llm_model": "gemini-2.5-pro" if llm_gemini else None,
            "ml_disease_model": "plant_disease_prediction_model.h5" if DISEASE_MODEL_LOADED else None,
            "whisper_model": "base" if WHISPER_AVAILABLE else None,
            "storage_bucket": BUCKET_NAME if bucket else None
        },
        "tools_available": [
            "create_campaign",
            "fetch_documents_from_firestore", 
            "ai_crop_planner",
            "generate_financial_plan",
            "government_schemes_analyzer",
            "analyze_uploaded_image"
        ]
    })

@app.route("/", methods=["GET"])
def home():
    """Home page - Firebase compatible"""
    whisper_status = "✅ Available" if WHISPER_AVAILABLE else "❌ Not Available"
    crop_model_status = "✅ Loaded" if CROP_MODEL_LOADED else "❌ Not Available"
    disease_model_status = "✅ Loaded" if DISEASE_MODEL_LOADED else "❌ Not Available"
    db_status = "✅ Connected" if db else "❌ Not Connected"
    tts_status = "✅ Available" if TTS_AVAILABLE else "❌ Not Available"
    storage_status = "✅ Available" if storage_client else "❌ Not Available"
    llm_status = "✅ Available" if llm_gemini else "❌ Not Available"
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Agri-Connect WhatsApp Bot - Firebase</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }}
            .status-good {{ color: green; }}
            .status-bad {{ color: red; }}
            .feature-box {{ background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }}
            .command-box {{ background: #e8f4fd; padding: 10px; margin: 5px 0; border-radius: 3px; }}
            .firebase-box {{ background: #fff3e0; border: 1px solid #ffcc02; padding: 15px; margin: 10px 0; border-radius: 5px; }}
        </style>
    </head>
    <body>
        <h1>🌾 Agri-Connect WhatsApp Bot</h1>
        <div class="firebase-box">
            <h3>🔥 Firebase Deployment</h3>
            <p><strong>Project ID:</strong> {PROJECT_ID}</p>
            <p><strong>Environment:</strong> Google Cloud Functions</p>
            <p><strong>Status:</strong> <span class="status-good">Running & Ready</span></p>
        </div>
        
        <h2>✨ Features Available</h2>
        <div class="feature-box">
            <h3>📱 Multi-Modal Communication</h3>
            <ul>
                <li><strong>Text Messages:</strong> Full conversational AI support</li>
                <li><strong>Image Analysis:</strong> ML-powered crop disease detection</li>
                <li><strong>Voice Messages:</strong> Speech-to-text with audio responses</li>
                <li><strong>Multilingual:</strong> English, Hindi, Kannada</li>
            </ul>
        </div>
        
        <div class="feature-box">
            <h3>🌱 Agricultural Tools</h3>
            <ul>
                <li><strong>Campaign Management:</strong> Create and view farming campaigns</li>
                <li><strong>Crop Planning:</strong> AI-powered recommendations</li>
                <li><strong>Financial Planning:</strong> ROI calculations</li>
                <li><strong>Government Schemes:</strong> Information about farmer programs</li>
                <li><strong>Disease Detection:</strong> ML model for plant diseases</li>
            </ul>
        </div>
        
        <h2>🔧 System Status</h2>
        <ul>
            <li><strong>Firestore Database:</strong> {db_status}</li>
            <li><strong>Cloud Storage:</strong> {storage_status}</li>
            <li><strong>Gemini LLM:</strong> {llm_status}</li>
            <li><strong>Crop Model:</strong> {crop_model_status}</li>
            <li><strong>Disease Model:</strong> {disease_model_status}</li>
            <li><strong>Whisper Audio:</strong> {whisper_status}</li>
            <li><strong>Text-to-Speech:</strong> {tts_status}</li>
            <li><strong>Active Sessions:</strong> {len(user_sessions)}</li>
            <li><strong>Stored Images:</strong> {len(current_image_data)}</li>
        </ul>
        
        <h2>📋 API Endpoints</h2>
        <ul>
            <li><strong>Webhook:</strong> <code>/webhook</code> (POST)</li>
            <li><strong>Health Check:</strong> <code>/health</code> (GET)</li>
            <li><strong>Home:</strong> <code>/</code> (GET)</li>
        </ul>
        
        <h2>💬 How to Use</h2>
        <h3>Text Commands</h3>
        <div class="command-box"><strong>hi</strong> - Get welcome message</div>
        <div class="command-box"><strong>language hi/kn/en</strong> - Change language</div>
        <div class="command-box"><strong>create campaign</strong> - Start campaign creation</div>
        <div class="command-box"><strong>crop recommendations</strong> - Get crop suggestions</div>
        <div class="command-box"><strong>government schemes</strong> - Find relevant schemes</div>
        <div class="command-box"><strong>/clear</strong> - Clear chat history</div>
        
        <h3>Media Support</h3>
        <ul>
            <li><strong>Images:</strong> JPEG, PNG, WebP - for ML disease detection</li>
            <li><strong>Audio:</strong> OGG, MP3, M4A, WAV - for voice commands</li>
        </ul>
        
        <h2>🚀 Getting Started</h2>
        <ol>
            <li>Send "hi" to your configured WhatsApp number</li>
            <li>Start chatting, send images, or voice messages!</li>
            <li>Try different languages: English, Hindi, Kannada</li>
        </ol>
        
        <h2>🌐 Multilingual Support</h2>
        <ul>
            <li><strong>English:</strong> Default language</li>
            <li><strong>Hindi:</strong> हिंदी भाषा समर्थन</li>
            <li><strong>Kannada:</strong> ಕನ್ನಡ ಭಾಷಾ ಬೆಂಬಲ</li>
        </ul>
        
        <p><em>Last updated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC</em></p>
        <p><em>Deployed on Firebase Functions</em></p>
    </body>
    </html>
    """

# --- Firebase Cloud Functions Entry Point ---
# For Firebase Functions, we need to expose the Flask app
# Remove the if __name__ == "__main__" block and replace with:

def print_startup_info():
    """Print startup information for Firebase"""
    logger.info("=" * 60)
    logger.info("🌾 AGRI-CONNECT WHATSAPP BOT - FIREBASE")
    logger.info("=" * 60)
    logger.info(f"✅ Project ID: {PROJECT_ID}")
    logger.info(f"✅ Storage Bucket: {BUCKET_NAME}")
    logger.info(f"✅ Database: {'Connected' if db else 'Not Connected'}")
    logger.info(f"✅ Cloud Storage: {'Available' if storage_client else 'Not Available'}")
    logger.info(f"✅ Gemini LLM: {'Available' if llm_gemini else 'Not Available'}")
    logger.info(f"✅ Crop Model: {'Loaded' if CROP_MODEL_LOADED else 'Not Available'}")
    logger.info(f"✅ Disease Model: {'Loaded' if DISEASE_MODEL_LOADED else 'Not Available'}")
    logger.info(f"✅ Whisper Audio: {'Available' if WHISPER_AVAILABLE else 'Not Available'}")
    logger.info(f"✅ Text-to-Speech: {'Available' if TTS_AVAILABLE else 'Not Available'}")
    logger.info(f"✅ Agent Tools: {len(tools)} tools loaded")
    logger.info("=" * 60)
    logger.info("🌐 MULTILINGUAL SUPPORT:")
    for code, info in SUPPORTED_LANGUAGES.items():
        logger.info(f"   • {info['name']} ({code.upper()})")
    logger.info("=" * 60)
    logger.info("🚀 Bot ready for Firebase Functions deployment")
    logger.info("=" * 60)

# Initialize on module load
print_startup_info()

# Export the Flask app for Firebase Functions
# In your main.py for Firebase Functions, you would import this as:
# from your_bot_file import app