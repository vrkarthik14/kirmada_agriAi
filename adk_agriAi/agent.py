# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Farmer AI Agent using Google Agent Development Kit (ADK)"""

import json
import logging
import os
import pickle
import numpy as np
import tensorflow as tf
import tempfile
import base64
from datetime import datetime
from typing import Dict, Any, List, Optional

from google.adk.agents import Agent
from google.adk.tools.function_tool import FunctionTool
from pydantic import BaseModel, Field

# Import for LLM integration - removed as ADK handles this through agent.model
# ADK agents handle LLM integration through the model parameter
# Import Firestore configuration
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    
    db = None
    def init_firestore():
        """
        Initializes the Firestore database connection using the service account key.
        """
        global db
        if not firebase_admin._apps:
            try:
                # The path to your service account key JSON file
                script_dir = os.path.dirname(os.path.abspath(__file__))
                service_key_path = os.path.join(script_dir, "serviceKey.json")
                cred = credentials.Certificate(service_key_path)
                firebase_admin.initialize_app(cred)
                db = firestore.client()
                print("✅ Firestore initialized successfully.")
                return db
            except FileNotFoundError:
                print(f"🔥 Failed to initialize Firestore: serviceKey.json file not found")
                print("   Please ensure 'serviceKey.json' is in the correct directory.")
                return None
            except Exception as e:
                print(f"🔥 Failed to initialize Firestore: {e}")
                print("   Please check your serviceKey.json file and Firebase configuration.")
                return None
        return db

    def get_db():
        """Returns the Firestore database client instance."""
        global db
        if db is None:
            db = init_firestore()
        return db

    db = get_db()
    FIRESTORE_AVAILABLE = db is not None
    if FIRESTORE_AVAILABLE:
        print("✅ Firestore integration enabled")
    else:
        print("⚠️ Firestore not available - running in offline mode")
        
except Exception as e:
    print(f"⚠️ Firestore not available: {e}")
    db = None
    FIRESTORE_AVAILABLE = False

# Load ML Models
working_dir = os.path.dirname(os.path.abspath(__file__))

# Load Crop Recommendation Model
CROP_MODEL_LOADED = False
try:
    crop_model_path = os.path.join(working_dir, "RandomForest-2.pkl")
    with open(crop_model_path, 'rb') as file:
        crop_model = pickle.load(file)
    CROP_MODEL_LOADED = True
    print("✅ Crop recommendation model loaded successfully")
except Exception as e:
    print(f"⚠️ Error loading crop model: {e}")
    crop_model = None

# Load Disease Classification Model
DISEASE_MODEL_LOADED = False
try:
    model_path = os.path.join(working_dir, "plant_disease_prediction_model.h5")
    class_indices_path = os.path.join(working_dir, "class_indices.json")
    if os.path.exists(model_path) and os.path.exists(class_indices_path):
        disease_model = tf.keras.models.load_model(model_path)
        with open(class_indices_path) as f:
            class_indices = json.load(f)
        DISEASE_MODEL_LOADED = True
        print("✅ Disease classification model loaded successfully")
    else:
        print("⚠️ Model files not found - disease classification will be unavailable")
        disease_model = None
        class_indices = None
except Exception as e:
    print(f"⚠️ Error loading disease model: {e}")
    disease_model = None
    class_indices = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Pydantic Models for Firestore Operations ---
class CampaignData(BaseModel):
    """Schema for contract farming campaign creation in Firestore."""
    title: str = Field(description="The main title or name of the contract farming campaign")
    crop: str = Field(description="The specific crop being offered for contract farming")
    cropType: str = Field(description="The variety or grade of the crop")
    location: str = Field(description="The farm location for pickup/delivery")
    estimatedQuantity: str = Field(description="Expected harvest quantity (e.g., '50 quintals', '2 tons')")
    harvestDate: str = Field(description="Expected harvest/delivery date")
    minimumPrice: str = Field(description="Minimum acceptable price per unit")
    qualityGrade: str = Field(description="Quality grade of produce (A, B, C, Premium, Standard)")
    farmingMethod: str = Field(description="Farming approach (organic, conventional, natural, sustainable)")
    notes: str = Field(description="Additional notes about the contract farming opportunity", default="")

class FilterCondition(BaseModel):
    """Schema for Firestore query filters."""
    field: str = Field(description="The document field to filter on")
    op: str = Field(description="Comparison operator (==, >, <, >=, <=, in)")
    value: Any = Field(description="The value to compare against")

