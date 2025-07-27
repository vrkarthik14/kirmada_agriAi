"""
FastAPI Web Application for Farmer AI Agent
Provides a web interface similar to ADK web interface for interacting with the farmer agent
"""

import os
import json
import asyncio
import base64
import uuid
from pathlib import Path
from dotenv import load_dotenv

from google.genai.types import (
    Part,
    Content,
    Blob,
)

from google.adk.runners import InMemoryRunner
from google.adk.agents import LiveRequestQueue
from google.adk.agents.run_config import RunConfig
from google.adk.sessions.in_memory_session_service import InMemorySessionService

from fastapi import FastAPI, WebSocket, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agent import unified_farmer_agent

# Load environment variables
load_dotenv()

APP_NAME = "Farmer AI Web Interface"

# Initialize FastAPI app
app = FastAPI(
    title="Farmer AI Assistant", 
    description="Web interface for Farmer AI Agent",
    debug=True
)

# Add startup event
@app.on_event("startup")
async def startup_event():
    print(f"🌾 Farmer AI Web Interface Starting...")
    print(f"📁 Static directory: {STATIC_DIR}")
    print(f"📄 Index file exists: {(STATIC_DIR / 'index.html').exists()}")
    print(f"🔗 Agent: {unified_farmer_agent.name if hasattr(unified_farmer_agent, 'name') else 'Loaded'}")
    print(f"🚀 Server ready at: http://localhost:8000")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files directory
STATIC_DIR = Path(__file__).parent / "static"

