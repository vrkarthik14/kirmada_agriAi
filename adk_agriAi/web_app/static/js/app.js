/**
 * Farmer AI Assistant Web Application
 * JavaScript module for handling chat interface, audio, and image uploads
 * Compatible with ADK streaming API
 */

// Global variables
const sessionId = Math.random().toString().substring(10);
const sse_url = "http://" + window.location.host + "/events/" + sessionId;
const send_url = "http://" + window.location.host + "/send/" + sessionId;

let eventSource = null;
let is_audio = false;
let currentMessageId = null;
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];

// DOM elements
const messagesArea = document.getElementById('messagesArea');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const imageBtn = document.getElementById('imageBtn');
const micBtn = document.getElementById('micBtn');
const fileInput = document.getElementById('fileInput');
const typingIndicator = document.getElementById('typingIndicator');
const connectionStatus = document.getElementById('connectionStatus');
const connectionText = document.getElementById('connectionText');
const welcomeTime = document.getElementById('welcomeTime');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set welcome message time
    welcomeTime.textContent = new Date().toLocaleTimeString();
    
    // Setup event listeners
    setupEventListeners();
    
    // Connect to SSE
    connectSSE();
    
    // Focus on input
    messageInput.focus();
}

function setupEventListeners() {
    // Send button and input
    sendBtn.addEventListener('click', handleSendMessage);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    
    // Input validation
    messageInput.addEventListener('input', handleInputChange);
    
    // File upload and audio recording
    imageBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);
    micBtn.addEventListener('click', toggleRecording);
}

function handleInputChange() {
    const hasText = messageInput.value.trim().length > 0;
    sendBtn.disabled = !hasText;
    
    // Auto-resize textarea
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
}

function handleSendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    // Display user message
    displayMessage(message, 'user');
    
    // Switch to text mode if currently in audio mode
    if (is_audio) {
        is_audio = false;
        connectSSE(); // Reconnect in text mode
    }
    
    // Send to agent
    sendMessage({
        mime_type: "text/plain",
        data: message
    });
    
    // Clear input
    messageInput.value = '';
    handleInputChange();
    
    // Show typing indicator
    showTypingIndicator();
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Data = e.target.result.split(',')[1];
            
            // Display image in chat
            displayImageMessage(e.target.result, 'user');
            
            // Send to agent
            sendMessage({
                mime_type: file.type,
                data: base64Data
            });
            
            // Show typing indicator
            showTypingIndicator();
        };
        reader.readAsDataURL(file);
    }
    
    // Clear file input
    fileInput.value = '';
}

async function toggleRecording() {
    if (!isRecording) {
        try {
            // Use basic audio constraints that are more likely to work
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 1,    // Mono audio
                    echoCancellation: true,
                    noiseSuppression: true
                    // Remove sampleRate constraint as it's not always supported
                }
            });
            
            // Try different MIME types in order of preference
            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
            } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
                mimeType = 'audio/ogg';
            }
            
            console.log('[DEBUG] Using MediaRecorder MIME type:', mimeType);
            
            mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType
            });
            audioChunks = [];
            
            mediaRecorder.ondataavailable = function(e) {
                audioChunks.push(e.data);
            };
            
            mediaRecorder.onstop = function() {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                console.log('[DEBUG] Original audio blob size:', audioBlob.size);
                
                convertToPCM(audioBlob).then(pcmData => {
                    console.log('[DEBUG] PCM data length:', pcmData.byteLength);
                    console.log('[DEBUG] PCM sample count:', pcmData.byteLength / 2);
                    
                    // Validate PCM data
                    if (pcmData.byteLength === 0) {
                        throw new Error('Empty PCM data generated');
                    }
                    
                    if (pcmData.byteLength > 10 * 1024 * 1024) { // 10MB limit
                        throw new Error('PCM data too large: ' + pcmData.byteLength + ' bytes');
                    }
                    
                    const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData)));
                    console.log('[DEBUG] Base64 data length:', base64Data.length);
                    
                    // Display audio message indicator
                    displayMessage('🎤 Voice message sent', 'user');
                    
                    // Switch to audio mode and reconnect SSE
                    if (!is_audio) {
                        is_audio = true;
                        connectSSE(); // Reconnect in audio mode
                    }
                    
                    // Send to agent as audio/pcm (proper format)
                    sendMessage({
                        mime_type: "audio/pcm",
                        data: base64Data
                    });
                    
                    // Show typing indicator
                    showTypingIndicator();
                }).catch(error => {
                    console.error('Error converting audio to PCM:', error);
                    showError('Failed to process audio: ' + error.message);
                });
            };
            
            mediaRecorder.start();
            isRecording = true;
            micBtn.classList.add('recording');
            micBtn.title = 'Stop Recording';
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            showError('Could not access microphone. Please check permissions.');
        }
    } else {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        isRecording = false;
        micBtn.classList.remove('recording');
        micBtn.title = 'Voice Input';
    }
}