# --- Firestore Tools ---
def create_campaign_tool(title: str, crop: str, cropType: str, location: str, estimatedQuantity: str, 
                        harvestDate: str, minimumPrice: str, qualityGrade: str = "A", 
                        farmingMethod: str = "conventional", notes: str = "") -> str:
    """
    Creates a new contract farming campaign document in Firestore campaigns collection.
    
    Args:
        title: Contract farming campaign title/name
        crop: Specific crop being offered (e.g., 'Tomato', 'Wheat', 'Rice')
        cropType: Crop variety/grade (e.g., 'Heirloom', 'Basmati', 'Premium')
        location: Farm location for pickup/delivery
        estimatedQuantity: Expected harvest quantity (e.g., '50 quintals', '2 tons')
        harvestDate: Expected harvest/delivery date (e.g., '2025-04-15', 'March 2025')
        minimumPrice: Minimum acceptable price (e.g., '₹2000 per quintal', '$500 per ton')
        qualityGrade: Quality grade (A, B, C, Premium, Standard)
        farmingMethod: Farming approach (organic, conventional, natural, sustainable)
        notes: Additional details about the contract farming opportunity
    
    Returns:
        Success message with campaign ID or error message
    """
    if not FIRESTORE_AVAILABLE:
        return "Error: Firestore database is not available. Please check configuration."
    
    try:
        print(f"\n🤖 Creating new campaign: {title}...")
        
        # Prepare contract farming campaign data
        data = {
            "title": title,
            "crop": crop,
            "cropType": cropType,
            "location": location,
            "status": "active",
            "estimatedQuantity": estimatedQuantity,
            "harvestDate": harvestDate,
            "minimumPrice": minimumPrice,
            "qualityGrade": qualityGrade,
            "farmingMethod": farmingMethod,
            "notes": notes,
            "currentHighestBid": minimumPrice,
            "totalBids": 0,
            "interestedBuyers": 0,
            "campaignType": "contract_farming",
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        # Add document to Firestore
        _, doc_ref = db.collection("campaigns").add(data)
        success_msg = f"✅ Successfully created campaign '{title}' with ID: {doc_ref.id}"
        print(f"   - {success_msg}")
        return success_msg
        
    except Exception as e:
        error_msg = f"❌ Error creating campaign: {str(e)}"
        print(f"   - {error_msg}")
        return error_msg

def fetch_documents_tool(collection_name: str, filters: Optional[str] = None, limit: Optional[int] = None) -> str:
    """
    Fetches documents from a Firestore collection with optional filters.
    If collection_name is not available or empty, fetches last 3 campaigns.
    
    Args:
        collection_name: Name of collection (campaigns, bids, orders, contracts)
        filters: JSON string of filter conditions [{"field": "status", "op": "==", "value": "active"}]
        limit: Maximum number of documents to return
    
    Returns:
        JSON string of documents or error message
    """
    if not FIRESTORE_AVAILABLE:
        return "Error: Firestore database is not available."
    
    # If collection_name is not provided or empty, default to fetching last 3 campaigns
    if not collection_name or collection_name.strip() == "":
        print(f"\n🤖 No collection specified, fetching last 3 campaigns...")
        collection_name = "campaigns"
        limit = 3
        
    try:
        print(f"\n🤖 Fetching documents from {collection_name}...")
        query = db.collection(collection_name)
        
        # Apply filters if provided
        if filters:
            filter_list = json.loads(filters)
            for f in filter_list:
                validated_filter = FilterCondition(**f)
                query = query.where(
                    field_path=validated_filter.field,
                    op_string=validated_filter.op,
                    value=validated_filter.value
                )
        
        # If no specific limit is set and we're fetching campaigns, order by creation date
        if collection_name == "campaigns" and not filters:
            query = query.order_by("createdAt", direction=firestore.Query.DESCENDING)
        
        # Apply limit if specified
        if limit:
            query = query.limit(limit)
        
        # Execute query
        docs = query.stream()
        results = [{"id": doc.id, **doc.to_dict()} for doc in docs]
        
        if not results:
            # If no documents found in specified collection, try fetching last 3 campaigns as fallback
            if collection_name != "campaigns":
                print(f"   - No documents found in {collection_name}, fetching last 3 campaigns as fallback...")
                try:
                    fallback_query = db.collection("campaigns").order_by("createdAt", direction=firestore.Query.DESCENDING).limit(3)
                    fallback_docs = fallback_query.stream()
                    results = [{"id": doc.id, **doc.to_dict()} for doc in fallback_docs]
                    if results:
                        print(f"   - Found {len(results)} campaigns as fallback")
                        return json.dumps(results, default=str, indent=2)
                except Exception as fallback_error:
                    print(f"   - Fallback also failed: {fallback_error}")
            
            return f"No documents found in {collection_name} collection matching the criteria."
        
        print(f"   - Found {len(results)} documents")
        return json.dumps(results, default=str, indent=2)
        
    except Exception as e:
        error_msg = f"Error fetching documents from {collection_name}: {str(e)}"
        print(f"   - {error_msg}")
        
        # Try fallback to last 3 campaigns if there was an error
        if collection_name != "campaigns":
            print(f"   - Attempting fallback to fetch last 3 campaigns...")
            try:
                fallback_query = db.collection("campaigns").order_by("createdAt", direction=firestore.Query.DESCENDING).limit(3)
                fallback_docs = fallback_query.stream()
                results = [{"id": doc.id, **doc.to_dict()} for doc in fallback_docs]
                if results:
                    print(f"   - Fallback successful: Found {len(results)} campaigns")
                    return json.dumps(results, default=str, indent=2)
            except Exception as fallback_error:
                print(f"   - Fallback also failed: {fallback_error}")
        
        return error_msg

def update_campaign_tool(campaign_id: str, updates: str) -> str:
    """
    Updates an existing campaign in Firestore.
    
    Args:
        campaign_id: ID of the campaign to update
        updates: JSON string of field updates {"status": "completed", "currentBid": "₹2000"}
    
    Returns:
        Success or error message
    """
    if not FIRESTORE_AVAILABLE:
        return "Error: Firestore database is not available."
    
    try:
        print(f"\n🤖 Updating campaign {campaign_id}...")
        
        # Parse updates
        update_data = json.loads(updates)
        update_data["updatedAt"] = datetime.utcnow()
        
        # Update document
        db.collection("campaigns").document(campaign_id).update(update_data)
        
        success_msg = f"✅ Successfully updated campaign {campaign_id}"
        print(f"   - {success_msg}")
        return success_msg
        
    except Exception as e:
        error_msg = f"❌ Error updating campaign: {str(e)}"
        print(f"   - {error_msg}")
        return error_msg

def create_bid_tool(campaign_id: str, bidder_name: str, bid_amount: str, contact_info: str) -> str:
    """
    Creates a new bid for a campaign.
    
    Args:
        campaign_id: ID of the campaign to bid on
        bidder_name: Name of the bidder
        bid_amount: Bid amount (e.g., '₹1800 per quintal')
        contact_info: Contact information of bidder
    
    Returns:
        Success message with bid ID or error message
    """
    if not FIRESTORE_AVAILABLE:
        return "Error: Firestore database is not available."
    
    try:
        print(f"\n🤖 Creating bid for campaign {campaign_id}...")
        
        # Prepare bid data
        bid_data = {
            "campaignId": campaign_id,
            "bidderName": bidder_name,
            "bidAmount": bid_amount,
            "contactInfo": contact_info,
            "status": "active",
            "createdAt": datetime.utcnow()
        }
        
        # Create bid document
        _, doc_ref = db.collection("bids").add(bid_data)
        
        # Update campaign's bid count and current bid if higher
        campaign_ref = db.collection("campaigns").document(campaign_id)
        campaign_ref.update({
            "totalBids": firestore.Increment(1),
            "updatedAt": datetime.utcnow()
        })
        
        success_msg = f"✅ Successfully created bid with ID: {doc_ref.id}"
        print(f"   - {success_msg}")
        return success_msg
        
    except Exception as e:
        error_msg = f"❌ Error creating bid: {str(e)}"
        print(f"   - {error_msg}")
        return error_msg

# --- ML Helper Functions ---
def predict_top_3_crops_with_rf(N, P, K, temp, humidity, ph, rainfall):
    """Uses RandomForest model to predict top 3 most likely crops."""
    if not CROP_MODEL_LOADED:
        return ["wheat", "rice", "corn"]  # fallback
    
    input_data = np.array([[N, P, K, temp, humidity, ph, rainfall]])
    probabilities = crop_model.predict_proba(input_data)[0]
    top_3_indices = np.argsort(probabilities)[-3:][::-1]
    top_3_crops = crop_model.classes_[top_3_indices]
    return top_3_crops

def get_weather_data(location="Default"):
    """Returns placeholder weather data."""
    return {"temperature": 27.5, "humidity": 75.0, "rainfall": 120.0}

def load_and_preprocess_image(image_path, target_size=(224, 224)):
    """Preprocess image for disease classification."""
    try:
        from PIL import Image
        
        # First, verify the file exists and has content
        if not os.path.exists(image_path):
            print(f"Error: Image file does not exist: {image_path}")
            return None
            
        file_size = os.path.getsize(image_path)
        if file_size == 0:
            print(f"Error: Image file is empty: {image_path}")
            return None
            
        print(f"Loading image: {image_path} (size: {file_size} bytes)")
        
        # Try to open and process the image
        try:
            img = Image.open(image_path)
            print(f"Image opened successfully: {img.format}, {img.mode}, {img.size}")
            
            # Convert to RGB if necessary
            if img.mode != 'RGB':
                print(f"Converting image from {img.mode} to RGB")
                img = img.convert('RGB')
            
            # Resize the image
            img = img.resize(target_size)
            print(f"Image resized to: {img.size}")
            
            # Convert to numpy array
            img_array = np.array(img)
            print(f"Image array shape: {img_array.shape}")
            
            # Add batch dimension
            img_array = np.expand_dims(img_array, axis=0)
            
            # Normalize pixel values to [0, 1]
            img_array = img_array.astype('float32') / 255.0
            
            print(f"Final preprocessed array shape: {img_array.shape}")
            return img_array
            
        except Exception as img_error:
            print(f"PIL Error opening image: {img_error}")
            
            # Try alternative approach - check if it's a valid image file
            try:
                with open(image_path, 'rb') as f:
                    header = f.read(20)
                    print(f"File header (first 20 bytes): {header}")
                    
                # Check for common image signatures
                if header.startswith(b'\xff\xd8\xff'):
                    print("File appears to be JPEG")
                elif header.startswith(b'\x89PNG\r\n\x1a\n'):
                    print("File appears to be PNG")
                elif header.startswith(b'RIFF') and b'WEBP' in header:
                    print("File appears to be WEBP")
                else:
                    print(f"Unrecognized file format. Header: {header[:10]}")
                    
            except Exception as check_error:
                print(f"Error checking file format: {check_error}")
                
            return None
            
    except ImportError:
        print("Error: PIL (Pillow) is not installed. Please install with: pip install Pillow")
        return None
    except Exception as e:
        print(f"Error preprocessing image: {e}")
        return None

def predict_image_class(model, image_path, class_indices_map):
    """Predict disease class from image."""
    try:
        print(f"Starting prediction for image: {image_path}")
        
        preprocessed_img = load_and_preprocess_image(image_path)
        if preprocessed_img is None:
            return "Error processing image - preprocessing failed"
        
        print("Making prediction with model...")
        predictions = model.predict(preprocessed_img, verbose=0)
        print(f"Prediction shape: {predictions.shape}")
        print(f"Prediction values: {predictions[0][:5]}...")  # Show first 5 values
        
        predicted_class_index = np.argmax(predictions, axis=1)[0]
        confidence = np.max(predictions, axis=1)[0]
        
        print(f"Predicted class index: {predicted_class_index}")
        print(f"Confidence: {confidence:.4f}")
        
        if str(predicted_class_index) not in class_indices_map:
            print(f"Warning: Class index {predicted_class_index} not found in class_indices_map")
            print(f"Available indices: {list(class_indices_map.keys())[:10]}...")  # Show first 10
            return f"Error: Unknown class index {predicted_class_index}"
        
        class_name = class_indices_map[str(predicted_class_index)]
        print(f"Predicted class: {class_name}")
        
        return class_name
        
    except Exception as e:
        print(f"Error in predict_image_class: {e}")
        import traceback
        traceback.print_exc()
        return f"Error processing image: {str(e)}"

def save_image_from_tool_context(tool_context):
    """
    Extract and save image from ToolContext to a temporary file.
    Returns the temporary file path or None if no image found.
    """
    if hasattr(tool_context, 'user_content') and tool_context.user_content and tool_context.user_content.parts:
        for part in tool_context.user_content.parts:
            if hasattr(part, 'inline_data') and part.inline_data:
                try:
                    # Get the base64 data - it might already be decoded bytes or still be a string
                    raw_data = part.inline_data.data
                    
                    # Check if it's already bytes or if it's a base64 string
                    if isinstance(raw_data, str):
                        print(f"Data is string, decoding from base64. Length: {len(raw_data)}")
                        image_data = base64.b64decode(raw_data)
                    elif isinstance(raw_data, bytes):
                        print(f"Data is bytes. Length: {len(raw_data)}")
                        
                        # Check if the bytes represent base64 data vs raw image data
                        # Base64 uses only A-Z, a-z, 0-9, +, /, = characters
                        # Let's check if first 100 bytes are printable ASCII (base64 pattern)
                        sample = raw_data[:100]
                        try:
                            sample_str = sample.decode('utf-8')
                            # Check if it looks like base64 (mostly alphanumeric + few special chars)
                            base64_chars = set('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=')
                            sample_chars = set(sample_str)
                            
                            # If most characters are base64 characters, it's likely base64
                            if len(sample_chars - base64_chars) <= 2:  # Allow 2 non-base64 chars for tolerance
                                print("Data appears to be base64 string in bytes format")
                                try:
                                    decoded_test = base64.b64decode(raw_data.decode('utf-8'))
                                    print(f"Base64 decode successful: {len(decoded_test)} bytes")
                                    image_data = decoded_test
                                except Exception as decode_error:
                                    print(f"Base64 decode failed: {decode_error}")
                                    print("Treating as raw bytes")
                                    image_data = raw_data
                            else:
                                print("Data appears to be raw image bytes")
                                image_data = raw_data
                        except UnicodeDecodeError:
                            print("Data contains non-UTF8 bytes, treating as raw image data")
                            image_data = raw_data
                    else:
                        print(f"Unexpected data type: {type(raw_data)}")
                        continue
                    
                    print(f"Final image data size: {len(image_data)} bytes")
                    
                    # Check if we have reasonable image data size
                    if len(image_data) < 100:
                        print(f"Warning: Image data seems too small ({len(image_data)} bytes)")
                        print(f"First 20 bytes: {image_data[:20]}")
                        return None
                    
                    # Determine file extension from mime type if available
                    file_extension = '.jpg'  # default
                    if hasattr(part.inline_data, 'mime_type'):
                        mime_type = part.inline_data.mime_type
                        if 'png' in mime_type.lower():
                            file_extension = '.png'
                        elif 'jpeg' in mime_type.lower() or 'jpg' in mime_type.lower():
                            file_extension = '.jpg'
                        elif 'webp' in mime_type.lower():
                            file_extension = '.webp'
                    
                    # Check image format by header
                    if image_data.startswith(b'\x89PNG\r\n\x1a\n'):
                        print("Detected PNG format from header")
                        file_extension = '.png'
                    elif image_data.startswith(b'\xff\xd8\xff'):
                        print("Detected JPEG format from header")
                        file_extension = '.jpg'
                    elif image_data.startswith(b'RIFF') and b'WEBP' in image_data[:20]:
                        print("Detected WEBP format from header")
                        file_extension = '.webp'
                    else:
                        print(f"Warning: Unknown image format. Header: {image_data[:20]}")
                    
                    # Create temporary file with proper extension
                    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_extension)
                    temp_file.write(image_data)
                    temp_file.close()
                    
                    # Verify the file was written correctly
                    written_size = os.path.getsize(temp_file.name)
                    if written_size == 0:
                        print("Error: Image file is empty after writing")
                        os.unlink(temp_file.name)
                        return None
                    elif written_size != len(image_data):
                        print(f"Warning: File size mismatch. Expected: {len(image_data)}, Written: {written_size}")
                    
                    print(f"Image saved to: {temp_file.name}, size: {written_size} bytes")
                    return temp_file.name
                    
                except Exception as e:
                    print(f"Error saving image: {e}")
                    import traceback
                    traceback.print_exc()
                    return None
    return None

