/**
 * Additional utilities and enhancements for the Farmer AI interface
 */

// Language support
const SUPPORTED_LANGUAGES = {
    'en': 'English',
    'hi': 'हिंदी',
    'pa': 'ਪੰਜਾਬੀ',
    'mr': 'मराठी',
    'ta': 'தமிழ்',
    'te': 'తెలుగు',
    'kn': 'ಕನ್ನಡ',
    'gu': 'ગુજરાતી',
    'bn': 'বাংলা'
};

// Farming quick suggestions
const QUICK_SUGGESTIONS = {
    'crop_planning': [
        'Plan crops for 5-acre farm with soil test N:80, P:60, K:70',
        'Best crops for kharif season in Punjab',
        'मेरी मिट्टी के लिए कौन सी फसल अच्छी है?',
        'Organic farming recommendations for tomatoes'
    ],
    'disease_diagnosis': [
        'My tomato plants have yellow spots on leaves',
        'What disease is affecting my wheat crop?',
        'मेरी फसल में कीट लग गए हैं',
        'Brown patches on rice leaves'
    ],
    'government_schemes': [
        'Government loans for small farmers',
        'PM-KISAN scheme benefits',
        'किसान क्रेडिट कार्ड कैसे बनवाएं?',
        'Crop insurance schemes in Maharashtra'
    ],
    'market_info': [
        'Create contract for wheat harvest - 50 quintals, April 2025',
        'Current market rates for onions',
        'मंडी में टमाटर का भाव क्या है?',
        'Export opportunities for basmati rice'
    ]
};

// Initialize quick suggestions
function initializeQuickSuggestions() {
    const container = document.createElement('div');
    container.className = 'quick-suggestions';
    container.innerHTML = `
        <div class="suggestions-header">
            <h4>💡 Quick Suggestions</h4>
            <button class="toggle-suggestions" onclick="toggleSuggestions()">−</button>
        </div>
        <div class="suggestions-content" id="suggestionsContent">
            ${generateSuggestionButtons()}
        </div>
    `;
    
    // Insert after input area
    const inputArea = document.querySelector('.input-area');
    inputArea.parentNode.insertBefore(container, inputArea.nextSibling);
}

function generateSuggestionButtons() {
    let html = '';
    Object.entries(QUICK_SUGGESTIONS).forEach(([category, suggestions]) => {
        html += `<div class="suggestion-category">`;
        html += `<h5>${category.replace('_', ' ').toUpperCase()}</h5>`;
        suggestions.forEach(suggestion => {
            html += `<button class="suggestion-btn" onclick="useSuggestion('${suggestion.replace(/'/g, "\\'")}')">${suggestion}</button>`;
        });
        html += `</div>`;
    });
    return html;
}

function useSuggestion(suggestion) {
    const messageInput = document.getElementById('messageInput');
    messageInput.value = suggestion;
    messageInput.focus();
    handleInputChange();
}

function toggleSuggestions() {
    const content = document.getElementById('suggestionsContent');
    const toggle = document.querySelector('.toggle-suggestions');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.textContent = '−';
    } else {
        content.style.display = 'none';
        toggle.textContent = '+';
    }
}

// Add keyboard shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to send message
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSendMessage();
        }
        
        // Ctrl/Cmd + M to toggle microphone
        if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
            e.preventDefault();
            toggleRecording();
        }
        
        // Ctrl/Cmd + I to upload image
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault();
            document.getElementById('fileInput').click();
        }
        
        // Escape to clear input
        if (e.key === 'Escape') {
            const messageInput = document.getElementById('messageInput');
            messageInput.value = '';
            handleInputChange();
            messageInput.focus();
        }
    });
}

// Add copy functionality to messages
function addCopyFunctionality() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('copy-btn')) {
            const messageContent = e.target.parentNode.querySelector('.message-content').textContent;
            navigator.clipboard.writeText(messageContent).then(() => {
                showToast('Message copied to clipboard');
            });
        }
    });
}

// Toast notification system
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// Enhanced message display with copy button
function displayEnhancedMessage(content, sender, messageId = null) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;
    if (messageId) {
        messageElement.id = messageId;
    }
    
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    contentElement.textContent = content;
    
    const actionsElement = document.createElement('div');
    actionsElement.className = 'message-actions';
    
    if (sender === 'agent') {
        actionsElement.innerHTML = `
            <button class="copy-btn" title="Copy message">📋</button>
            <button class="speak-btn" title="Speak message" onclick="speakMessage('${content.replace(/'/g, "\\'")}')">🔊</button>
        `;
    }
    
    const timeElement = document.createElement('div');
    timeElement.className = 'message-time';
    timeElement.textContent = new Date().toLocaleTimeString();
    
    messageElement.appendChild(contentElement);
    messageElement.appendChild(actionsElement);
    messageElement.appendChild(timeElement);
    
    return messageElement;
}

// Text-to-speech functionality
function speakMessage(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        // Try to use a Hindi voice if available
        const voices = speechSynthesis.getVoices();
        const hindiVoice = voices.find(voice => voice.lang.includes('hi'));
        if (hindiVoice) {
            utterance.voice = hindiVoice;
        }
        
        speechSynthesis.speak(utterance);
    } else {
        showToast('Text-to-speech not supported in this browser', 'error');
    }
}

// Auto-detect language
function detectLanguage(text) {
    // Simple Hindi detection
    const hindiPattern = /[\u0900-\u097F]/;
    if (hindiPattern.test(text)) {
        return 'hi';
    }
    
    // Default to English
    return 'en';
}

// Initialize enhanced features
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initializeQuickSuggestions();
        initializeKeyboardShortcuts();
        addCopyFunctionality();
        
        // Add help tooltip
        addHelpTooltip();
        
        console.log('Enhanced features initialized');
    }, 1000);
});

function addHelpTooltip() {
    const helpButton = document.createElement('button');
    helpButton.className = 'help-button';
    helpButton.innerHTML = '❓';
    helpButton.title = 'Keyboard Shortcuts & Help';
    helpButton.onclick = showHelpDialog;
    
    document.body.appendChild(helpButton);
}

function showHelpDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'help-dialog';
    dialog.innerHTML = `
        <div class="help-content">
            <h3>🌾 Farmer AI Assistant Help</h3>
            
            <h4>💬 How to Chat</h4>
            <ul>
                <li>Type your questions in Hindi or English</li>
                <li>Upload crop photos for disease diagnosis</li>
                <li>Use voice input for hands-free interaction</li>
            </ul>
            
            <h4>⌨️ Keyboard Shortcuts</h4>
            <ul>
                <li><kbd>Ctrl/Cmd + Enter</kbd> - Send message</li>
                <li><kbd>Ctrl/Cmd + M</kbd> - Toggle microphone</li>
                <li><kbd>Ctrl/Cmd + I</kbd> - Upload image</li>
                <li><kbd>Escape</kbd> - Clear input</li>
            </ul>
            
            <h4>🛠️ Available Tools</h4>
            <ul>
                <li>🌱 AI Crop Planning</li>
                <li>🔬 Disease Diagnosis</li>
                <li>📈 Contract Farming</li>
                <li>🏛️ Government Schemes</li>
                <li>💧 NPK Management</li>
            </ul>
            
            <button onclick="this.parentNode.parentNode.remove()">Close</button>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Close on click outside
    dialog.addEventListener('click', function(e) {
        if (e.target === dialog) {
            dialog.remove();
        }
    });
}

// Export enhanced functions
window.farmerAIUtils = {
    useSuggestion,
    toggleSuggestions,
    speakMessage,
    showToast,
    detectLanguage,
    showHelpDialog
};