// SSE Connection Management
function connectSSE() {
    if (eventSource) {
        eventSource.close();
    }
    
    updateConnectionStatus('connecting');
    
    eventSource = new EventSource(sse_url + "?is_audio=" + is_audio);
    
    eventSource.onopen = function() {
        updateConnectionStatus('connected');
        sendBtn.disabled = messageInput.value.trim().length === 0;
        console.log("SSE connection opened.");
    };
    
    eventSource.onmessage = function(event) {
        const message = JSON.parse(event.data);
        console.log("[AGENT TO CLIENT]", message);
        
        handleAgentMessage(message);
    };
    
    eventSource.onerror = function(event) {
        updateConnectionStatus('disconnected');
        console.log("SSE connection error or closed.");
        
        // Auto-reconnect after 5 seconds
        setTimeout(() => {
            console.log("Reconnecting...");
            connectSSE();
        }, 5000);
    };
}

// Audio utility functions
async function convertToPCM(audioBlob) {
    try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: 24000  // Use 24kHz to match ADK output rate
        });
        
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Resample to 24kHz if needed (ADK expects 24kHz for realtime)
        let channelData = audioBuffer.getChannelData(0); // Get mono channel
        
        // If the audio buffer sample rate doesn't match, we need to resample
        if (audioBuffer.sampleRate !== 24000) {
            const ratio = 24000 / audioBuffer.sampleRate;
            const newLength = Math.round(channelData.length * ratio);
            const resampledData = new Float32Array(newLength);
            
            for (let i = 0; i < newLength; i++) {
                const originalIndex = i / ratio;
                const index = Math.floor(originalIndex);
                const fraction = originalIndex - index;
                
                if (index + 1 < channelData.length) {
                    resampledData[i] = channelData[index] * (1 - fraction) + channelData[index + 1] * fraction;
                } else {
                    resampledData[i] = channelData[index] || 0;
                }
            }
            channelData = resampledData;
        }
        
        // Convert Float32 to Int16 (PCM format) with proper clamping
        const pcmData = new Int16Array(channelData.length);
        for (let i = 0; i < channelData.length; i++) {
            // Clamp to [-1, 1] and convert to 16-bit signed integer
            const clampedSample = Math.max(-1, Math.min(1, channelData[i]));
            pcmData[i] = clampedSample < 0 ? clampedSample * 0x8000 : clampedSample * 0x7FFF;
        }
        
        return pcmData.buffer;
    } catch (error) {
        console.error('Error converting audio to PCM:', error);
        throw error;
    }
}