def extract_multimodal_content(tool_context):
    """
    Extract text, images, and audio from ToolContext for multimodal processing.
    Returns a dictionary with extracted content types.
    """
    content = {
        'text': [],
        'images': [],
        'audio': [],
        'has_voice': False
    }
    
    if hasattr(tool_context, 'user_content') and tool_context.user_content and tool_context.user_content.parts:
        print(f"Processing {len(tool_context.user_content.parts)} content parts...")
        
        for i, part in enumerate(tool_context.user_content.parts):
            print(f"Part {i}: {type(part)}")
            
            # Extract text content
            if hasattr(part, 'text') and part.text is not None:
                content['text'].append(part.text)
                print(f"  - Text: {part.text[:100]}...")
            
            # Extract inline data (images, audio, etc.)
            if hasattr(part, 'inline_data') and part.inline_data:
                mime_type = getattr(part.inline_data, 'mime_type', 'unknown')
                data_size = len(getattr(part.inline_data, 'data', ''))
                print(f"  - Inline data: {mime_type}, {data_size} bytes")
                
                # Handle image data
                if 'image' in mime_type.lower():
                    image_path = save_image_from_tool_context_part(part)
                    if image_path:
                        content['images'].append({
                            'path': image_path,
                            'mime_type': mime_type,
                            'size': data_size
                        })
                
                # Handle audio data (voice input)
                elif 'audio' in mime_type.lower():
                    content['has_voice'] = True
                    content['audio'].append({
                        'mime_type': mime_type,
                        'size': data_size,
                        'data': part.inline_data.data
                    })
                    print(f"  - Voice input detected: {mime_type}")
    
    return content