# Verify static directory exists
if not STATIC_DIR.exists():
    print(f"❌ Static directory not found: {STATIC_DIR}")
    print("Creating static directory...")
    STATIC_DIR.mkdir(exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Global session management
active_sessions = {}
session_modes = {}  # Track whether each session is in audio or text mode

async def start_agent_session(user_id, is_audio=False):
    """Starts an agent session with proper modality configuration"""
    print(f"[DEBUG] Starting agent session for user {user_id}, audio mode: {is_audio}")
    
    # Create a Runner
    runner = InMemoryRunner(
        app_name=APP_NAME,
        agent=unified_farmer_agent,
    )
    print(f"[DEBUG] Runner created: {runner}")
    
    # Create a Session
    session = await runner.session_service.create_session(
        app_name=APP_NAME,
        user_id=user_id,
    )
    print(f"[DEBUG] Session created: {session.id}")
    
    # Configure RunConfig with proper response modalities based on input type
    if is_audio:
        # For voice input, enable both audio and text output for better user experience
        print(f"[DEBUG] Configuring for AUDIO mode - voice input/output")
        run_config = RunConfig(
            streaming_mode="sse",
            response_modalities=["AUDIO", "TEXT"],  # Allow both for flexibility
            max_llm_calls=500
        )
    else:
        # For text input, enable text output only
        print(f"[DEBUG] Configuring for TEXT mode - text input/output")
        run_config = RunConfig(
            streaming_mode="sse",
            response_modalities=["TEXT"],  # Only text responses for text input
            max_llm_calls=500
        )
    
    print(f"[DEBUG] RunConfig created: {run_config}")
    
    # Create a LiveRequestQueue for this session
    live_request_queue = LiveRequestQueue()
    print(f"[DEBUG] LiveRequestQueue created: {live_request_queue}")
    
    # Start agent session
    print(f"[DEBUG] Starting live agent run...")
    live_events = runner.run_live(
        session=session,
        live_request_queue=live_request_queue,
        run_config=run_config,
    )
    print(f"[DEBUG] Live events stream created: {live_events}")
    
    return live_events, live_request_queue

async def agent_to_client_sse(live_events, session_mode="text"):
    """Agent to client communication via SSE with enhanced error handling and modality filtering"""
    print(f"[DEBUG] Starting agent_to_client_sse stream in {session_mode} mode")
    try:
        event_count = 0
        last_heartbeat = asyncio.get_event_loop().time()
        
        async for event in live_events:
            event_count += 1
            current_time = asyncio.get_event_loop().time()
            print(f"[DEBUG] Event #{event_count}: turn_complete={getattr(event, 'turn_complete', None)}, interrupted={getattr(event, 'interrupted', None)}, partial={getattr(event, 'partial', None)}")
            
            # Send heartbeat every 30 seconds if no events
            if current_time - last_heartbeat > 30:
                try:
                    heartbeat_msg = {"type": "heartbeat", "timestamp": current_time}
                    yield f"data: {json.dumps(heartbeat_msg)}\n\n"
                    print(f"[DEBUG] Sent heartbeat at {current_time}")
                    last_heartbeat = current_time
                except Exception as e:
                    print(f"[DEBUG] Heartbeat failed: {e}")
            
            # If the turn complete or interrupted, send it
            if event.turn_complete or event.interrupted:
                message = {
                    "turn_complete": event.turn_complete,
                    "interrupted": event.interrupted,
                }
                try:
                    yield f"data: {json.dumps(message)}\n\n"
                    print(f"[AGENT TO CLIENT]: {message}")
                    last_heartbeat = current_time
                    continue
                except (TypeError, ValueError) as e:
                    print(f"Error encoding turn completion message: {e}")
                    continue

            # Read the Content and its first Part
            print(f"[DEBUG] Event content: {getattr(event, 'content', None)}")
            part: Part = (
                event.content and event.content.parts and event.content.parts[0]
            )
            if not part:
                print(f"[DEBUG] No part found in event #{event_count}")
                continue

            print(f"[DEBUG] Part found: text='{getattr(part, 'text', None)}', inline_data={getattr(part, 'inline_data', None)}")

            # Check if this is an audio response
            is_audio_response = part.inline_data and part.inline_data.mime_type.startswith("audio/pcm")
            print(f"[DEBUG] Is audio response: {is_audio_response}")
            
            # MODALITY FILTERING: Send responses that match session mode or are dual-mode
            if session_mode == "audio":
                # Audio mode: prioritize audio responses but allow text as backup
                if is_audio_response:
                    try:
                        audio_data = base64.b64encode(part.inline_data.data).decode('utf-8')
                        message = {
                            "mime_type": part.inline_data.mime_type,
                            "data": audio_data
                        }
                        json_str = json.dumps(message)
                        yield f"data: {json_str}\n\n"
                        print(f"[AGENT TO CLIENT - AUDIO MODE]: {part.inline_data.mime_type}: {len(part.inline_data.data)} bytes")
                        last_heartbeat = current_time
                        continue
                    except Exception as e:
                        print(f"Error encoding audio message: {e}")
                        continue
                elif part.text and event.partial:
                    # In audio mode, also send text as fallback/supplementary
                    print(f"[DEBUG] Sending text response in audio mode as backup: '{part.text}'")
                    try:
                        safe_text = part.text.encode('utf-8', errors='ignore').decode('utf-8')
                        message = {
                            "mime_type": "text/plain",
                            "data": safe_text
                        }
                        json_str = json.dumps(message, ensure_ascii=False)
                        yield f"data: {json_str}\n\n"
                        print(f"[AGENT TO CLIENT - AUDIO MODE BACKUP]: text/plain: {safe_text[:50]}...")
                        last_heartbeat = current_time
                    except (TypeError, ValueError, UnicodeError) as e:
                        print(f"Error encoding text backup message: {e}")
                    continue
            elif session_mode == "text" and part.text and event.partial:
                # Text mode: only send text responses
                print(f"[DEBUG] Sending text response in text mode: '{part.text}'")
                try:
                    # Ensure text is properly encoded and safe for JSON
                    safe_text = part.text.encode('utf-8', errors='ignore').decode('utf-8')
                    message = {
                        "mime_type": "text/plain",
                        "data": safe_text
                    }
                    # Validate JSON serialization
                    json_str = json.dumps(message, ensure_ascii=False)
                    yield f"data: {json_str}\n\n"
                    print(f"[AGENT TO CLIENT - TEXT MODE]: text/plain: {safe_text[:50]}...")
                    last_heartbeat = current_time
                except (TypeError, ValueError, UnicodeError) as e:
                    print(f"Error encoding text message: {e}")
                    # Send safe fallback
                    fallback_message = {
                        "mime_type": "text/plain",
                        "data": "[Error: Unable to encode message]"
                    }
                    try:
                        yield f"data: {json.dumps(fallback_message)}\n\n"
                    except:
                        pass
                    continue
            else:
                # Skip responses that don't match the session mode
                if is_audio_response and session_mode == "text":
                    print(f"[DEBUG] FILTERED: Skipping audio response in text mode")
                elif part.text and session_mode == "audio":
                    print(f"[DEBUG] FILTERED: Skipping text response in audio mode")
                else:
                    print(f"[DEBUG] Skipping event: text='{getattr(part, 'text', None)}', partial={getattr(event, 'partial', None)}, audio={is_audio_response}")
                continue
                    
    except (ConnectionError, TimeoutError) as e:
        print(f"Connection error in SSE stream: {e}")
        print("This is likely a temporary network issue. The client will automatically reconnect.")
        # Send connection error message to client
        error_message = {
            "type": "connection_error",
            "mime_type": "text/plain",
            "data": "Connection temporarily lost. Reconnecting..."
        }
        try:
            yield f"data: {json.dumps(error_message)}\n\n"
        except:
            pass
    except Exception as e:
        print(f"Error in SSE stream: {e}")
        import traceback
        traceback.print_exc()
        
        # Check if it's a WebSocket-related error
        error_type = type(e).__name__
        if "websocket" in str(e).lower() or "connectionclosed" in error_type.lower():
            print("WebSocket connection error detected - this is normal for long-running connections")
            error_message = {
                "type": "websocket_error", 
                "mime_type": "text/plain",
                "data": "WebSocket connection closed. Please refresh to reconnect."
            }
        else:
            # Generic error
            error_message = {
                "type": "general_error",
                "mime_type": "text/plain",
                "data": f"Connection error: {str(e)}"
            }
        
        try:
            yield f"data: {json.dumps(error_message)}\n\n"
        except:
            pass

@app.get("/")
async def root():
    """Serves the main interface"""
    index_file = STATIC_DIR / "index.html"
    if not index_file.exists():
        return {"error": "index.html not found", "static_dir": str(STATIC_DIR)}
    return FileResponse(index_file)

@app.get("/events/{user_id}")
async def sse_endpoint(user_id: int, is_audio: str = "false"):
    """SSE endpoint for agent to client communication with enhanced error handling"""
    
    max_retries = 3
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            # Start agent session
            user_id_str = str(user_id)
            live_events, live_request_queue = await start_agent_session(user_id_str, is_audio == "true")
            
            # Store the request queue for this user
            active_sessions[user_id_str] = live_request_queue
            
            # Track session mode
            session_mode = "audio" if is_audio == "true" else "text"
            session_modes[user_id_str] = session_mode
            
            print(f"Client #{user_id} connected via SSE, audio mode: {is_audio} (attempt {retry_count + 1})")
            
            def cleanup():
                try:
                    live_request_queue.close()
                    if user_id_str in active_sessions:
                        del active_sessions[user_id_str]
                    if user_id_str in session_modes:
                        del session_modes[user_id_str]
                    print(f"Client #{user_id} disconnected from SSE")
                except Exception as e:
                    print(f"Error during cleanup: {e}")
            
            async def event_generator():
                try:
                    async for data in agent_to_client_sse(live_events, session_mode):
                        yield data
                except (ConnectionError, TimeoutError) as e:
                    print(f"Connection error in event generator: {e}")
                    # Send reconnection message
                    error_msg = {
                        "type": "reconnect",
                        "mime_type": "text/plain",
                        "data": "Connection lost. Please refresh to reconnect."
                    }
                    yield f"data: {json.dumps(error_msg)}\n\n"
                except Exception as e:
                    print(f"Error in event generator: {e}")
                    # Send error to client
                    error_msg = {
                        "type": "error",
                        "mime_type": "text/plain",
                        "data": f"Stream error: {str(e)}"
                    }
                    yield f"data: {json.dumps(error_msg)}\n\n"
                finally:
                    cleanup()
            
            return StreamingResponse(
                event_generator(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Cache-Control",
                    "X-Accel-Buffering": "no",  # Disable nginx buffering
                }
            )
            
        except Exception as e:
            retry_count += 1
            print(f"Error creating SSE endpoint (attempt {retry_count}): {e}")
            if retry_count >= max_retries:
                return {"error": f"Failed to create SSE connection after {max_retries} attempts: {str(e)}"}
            else:
                print(f"Retrying SSE connection... ({retry_count}/{max_retries})")
                await asyncio.sleep(1)  # Wait 1 second before retry
        
@app.post("/send/{user_id}")
async def send_message_endpoint(user_id: int, request: Request):
    """HTTP endpoint for client to agent communication with modality validation"""
    
    user_id_str = str(user_id)
    print(f"[DEBUG] Received message from user {user_id_str}")
    
    # Get the live request queue for this user
    live_request_queue = active_sessions.get(user_id_str)
    if not live_request_queue:
        print(f"[DEBUG] No session found for user {user_id_str}")
        return {"error": "Session not found"}
    
    # Get the session mode for this user
    current_session_mode = session_modes.get(user_id_str, "text")
    print(f"[DEBUG] Current session mode: {current_session_mode}")
    
    # Parse the message
    message = await request.json()
    mime_type = message["mime_type"]
    data = message["data"]
    print(f"[DEBUG] Message parsed: mime_type={mime_type}, data length={len(data)}")
    
    # Filter out "Thinking" messages that seem to be sent automatically
    if mime_type == "text/plain" and data.strip().lower() in ["thinking", "ai is thinking"]:
        print(f"[FILTERED]: Ignoring auto-sent 'Thinking' message from client")
        return {"status": "filtered"}
    
    # MODALITY VALIDATION: Ensure input matches session mode (relaxed for better UX)
    if current_session_mode == "text" and mime_type in ["audio/pcm", "audio/wav"]:
        print(f"[WARNING]: Audio input in text session mode - consider switching to audio mode")
        # Allow but warn - user might want to switch modes
        # return {"error": "Audio input not supported in text mode session"}
    elif current_session_mode == "audio" and mime_type == "text/plain":
        print(f"[WARNING]: Text input in audio session mode - processing anyway")
        # Allow text input in audio mode for better flexibility
    
    # Send the message to the agent
    if mime_type == "text/plain":
        print(f"[DEBUG] Sending text content to agent")
        content = Content(role="user", parts=[Part.from_text(text=data)])
        live_request_queue.send_content(content=content)
        print(f"[CLIENT TO AGENT]: {data} (text mode)")
    elif mime_type == "audio/pcm":
        print(f"[DEBUG] Sending PCM audio content to agent")
        # Handle PCM audio input (proper format for ADK)
        decoded_data = base64.b64decode(data)
        
        # Validate audio data
        if len(decoded_data) == 0:
            print(f"[ERROR] Empty audio data received")
            return {"error": "Empty audio data"}
        
        if len(decoded_data) % 2 != 0:
            print(f"[ERROR] Invalid PCM data length: {len(decoded_data)} (must be even)")
            return {"error": "Invalid PCM data format"}
        
        if len(decoded_data) > 10 * 1024 * 1024:  # 10MB limit
            print(f"[ERROR] Audio data too large: {len(decoded_data)} bytes")
            return {"error": "Audio data too large"}
        
        print(f"[DEBUG] Validated PCM audio: {len(decoded_data)} bytes, {len(decoded_data)//2} samples")
        
        try:
            live_request_queue.send_realtime(Blob(data=decoded_data, mime_type="audio/pcm"))
            print(f"[CLIENT TO AGENT]: audio/pcm: {len(decoded_data)} bytes (audio mode)")
        except Exception as e:
            print(f"[ERROR] Failed to send audio to agent: {e}")
            return {"error": f"Failed to process audio: {str(e)}"}
    elif mime_type == "audio/wav":
        print(f"[DEBUG] Converting WAV to PCM and sending to agent")
        # Handle WAV audio input - need to convert to PCM
        decoded_data = base64.b64decode(data)
        # TODO: Add proper WAV to PCM conversion if needed
        # For now, assume the frontend sends proper PCM data with wav label
        live_request_queue.send_realtime(Blob(data=decoded_data, mime_type="audio/pcm"))
        print(f"[CLIENT TO AGENT]: audio/wav -> audio/pcm: {len(decoded_data)} bytes (audio mode)")
    elif mime_type.startswith("image/"):
        print(f"[DEBUG] Sending image content to agent")
        # Handle image uploads - keep current session mode
        decoded_data = base64.b64decode(data)
        content = Content(role="user", parts=[Part.from_image_data(mime_type=mime_type, data=decoded_data)])
        live_request_queue.send_content(content=content)
        print(f"[CLIENT TO AGENT]: {mime_type}: {len(decoded_data)} bytes")
    else:
        print(f"[DEBUG] Unsupported mime type: {mime_type}")
        return {"error": f"Mime type not supported: {mime_type}"}
    
    print(f"[DEBUG] Message sent successfully to agent")
    return {"status": "sent"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "agent": "farmer_ai", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