function pcmToWav(pcmData, sampleRate = 24000, numChannels = 1, bitDepth = 16) {
    const length = pcmData.length;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    
    // RIFF header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true); // file size
    writeString(8, 'WAVE');
    
    // fmt chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true); // audio format (PCM)
    view.setUint16(22, numChannels, true); // number of channels
    view.setUint32(24, sampleRate, true); // sample rate
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true); // byte rate
    view.setUint16(32, numChannels * (bitDepth / 8), true); // block align
    view.setUint16(34, bitDepth, true); // bits per sample
    
    // data chunk
    writeString(36, 'data');
    view.setUint32(40, length * 2, true); // data size
    
    // Convert PCM data to 16-bit samples
    for (let i = 0; i < length; i++) {
        // Ensure proper signed 16-bit conversion
        let sample = pcmData[i];
        if (sample > 32767) sample = 32767;
        if (sample < -32768) sample = -32768;
        view.setInt16(44 + i * 2, sample, true);
    }
    
    return arrayBuffer;
}

function handleAgentMessage(message) {
    // Check if turn is complete
    if (message.turn_complete && message.turn_complete === true) {
        hideTypingIndicator();
        currentMessageId = null;
        return;
    }
    
    // Handle different message types
    if (message.mime_type === "audio/pcm" || message.mime_type.startsWith("audio/pcm")) {
        // Handle audio playback
        console.log("Received audio data:", message.data.length);
        hideTypingIndicator();
        
        // Create audio element and play
        try {
            // Convert base64 to binary data
            const binaryString = atob(message.data);
            
            // Convert binary string to Int16Array for proper PCM handling
            const audioArray = new Int16Array(binaryString.length / 2);
            for (let i = 0; i < audioArray.length; i++) {
                // Properly read 16-bit little-endian PCM data
                const byte1 = binaryString.charCodeAt(i * 2) & 0xFF;
                const byte2 = binaryString.charCodeAt(i * 2 + 1) & 0xFF;
                audioArray[i] = (byte2 << 8) | byte1;
                // Convert unsigned to signed if needed
                if (audioArray[i] > 32767) {
                    audioArray[i] -= 65536;
                }
            }
            
            // Convert PCM to WAV format with proper sample rate
            const wavBuffer = pcmToWav(audioArray, 24000); // Google ADK typically uses 24kHz
            const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Display audio message if we don't have one yet
            if (!currentMessageId) {
                currentMessageId = 'msg_' + Date.now();
                displayMessage('🔊 Playing audio response...', 'agent', currentMessageId);
            }
            
            // Create and play audio element
            const audio = new Audio(audioUrl);
            audio.volume = 0.8; // Set reasonable volume
            
            audio.onloadstart = () => {
                console.log("Audio loading started");
            };
            
            audio.oncanplay = () => {
                console.log("Audio can start playing");
            };
            
            audio.play().then(() => {
                console.log("Audio playing successfully");
                // Update message to show it's playing
                const messageElement = document.getElementById(currentMessageId);
                if (messageElement) {
                    const contentElement = messageElement.querySelector('.message-content');
                    contentElement.textContent = '🔊 Audio response';
                }
            }).catch(error => {
                console.error("Error playing audio:", error);
                // Fallback: show text indicator
                const messageElement = document.getElementById(currentMessageId);
                if (messageElement) {
                    const contentElement = messageElement.querySelector('.message-content');
                    contentElement.textContent = '🔊 Audio response (playback failed - check browser audio permissions)';
                }
            });
            
            // Clean up URL after playing
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                const messageElement = document.getElementById(currentMessageId);
                if (messageElement) {
                    const contentElement = messageElement.querySelector('.message-content');
                    contentElement.textContent = '🔊 Audio response (completed)';
                }
            };
            
        } catch (error) {
            console.error("Error processing audio:", error);
            displayMessage('🔊 Audio response (processing failed)', 'agent');
        }
        
        // Don't return here - allow text to also be processed for dual responses
    }
    
    if (message.mime_type === "text/plain") {
        hideTypingIndicator();
        
        // If we already have an audio message showing, update it to show text as well
        if (currentMessageId) {
            const messageElement = document.getElementById(currentMessageId);
            if (messageElement && messageElement.querySelector('.message-content').textContent.includes('🔊')) {
                // This is an audio message, add text to it
                const contentElement = messageElement.querySelector('.message-content');
                const currentText = contentElement.textContent;
                if (currentText.includes('Audio response')) {
                    // Replace audio indicator with combined indicator
                    contentElement.innerHTML = `
                        <div class="dual-response">
                            <span class="audio-indicator">🔊 Audio</span>
                            <span class="text-content">${message.data}</span>
                        </div>
                    `;
                } else {
                    // Just append text
                    const textSpan = contentElement.querySelector('.text-content');
                    if (textSpan) {
                        textSpan.textContent += message.data;
                    }
                }
            } else {
                // Regular text append
                const contentElement = messageElement.querySelector('.message-content');
                contentElement.textContent += message.data;
            }
        } else {
            // Create new message for text only
            currentMessageId = 'msg_' + Date.now();
            displayMessage(message.data, 'agent', currentMessageId);
        }
        
        // Scroll to bottom
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }
}