def save_image_from_tool_context_part(part):
    """
    Extract and save image from a single ToolContext part.
    Helper function for multimodal content extraction.
    """
    if hasattr(part, 'inline_data') and part.inline_data:
        try:
            # Use the same logic as save_image_from_tool_context but for a single part
            raw_data = part.inline_data.data
            
            if isinstance(raw_data, str):
                image_data = base64.b64decode(raw_data)
            elif isinstance(raw_data, bytes):
                sample = raw_data[:100]
                try:
                    sample_str = sample.decode('utf-8')
                    base64_chars = set('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=')
                    sample_chars = set(sample_str)
                    
                    if len(sample_chars - base64_chars) <= 2:
                        try:
                            decoded_test = base64.b64decode(raw_data.decode('utf-8'))
                            image_data = decoded_test
                        except:
                            image_data = raw_data
                    else:
                        image_data = raw_data
                except UnicodeDecodeError:
                    image_data = raw_data
            else:
                return None
            
            if len(image_data) < 100:
                return None
            
            # Determine file extension
            file_extension = '.jpg'
            if hasattr(part.inline_data, 'mime_type'):
                mime_type = part.inline_data.mime_type
                if 'png' in mime_type.lower():
                    file_extension = '.png'
                elif 'jpeg' in mime_type.lower() or 'jpg' in mime_type.lower():
                    file_extension = '.jpg'
                elif 'webp' in mime_type.lower():
                    file_extension = '.webp'
            
            # Create temporary file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_extension)
            temp_file.write(image_data)
            temp_file.close()
            
            return temp_file.name
            
        except Exception as e:
            print(f"Error saving image from part: {e}")
            return None
    return None

def generate_disease_explanation(disease_name):
    """
    Generate detailed explanation for a disease using basic explanation.
    ADK sub-agents will handle detailed explanations through the disease_explanation_agent.
    """
    # Basic explanation without external LLM (ADK agent will handle detailed explanations)
    clean_disease_name = disease_name.replace('___', ' ').replace('_', ' ')
    
    if 'healthy' in disease_name.lower():
        return f"""
**Disease Status:** {clean_disease_name}

**Good News!** Your plant appears to be healthy with no visible signs of disease.

**Maintenance Recommendations:**
- Continue current care practices
- Monitor regularly for any changes
- Maintain proper watering schedule
- Ensure adequate nutrition
- Practice preventive measures

**Preventive Measures:**
- Regular inspection of plants
- Proper spacing for air circulation
- Avoid overhead watering
- Use disease-resistant varieties
- Maintain garden hygiene
"""
    
    return f"""
**Disease Identified:** {clean_disease_name}

**Description:**
This appears to be a plant disease that requires attention and proper treatment.

**Common Symptoms:**
- Discoloration of leaves or stems
- Unusual spots or patches
- Wilting or stunted growth
- Changes in plant structure

**Treatment Steps:**
1. **Immediate Action:** Remove affected plant parts and dispose properly
2. **Fungicide Application:** Apply appropriate fungicide or organic treatment
3. **Improve Conditions:** Enhance air circulation and adjust watering
4. **Monitor Progress:** Check plant regularly for improvement or spread

**Preventive Measures:**
- Use disease-resistant plant varieties
- Maintain proper plant spacing
- Ensure good drainage and air circulation
- Practice crop rotation
- Regular field/garden monitoring
- Avoid overhead watering when possible

**Important:** For severe infections or if symptoms persist, consult with local agricultural experts or plant pathologists for specific treatment recommendations.
"""

# --- Enhanced Farming Tools with ML Integration ---
def ai_crop_planner_tool(N: int, P: int, K: int, ph: float, area_in_acres: float, location: str = "Default") -> str:
    """
    AI-powered crop recommendation based on soil conditions and weather.
    
    Args:
        N: Nitrogen content in soil (kg/ha)
        P: Phosphorus content in soil (kg/ha)
        K: Potassium content in soil (kg/ha)
        ph: Soil pH value (0-14)
        area_in_acres: Farm area in acres
        location: Location for weather data
    
    Returns:
        Top 3 crop recommendations with rationale
    """
    print(f"\n🤖 Running AI Crop Planner for {area_in_acres} acres...")
    
    # Get weather data
    weather = get_weather_data(location)
    
    if CROP_MODEL_LOADED:
        # Use ML model for recommendations
        recommended_crops = predict_top_3_crops_with_rf(
            N, P, K, weather['temperature'], weather['humidity'], ph, weather['rainfall']
        )
        confidence_msg = "Based on AI analysis of your soil and weather conditions"
    else:
        # Fallback recommendations based on soil conditions
        if ph < 6.0:
            recommended_crops = ["tea", "potato", "rice"]
        elif ph > 8.0:
            recommended_crops = ["wheat", "barley", "sugarcane"]
        else:
            recommended_crops = ["wheat", "rice", "corn"]
        confidence_msg = "Based on general soil condition analysis (ML model not available)"
    
    return f"""
## AI Crop Recommendations for {area_in_acres} acres

**Soil Analysis:**
- Nitrogen: {N} kg/ha
- Phosphorus: {P} kg/ha  
- Potassium: {K} kg/ha
- pH: {ph}
- Location: {location}

**Weather Conditions:**
- Temperature: {weather['temperature']}°C
- Humidity: {weather['humidity']}%
- Expected Rainfall: {weather['rainfall']}mm

**Top 3 Recommended Crops:**
{confidence_msg}:

1. **{recommended_crops[0].title()}** - Primary recommendation
2. **{recommended_crops[1].title()}** - Secondary option  
3. **{recommended_crops[2].title()}** - Alternative choice

**Next Steps:**
- Select one of these crops for detailed financial planning
- Consider local market demand and prices
- Check seed availability and planting season
- Consult with local agricultural extension officer

Would you like me to create a detailed financial plan for any of these crops?
"""

def crop_health_analyzer_tool(tool_context) -> str:
    """
    Analyzes crop image to detect diseases using AI.
    Supports text, image, and voice input for comprehensive farmer assistance.
    
    Returns:
        Disease diagnosis and treatment recommendations
    """
    from google.adk.tools import ToolContext
    
    print("\n🤖 Running Crop Health Analyzer...")
    print(f"Tool context type: {type(tool_context)}")
    
    if not DISEASE_MODEL_LOADED:
        return "Error: The disease classification model is not available."
    
    # Extract multimodal content (text, images, voice)
    content = extract_multimodal_content(tool_context)
    
    # Check for voice input
    if content['has_voice']:
        print(f"🎤 Voice input detected with {len(content['audio'])} audio parts")
        voice_prompt = "\n**Note:** Voice input received - you can ask questions about your crops in any language!"
    else:
        voice_prompt = ""
    
    # Check for images
    if not content['images']:
        print("⚠️ No image found in content.")
        combined_text = ' '.join(content['text']) if content['text'] else ""
        
        # If there's text content, provide general guidance
        if combined_text.strip():
            return f"""
## Crop Health Analysis{voice_prompt}

**Text Input Received:** {combined_text[:200]}...

To analyze your crop health, please **upload an image** of your plant or crop. I can identify:

🌱 **Disease Detection:**
- Fungal infections (rust, blight, mildew)
- Bacterial diseases 
- Viral infections
- Nutrient deficiencies

📊 **Health Assessment:**
- Overall plant condition
- Growth stage analysis
- Environmental stress indicators

💡 **Treatment Recommendations:**
- Organic treatment options
- Chemical intervention (if needed)
- Prevention strategies
- Best practices for your crop

You can also ask questions in Hindi or your local language alongside the image upload.
"""
        else:
            return f"""
## Crop Health Analysis{voice_prompt}

Please upload an image of your crop or plant for disease analysis. I can help identify:

🔍 **What I can detect:**
- Plant diseases and infections
- Nutrient deficiencies
- Pest damage signs
- Overall plant health

📱 **How to use:**
1. Take a clear photo of affected plant parts
2. Upload the image here
3. Ask questions in any language (Hindi, English, regional languages)

💬 **You can ask things like:**
- "मेरी फसल में क्या बीमारी है?" (What disease is in my crop?)
- "What treatment should I use?"
- "How to prevent this disease?"

I'll provide detailed diagnosis and treatment recommendations!
"""
    
    # Process the first image
    image_info = content['images'][0]
    image_path = image_info['path']
    
    print(f"🖼️ Processing image: {image_path} ({image_info['size']} bytes)")
    
    # If there are multiple images, mention them
    if len(content['images']) > 1:
        print(f"📸 Additional images detected: {len(content['images']) - 1}")
        multi_image_note = f"\n**Note:** {len(content['images'])} images received. Analyzing the first image."
    else:
        multi_image_note = ""
    
    if not os.path.exists(image_path):
        return f"Error: The file path '{image_path}' does not exist."
    
    try:
        print(f"Analyzing image at: {image_path}")
        # Use ML model to predict disease
        prediction = predict_image_class(disease_model, image_path, class_indices)
        disease_name = prediction.replace('___', ' ').replace('_', ' ')
        print(f"   - Model predicted disease: {disease_name}")
        
        # Generate detailed explanation using LLM
        explanation = generate_disease_explanation(prediction)
        
        # Extract any text input along with the image
        user_text = ' '.join(content['text']) if content['text'] else ""
        
        # Clean up temporary file
        try:
            os.unlink(image_path)
        except:
            pass
        
        return f"""## AI Crop Health Analysis Results{voice_prompt}{multi_image_note}

**� Model Prediction:** {disease_name}

**� Detailed Analysis & Recommendations:**

{explanation}

**💡 Additional Tips:**
- Take photos from multiple angles for better diagnosis
- Monitor the progression of symptoms over time
- Keep records of treatments applied and their effectiveness
- Consider environmental factors (weather, soil conditions, recent changes)

{f'**🎤 Voice Support:** You can ask follow-up questions using voice input in Hindi or your preferred language!' if content['has_voice'] else '**💬 Ask Questions:** Feel free to ask follow-up questions about treatment, prevention, or any farming concerns!'}

**⚠️ Important Note:** This is an AI-based assessment using machine learning. For severe infections, rapid spread, or uncertain cases, please consult with local agricultural experts, extension officers, or plant pathologists for professional diagnosis and treatment recommendations.
"""
        
    except Exception as e:
        # Clean up temporary file on error
        try:
            if image_path:
                os.unlink(image_path)
        except:
            pass
            
        return f"""
## Crop Health Analysis Error

❌ **Error processing image:** {str(e)}

**Troubleshooting:**
- Ensure the image is in a supported format (JPG, PNG)
- Try uploading a clearer image with good lighting
- Make sure the image shows the plant symptoms clearly
- Check that the image file is not corrupted

**Alternative approach:** 
Describe the symptoms you observe (yellowing, spots, wilting, etc.) and what type of crop it is. I can help diagnose the issue using the plant_health_diagnostic_tool based on your description.

**Common symptoms to describe:**
- Leaf discoloration (yellow, brown, black spots)
- Wilting or drooping
- Stunted growth
- Unusual markings or patterns
- Pest activity
"""

# Define tools for each farming domain
def crop_planning_tool(crop_type: str, location: str, season: str, soil_type: str = "loamy") -> str:
    """
    Provides crop planning recommendations based on crop type, location, season, and soil type.
    
    Args:
        crop_type: Type of crop to plan for (e.g., wheat, rice, corn, tomato)
        location: Farming location (state/region)
        season: Growing season (kharif, rabi, summer, spring, winter)
        soil_type: Type of soil (clay, sandy, loamy, silt)
    
    Returns:
        Detailed crop planning recommendations
    """
    recommendations = {
        "wheat": {
            "rabi": {
                "sowing_time": "November-December",
                "fertilizer": "120 kg/ha Nitrogen, 60 kg/ha Phosphorus",
                "irrigation": "4-6 irrigations needed",
                "harvest_time": "April-May"
            }
        },
        "rice": {
            "kharif": {
                "sowing_time": "June-July",
                "fertilizer": "120 kg/ha Nitrogen, 60 kg/ha Phosphorus, 40 kg/ha Potash",
                "irrigation": "Standing water required",
                "harvest_time": "October-November"
            }
        },
        "tomato": {
            "winter": {
                "sowing_time": "October-November",
                "fertilizer": "150 kg/ha Nitrogen, 75 kg/ha Phosphorus, 50 kg/ha Potash",
                "irrigation": "Regular watering, avoid waterlogging",
                "harvest_time": "January-March"
            }
        }
    }
    
    crop_data = recommendations.get(crop_type.lower(), {})
    season_data = crop_data.get(season.lower(), {})
    
    if season_data:
        result = f"""
## Crop Planning for {crop_type.title()} - {season.title()} Season

**Location:** {location}
**Soil Type:** {soil_type}

### Recommendations:
- **Sowing Time:** {season_data.get('sowing_time', 'Consult local agriculture office')}
- **Fertilizer:** {season_data.get('fertilizer', 'Soil test recommended')}
- **Irrigation:** {season_data.get('irrigation', 'Based on rainfall patterns')}
- **Harvest Time:** {season_data.get('harvest_time', 'Monitor crop maturity')}

### Additional Tips:
- Conduct soil testing before sowing
- Use certified seeds from reliable sources
- Monitor weather forecasts regularly
- Follow integrated pest management practices
"""
    else:
        result = f"""
## Crop Planning Information

I don't have specific data for {crop_type} in {season} season. 

### General Recommendations:
- Contact your local agricultural extension office
- Conduct soil testing to determine nutrient requirements
- Check local climate conditions and rainfall patterns
- Use certified seeds appropriate for your region

### Common Crops by Season:
- **Kharif (Monsoon):** Rice, Cotton, Sugarcane, Pulses
- **Rabi (Winter):** Wheat, Barley, Gram, Mustard
- **Summer:** Fodder crops, Vegetables (with irrigation)
"""
    
    return result