async function sendMessage(message) {
    try {
        const response = await fetch(send_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log("[CLIENT TO AGENT]", message.mime_type, message.data.substring(0, 50));
        
    } catch (error) {
        console.error('Error sending message:', error);
        showError('Failed to send message. Please try again.');
        hideTypingIndicator();
    }
}

// UI Helper Functions
function displayMessage(content, sender, messageId = null) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;
    if (messageId) {
        messageElement.id = messageId;
    }
    
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    contentElement.textContent = content;
    
    const timeElement = document.createElement('div');
    timeElement.className = 'message-time';
    timeElement.textContent = new Date().toLocaleTimeString();
    
    messageElement.appendChild(contentElement);
    messageElement.appendChild(timeElement);
    
    // Insert before typing indicator
    messagesArea.insertBefore(messageElement, typingIndicator);
    
    // Scroll to bottom
    messagesArea.scrollTop = messagesArea.scrollHeight;
    
    return messageElement;
}

function displayImageMessage(imageSrc, sender) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;
    
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    
    const imageElement = document.createElement('img');
    imageElement.src = imageSrc;
    imageElement.className = 'image-preview';
    imageElement.alt = 'Uploaded image';
    
    const textElement = document.createElement('div');
    textElement.textContent = 'Image uploaded for analysis';
    textElement.style.marginTop = '10px';
    
    contentElement.appendChild(imageElement);
    contentElement.appendChild(textElement);
    
    const timeElement = document.createElement('div');
    timeElement.className = 'message-time';
    timeElement.textContent = new Date().toLocaleTimeString();
    
    messageElement.appendChild(contentElement);
    messageElement.appendChild(timeElement);
    
    // Insert before typing indicator
    messagesArea.insertBefore(messageElement, typingIndicator);
    
    // Scroll to bottom
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function showTypingIndicator() {
    typingIndicator.classList.add('active');
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function hideTypingIndicator() {
    typingIndicator.classList.remove('active');
}

function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    messagesArea.insertBefore(errorElement, typingIndicator);
    messagesArea.scrollTop = messagesArea.scrollHeight;
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (errorElement.parentNode) {
            errorElement.parentNode.removeChild(errorElement);
        }
    }, 5000);
}

function updateConnectionStatus(status) {
    switch(status) {
        case 'connected':
            connectionStatus.classList.remove('disconnected');
            connectionText.textContent = 'Connected';
            break;
        case 'disconnected':
            connectionStatus.classList.add('disconnected');
            connectionText.textContent = 'Disconnected';
            sendBtn.disabled = true;
            break;
        case 'connecting':
            connectionStatus.classList.add('disconnected');
            connectionText.textContent = 'Connecting...';
            sendBtn.disabled = true;
            break;
    }
}

// Utility functions
function base64ToArray(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Export for potential module usage
export {
    connectSSE,
    sendMessage,
    displayMessage,
    showError,
    updateConnectionStatus
};