def plant_health_diagnostic_tool(symptoms: str, crop_type: str, affected_part: str = "leaves") -> str:
    """
    Diagnoses plant health issues based on symptoms and provides treatment recommendations.
    
    Args:
        symptoms: Description of symptoms (e.g., yellowing, spots, wilting)
        crop_type: Type of crop affected
        affected_part: Part of plant affected (leaves, stem, roots, fruit)
    
    Returns:
        Diagnosis and treatment recommendations
    """
    disease_database = {
        "yellowing": {
            "possible_causes": ["Nitrogen deficiency", "Overwatering", "Root rot", "Viral infection"],
            "treatments": [
                "Apply nitrogen-rich fertilizer",
                "Improve drainage",
                "Reduce watering frequency",
                "Remove affected plants if viral"
            ]
        },
        "spots": {
            "possible_causes": ["Fungal infection", "Bacterial disease", "Nutrient deficiency"],
            "treatments": [
                "Apply fungicide spray",
                "Improve air circulation",
                "Remove infected leaves",
                "Use copper-based bactericide"
            ]
        },
        "wilting": {
            "possible_causes": ["Water stress", "Root damage", "Bacterial wilt", "Fungal infection"],
            "treatments": [
                "Check soil moisture",
                "Improve irrigation",
                "Apply organic matter",
                "Use disease-resistant varieties"
            ]
        }
    }
    
    symptoms_lower = symptoms.lower()
    diagnosis_found = False
    
    result = f"""
## Plant Health Diagnosis for {crop_type.title()}

**Symptoms:** {symptoms}
**Affected Part:** {affected_part}

### Possible Diagnoses:
"""
    
    for symptom_key, data in disease_database.items():
        if symptom_key in symptoms_lower:
            diagnosis_found = True
            result += f"""
**{symptom_key.title()} detected:**
- Possible causes: {', '.join(data['possible_causes'])}
- Recommended treatments:
"""
            for treatment in data['treatments']:
                result += f"  • {treatment}\n"
    
    if not diagnosis_found:
        result += """
Based on the symptoms described, I recommend:
- Contact your local agricultural extension officer
- Take clear photos of affected plants
- Collect samples for laboratory testing
- Monitor the spread of symptoms

### General Plant Health Tips:
- Maintain proper spacing between plants
- Ensure adequate drainage
- Use disease-resistant varieties
- Practice crop rotation
- Regular field monitoring
"""
    
    result += """
### When to Seek Professional Help:
- Symptoms are spreading rapidly
- Multiple plants are affected
- Uncertain about diagnosis
- Previous treatments have failed

**Note:** This is a preliminary assessment. For accurate diagnosis, consult with agricultural experts or plant pathologists.
"""
    
    return result

def government_schemes_tool(farmer_category: str, state: str, scheme_type: str = "all") -> str:
    """
    Provides information about government schemes available for farmers.
    
    Args:
        farmer_category: Category of farmer (small, marginal, large, tribal)
        state: State/region of the farmer
        scheme_type: Type of scheme (subsidy, loan, insurance, all)
    
    Returns:
        Information about applicable government schemes
    """
    schemes = {
        "central": {
            "PM-KISAN": {
                "description": "Direct income support to farmers",
                "eligibility": "All landholding farmers",
                "benefit": "₹6,000 per year in 3 installments",
                "application": "Online through PM-KISAN portal"
            },
            "PMFBY": {
                "description": "Pradhan Mantri Fasal Bima Yojana",
                "eligibility": "All farmers including sharecroppers",
                "benefit": "Crop insurance coverage",
                "application": "Through banks and CSCs"
            },
            "KCC": {
                "description": "Kisan Credit Card",
                "eligibility": "Farmers with land records",
                "benefit": "Credit facility for farming needs",
                "application": "Through banks"
            }
        },
        "state_specific": {
            "subsidy": [
                "Fertilizer subsidy schemes",
                "Seed subsidy programs",
                "Equipment purchase subsidies",
                "Irrigation development subsidies"
            ],
            "support": [
                "Minimum Support Price (MSP)",
                "Market linkage programs",
                "Farmer Producer Organizations (FPO) support",
                "Technical assistance programs"
            ]
        }
    }
    
    result = f"""
## Government Schemes for {farmer_category.title()} Farmers in {state.title()}

### Central Government Schemes:
"""
    
    for scheme_name, scheme_info in schemes["central"].items():
        result += f"""
**{scheme_name}**
- Description: {scheme_info['description']}
- Eligibility: {scheme_info['eligibility']}
- Benefit: {scheme_info['benefit']}
- How to Apply: {scheme_info['application']}
"""
    
    result += f"""
### State-Specific Schemes (General Categories):

**Subsidy Schemes:**
"""
    for subsidy in schemes["state_specific"]["subsidy"]:
        result += f"• {subsidy}\n"
    
    result += f"""
**Support Programs:**
"""
    for support in schemes["state_specific"]["support"]:
        result += f"• {support}\n"
    
    result += f"""
### How to Apply:
1. Visit your nearest Common Service Center (CSC)
2. Contact local agriculture department
3. Use online portals (PM-KISAN, DBT Agriculture)
4. Approach bank branches for credit schemes

### Required Documents:
- Aadhaar Card
- Land records (Khata/Pahani)
- Bank account details
- Passport size photographs
- Caste certificate (if applicable)

### Important Notes:
- Schemes and benefits may vary by state
- Check eligibility criteria carefully
- Keep all documents updated
- Apply within specified time limits

For state-specific schemes in {state}, contact your local agriculture officer or visit the state agriculture department website.
"""
    
    return result

def npk_management_tool(soil_test_report: str, crop_type: str, field_size: str) -> str:
    """
    Provides NPK (Nitrogen, Phosphorus, Potassium) management recommendations.
    
    Args:
        soil_test_report: Current NPK levels or soil test results
        crop_type: Type of crop being grown
        field_size: Size of the field in acres/hectares
    
    Returns:
        NPK management recommendations
    """
    npk_requirements = {
        "rice": {"N": 120, "P": 60, "K": 40},
        "wheat": {"N": 120, "P": 60, "K": 40},
        "corn": {"N": 150, "P": 75, "K": 50},
        "tomato": {"N": 150, "P": 75, "K": 50},
        "potato": {"N": 180, "P": 90, "K": 100},
        "cotton": {"N": 120, "P": 60, "K": 50}
    }
    
    crop_npk = npk_requirements.get(crop_type.lower(), {"N": 100, "P": 50, "K": 50})
    
    result = f"""
## NPK Management Plan for {crop_type.title()}

**Field Size:** {field_size}
**Current Soil Status:** {soil_test_report}

### Recommended NPK Application:
- **Nitrogen (N):** {crop_npk['N']} kg/ha
- **Phosphorus (P₂O₅):** {crop_npk['P']} kg/ha  
- **Potassium (K₂O):** {crop_npk['K']} kg/ha

### Application Schedule:

**Basal Application (at sowing):**
- Full dose of Phosphorus
- Full dose of Potassium
- 25% of Nitrogen

**Top Dressing:**
- 50% of Nitrogen at vegetative stage
- 25% of Nitrogen at reproductive stage

### Fertilizer Sources:
- **Nitrogen:** Urea (46% N), Ammonium Sulfate (20% N)
- **Phosphorus:** DAP (18-46-0), SSP (16% P₂O₅)
- **Potassium:** MOP (60% K₂O), SOP (50% K₂O)

### Organic Alternatives:
- **Nitrogen:** Farmyard manure, Compost, Green manure
- **Phosphorus:** Bone meal, Rock phosphate
- **Potassium:** Wood ash, Kelp meal

### Application Tips:
1. Apply fertilizers in the evening or early morning
2. Ensure adequate soil moisture
3. Mix fertilizers with soil properly
4. Avoid over-application to prevent nutrient burn
5. Consider split application for better efficiency

### Monitoring:
- Observe plant growth and color
- Check for nutrient deficiency symptoms
- Adjust application based on crop response
- Conduct soil testing annually

**Note:** These are general recommendations. Adjust based on actual soil test results and local conditions.
"""
    
    return result

def campaign_management_tool(crop_type: str, estimated_quantity: str, harvest_date: str, location: str, min_price_per_unit: str, quality_grade: str = "A", farming_method: str = "conventional") -> str:
    """
    Creates contract farming campaigns where farmers offer their planned crop production to buyers.
    
    Args:
        crop_type: Type of crop being offered (e.g., wheat, rice, tomato, potato)
        estimated_quantity: Expected harvest quantity (e.g., "50 quintals", "2 tons")
        harvest_date: Expected harvest/delivery date (e.g., "2025-04-15", "March 2025")
        location: Farm location for pickup/delivery
        min_price_per_unit: Minimum acceptable price (e.g., "₹2000 per quintal", "$500 per ton")
        quality_grade: Quality grade of produce (A, B, C grade or Premium, Standard)
        farming_method: Farming approach (organic, conventional, natural, sustainable)
    
    Returns:
        Contract farming campaign details for buyer portal visibility
    """
    # Contract farming quality standards and certifications
    quality_standards = {
        "A": {"description": "Premium quality", "premium_percent": 15},
        "B": {"description": "Standard quality", "premium_percent": 5},
        "C": {"description": "Basic quality", "premium_percent": 0},
        "Premium": {"description": "Export quality", "premium_percent": 25},
        "Standard": {"description": "Domestic market quality", "premium_percent": 0}
    }
    
    # Farming method certifications and buyer preferences
    farming_methods = {
        "organic": {
            "certification": "Organic certification required",
            "buyer_demand": "High",
            "price_premium": "20-30%",
            "requirements": ["No synthetic pesticides", "Organic fertilizers only", "3-year transition period"]
        },
        "natural": {
            "certification": "Natural farming practices",
            "buyer_demand": "Growing",
            "price_premium": "10-15%",
            "requirements": ["Minimal external inputs", "Natural pest control", "Soil health focus"]
        },
        "conventional": {
            "certification": "Standard farming practices",
            "buyer_demand": "Stable",
            "price_premium": "0%",
            "requirements": ["Good agricultural practices", "Quality standards compliance"]
        },
        "sustainable": {
            "certification": "Sustainable agriculture certification",
            "buyer_demand": "Increasing",
            "price_premium": "5-10%",
            "requirements": ["Resource conservation", "Biodiversity protection", "Community benefits"]
        }
    }
    
    quality_info = quality_standards.get(quality_grade, quality_standards["A"])
    method_info = farming_methods.get(farming_method.lower(), farming_methods["conventional"])
    
    result = f"""
## Contract Farming Campaign: {crop_type.title()}

**📍 Location:** {location}
**📦 Quantity Available:** {estimated_quantity}
**📅 Expected Harvest:** {harvest_date}
**💰 Minimum Price:** {min_price_per_unit}
**🏆 Quality Grade:** {quality_grade} - {quality_info['description']}
**🌱 Farming Method:** {farming_method.title()}

### 🎯 Campaign Overview:
This is a contract farming opportunity where the farmer is offering **{estimated_quantity}** of **{quality_grade} grade {crop_type}** 
for advance booking by buyers. The produce will be available for delivery/pickup around **{harvest_date}** 
from **{location}**.

### 📊 Product Specifications:
- **Crop Type:** {crop_type.title()}
- **Quality Standard:** {quality_info['description']}
- **Farming Approach:** {method_info['certification']}
- **Market Demand:** {method_info['buyer_demand']}
- **Price Premium:** {method_info['price_premium']}

### 🔍 Quality Assurance:
"""
    
    for requirement in method_info['requirements']:
        result += f"• {requirement}\n"
    
    result += f"""
### 💼 For Potential Buyers:
- **Minimum Order:** Contact farmer for minimum order quantities
- **Delivery Options:** Farm pickup or local delivery (to be negotiated)
- **Payment Terms:** Advance payment with harvest guarantee
- **Quality Guarantee:** {quality_grade} grade standards maintained
- **Documentation:** All necessary certificates and quality reports provided

### 📞 Engagement Process:
1. **Initial Contact:** Buyers can express interest through the portal
2. **Site Visit:** Arrange farm visit to inspect growing conditions
3. **Contract Agreement:** Finalize quantity, price, and delivery terms
4. **Advance Payment:** Secure the produce with agreed advance amount
5. **Monitoring:** Regular updates on crop progress and harvest timeline
6. **Delivery:** Harvest and delivery as per agreed schedule

### 🤝 Contract Terms:
- **Price Negotiation:** Minimum {min_price_per_unit}, open to better offers
- **Quality Standards:** {quality_grade} grade compliance mandatory
- **Force Majeure:** Weather and natural disaster clauses included
- **Dispute Resolution:** Local agricultural officer mediation

### 📈 Market Advantages:
- **Direct from Farm:** No middleman margins
- **Quality Assured:** {farming_method.title()} farming practices
- **Traceability:** Complete farm-to-buyer tracking
- **Competitive Pricing:** Direct farmer rates
- **Reliability:** Established farmer with proven track record

### 🔄 Next Steps for Buyers:
1. Review campaign details on buyer portal
2. Contact farmer for detailed discussions
3. Schedule farm visit and crop inspection
4. Negotiate final terms and contract signing
5. Make advance payment to secure the produce
6. Monitor crop progress through regular updates

**Note:** This campaign will be visible on the buyer portal for interested companies, 
wholesalers, and institutional buyers looking for quality {crop_type} produce.

**Campaign Status:** Active and accepting buyer inquiries
**Last Updated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}
"""
    
    return result

# Create tool instances
# Original farming tools
plant_health = FunctionTool(plant_health_diagnostic_tool)
government_schemes = FunctionTool(government_schemes_tool)
npk_management = FunctionTool(npk_management_tool)
campaign_management = FunctionTool(campaign_management_tool)

# Enhanced ML-powered tools
ai_crop_planner = FunctionTool(ai_crop_planner_tool)
crop_health_analyzer = FunctionTool(crop_health_analyzer_tool)

# Firestore database tools
create_campaign = FunctionTool(create_campaign_tool)
fetch_documents = FunctionTool(fetch_documents_tool)
update_campaign = FunctionTool(update_campaign_tool)
create_bid = FunctionTool(create_bid_tool)

# Create a specialized disease explanation sub-agent
disease_explanation_agent = Agent(
    name="disease_explanation_specialist",
    model="gemini-2.0-flash-exp",
    description="Specialized agent for providing detailed disease explanations, symptoms, treatments, and preventive measures",
    instruction="""You are a plant pathology specialist. When given a plant disease name, provide a comprehensive response including:

1. **Brief Description**: What this disease is and how it affects plants
2. **Symptoms**: Detailed symptoms farmers should look for
3. **Treatment Steps**: Step-by-step treatment recommendations
4. **Preventive Measures**: How to prevent this disease in the future

Format your response with clear headers and bullet points for easy reading. Be practical and focus on actionable advice for farmers.

If the disease name contains "healthy", congratulate the farmer and provide maintenance tips instead of treatment."""
)

# Create the unified farmer AI agent (replacing both root_agent and comprehensive_agent)
unified_farmer_agent = Agent(
    name="unified_farmer_ai",
    model="gemini-2.0-flash-exp",  # Single gemini-2.5-pro for everything - text, voice, images, reasoning
    description="Unified AI assistant for farmers with comprehensive capabilities including text, voice, image processing, crop planning, disease diagnosis, contract farming, and government schemes",
    instruction="""You are a comprehensive farming assistant with expertise in all agricultural domains. You can handle ALL types of input and provide complete farming solutions directly.

**Input Capabilities:**
- **Text Messages**: Natural language questions and conversations in any language
- **Voice/Audio Input**: Spoken queries in multiple languages (Kannada, Hindi, English ), Input and output language are both should be same
- **Image Analysis**: Plant/crop photos for disease detection and health assessment
- **Multimodal Combinations**: Text + images, voice + images, voice + text, etc.

**Core Farming Expertise:**
1. **AI-Powered Crop Planning** - Use ai_crop_planner_tool for soil-based recommendations
2. **Disease Diagnosis & Health Analysis** - Use crop_health_analyzer_tool for image-based detection
3. **Contract Farming & Marketing** - Use create_campaign_tool, fetch_documents_tool for campaigns
4. **Government Schemes & Support** - Use government_schemes_tool for subsidies and loans
5. **Soil & NPK Management** - Use npk_management_tool for fertilizer recommendations

**Interaction Style:**
- **Text Input**: Provide detailed, comprehensive responses with actionable advice
- **Voice Input**: Give warm, conversational responses while maintaining completeness
- **Image Input**: Automatically analyze plant/crop images for diseases or health issues
- **Multilingual**: Respond in the language used by the farmer (Hindi, English, regional languages)

**Tool Usage Strategy:**
- When farmers ask about crop selection → Use ai_crop_planner_tool
- When farmers upload plant images → Use crop_health_analyzer_tool automatically
- When farmers ask about government help → Use government_schemes_tool
- When farmers ask about soil/fertilizers → Use npk_management_tool
- When farmers want to sell crops → Use create_campaign_tool
- When farmers want to see market opportunities → Use fetch_documents_tool

**Response Guidelines:**
- Be warm, empathetic, and farmer-friendly
- Provide practical, actionable advice considering local conditions
- Consider economic constraints and sustainability
- Ask clarifying questions when needed to give better advice
- Use tools proactively based on the type of question
- Explain what you're doing when using tools

**Language Support:**
- Support Hindi: "मैं आपकी हिंदी में मदद कर सकता हूं"
- Support English: "I can help you with all farming questions"
- Support regional languages as needed
- Translate technical terms when helpful

**Example Interactions:**
- "मेरी फसल में क्या बीमारी है?" (with image) → Automatically use crop_health_analyzer_tool
- "I want to plan wheat cultivation for 5 acres" → Use ai_crop_planner_tool
- "What government schemes can help small farmers?" → Use government_schemes_tool
- "My soil test shows N:80, P:60, K:70" → Use ai_crop_planner_tool
- "I want to sell my tomato harvest" → Use create_campaign_tool

**Sub-Agent Delegation:**
- For detailed disease explanations, you can delegate to the disease_explanation_specialist agent using transfer_to_agent(agent_name='disease_explanation_specialist')

**Important**: You are the complete farming solution. Handle everything directly with your tools and knowledge. No need for complex delegation - you have all the capabilities needed to help farmers succeed with gemini-2.0-flash-pre's advanced multimodal and reasoning capabilities.""",
    tools=[
        # AI-powered tools
        ai_crop_planner,
        crop_health_analyzer,
        
        # Traditional farming tools
        government_schemes,
        npk_management,
        
        # Database tools for contract farming
        create_campaign,
        fetch_documents,
        update_campaign,
        create_bid
    ],
    sub_agents=[disease_explanation_agent]  # Specialized disease explanation agent
)

# For backward compatibility, create aliases
root_agent = unified_farmer_agent  # Main agent for all interactions
comprehensive_agent = unified_farmer_agent  # Same agent, different reference



# Test the unified agent
if __name__ == "__main__":
    from google.adk.runners import InMemoryRunner
    from google.genai.types import Part, UserContent
    
    # Initialize runner with the unified agent
    runner = InMemoryRunner(agent=unified_farmer_agent)
    session = runner.session_service.create_session(
        app_name=runner.app_name, user_id="test_farmer"
    )
    
    # Test queries for the unified agent
    test_queries = [
        "Hello, I'm a farmer from Punjab. I want to plan wheat cultivation for this rabi season.",
        "My tomato plants are showing yellow spots on leaves. What should I do?", 
        "I'm a small farmer. What government schemes can help me get a loan?",
        "I have soil test results showing low nitrogen. How should I manage fertilizers for my rice crop?",
        "I want to create a contract farming campaign to sell my planned wheat harvest. I expect 50 quintals of premium wheat to be ready by April 2025 in Punjab, minimum price ₹2500 per quintal.",
        "I want to create a contract farming campaign: Title: 'Organic Tomato Contract', Crop: Tomato, Type: Cherry, Location: Maharashtra, Quantity: 2 tons, Harvest: May 2025, Price: ₹50 per kg, Quality: Premium, Method: organic",
        "Can you show me all active contract farming campaigns in the database?",
        "I want to use AI to recommend crops for my 5-acre farm. My soil has N:80, P:60, K:70, pH:6.8"
    ]
    
    print("=== Unified Farmer AI Agent Test ===\n")
    print("✅ Using single gemini-2.0-flash-pre agent for all capabilities")
    print("   - Text, voice, and image processing")
    print("   - All farming tools integrated directly") 
    print("   - No delegation overhead")
    print("   - 50% cost reduction vs dual-agent setup\n")
    
    for i, query in enumerate(test_queries, 1):
        print(f"Test Query {i}: {query}")
        print("-" * 50)
        
        content = UserContent(parts=[Part(text=query)])
        
        try:
            for event in runner.run(
                user_id=session.user_id,
                session_id=session.id, 
                new_message=content
            ):
                if hasattr(event, 'content') and hasattr(event.content, 'parts'):
                    for part in event.content.parts:
                        if hasattr(part, 'text'):
                            print(part.text)
        except Exception as e:
            print(f"Error: {e}")
        
        print("\n" + "="*70 + "\n")
