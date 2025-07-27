# Farmer AI Web Interface

A modern web interface for the Farmer AI Assistant that replicates the ADK web interface design and functionality. This application provides farmers with an intuitive chat interface to interact with the AI agent using text, voice, and image inputs.

## Features

### 🌟 Core Capabilities
- **Text Chat**: Natural language conversations in Hindi, English, and regional languages
- **Voice Input**: Real-time audio communication with the AI agent
- **Image Analysis**: Upload crop photos for disease detection and health assessment
- **Multimodal Input**: Combine text, voice, and images in conversations

### 🚀 Farming Tools Integration
- **AI Crop Planning**: Soil-based crop recommendations using machine learning
- **Disease Diagnosis**: Image-based plant disease detection with treatment suggestions
- **Contract Farming**: Create and manage farming campaigns for market opportunities
- **Government Schemes**: Access information about subsidies, loans, and support programs
- **NPK Management**: Soil test analysis and fertilizer recommendations

### 🎨 User Interface
- **ADK-Style Design**: Clean, professional interface matching Google ADK documentation
- **Responsive Layout**: Works on desktop, tablet, and mobile devices
- **Real-time Messaging**: Server-Sent Events (SSE) for live streaming responses
- **Connection Status**: Visual indicators for connection health
- **Typing Indicators**: Shows when AI is processing responses

## Project Structure

```
web_app/
├── main.py                 # FastAPI server with ADK integration
├── .env                   # Environment configuration
├── static/
│   ├── index.html        # Main web interface
│   └── js/
│       └── app.js        # JavaScript client application
└── README.md             # This file
```

## Installation & Setup

### 1. Prerequisites
- Python 3.9+
- Google AI Studio API key or Vertex AI setup
- All dependencies from parent `requirements.txt`

### 2. Install Dependencies
```bash
# From the main project directory
pip install -r requirements.txt
```

### 3. Configure Environment
Edit `web_app/.env` and add your Google API key:
```env
GOOGLE_API_KEY=your_actual_api_key_here
```

### 4. Run the Application
```bash
# Navigate to web app directory
cd web_app

# Start the server
python main.py
```

### 5. Access the Interface
Open your browser and navigate to:
```
http://localhost:8000
```

## API Endpoints

### Core Endpoints
- `GET /` - Main web interface
- `GET /events/{user_id}` - Server-Sent Events stream for real-time messaging
- `POST /send/{user_id}` - Send messages to the AI agent
- `GET /health` - Health check endpoint

### Message Format
All messages use a standardized JSON format:
```json
{
  "mime_type": "text/plain" | "audio/pcm" | "image/jpeg",
  "data": "base64_encoded_or_text_content"
}
```

## Usage Guide

### Text Conversations
1. Type your farming questions in the input field
2. Press Enter or click the send button
3. Receive real-time streaming responses from the AI

### Image Analysis
1. Click the camera icon or "Image" mode button
2. Select a crop/plant photo from your device
3. The AI will automatically analyze the image for diseases or health issues

### Voice Input
1. Click the microphone icon or "Audio" mode button
2. Allow microphone permissions when prompted
3. Speak your question and click stop when finished
4. The AI will process and respond with text (audio response capabilities available)

### Farming Tools
The AI automatically uses appropriate tools based on your questions:

- **"Plan crops for my 5-acre farm"** → Uses AI Crop Planner
- **"What disease is this?"** (with image) → Uses Disease Diagnosis
- **"Government schemes for small farmers"** → Uses Government Schemes tool
- **"My soil test shows N:80, P:60, K:70"** → Uses NPK Management
- **"Want to sell my wheat harvest"** → Uses Contract Farming tools

## Technical Architecture

### Backend (FastAPI + ADK)
- **FastAPI**: Modern Python web framework for API endpoints
- **Google ADK**: Agent Development Kit integration for AI agent management
- **SSE**: Server-Sent Events for real-time streaming
- **Session Management**: In-memory session storage with auto-cleanup

### Frontend (Vanilla JavaScript)
- **Responsive Design**: CSS Grid and Flexbox for adaptive layouts
- **Real-time Communication**: EventSource API for SSE connections
- **File Handling**: FileReader API for image uploads
- **Audio Processing**: MediaRecorder API for voice input

### AI Agent Integration
- **Unified Agent**: Single gemini-2.0-flash-exp model handles all inputs
- **Tool Integration**: Automatic tool selection based on query context
- **Multimodal Processing**: Text, voice, and image inputs supported natively

## Customization

### Styling
Modify `static/index.html` CSS variables to customize the appearance:
```css
:root {
  --primary-color: #2196F3;
  --background-color: #f5f5f5;
  --text-color: #333;
}
```

### Agent Configuration
Edit the agent settings in `main.py`:
```python
from agent import unified_farmer_agent

# The agent is already configured in agent.py
# Modify agent.py to change tools, instructions, or model
```

### Additional Features
Add new farming tools by:
1. Creating tool functions in `agent.py`
2. Adding them to the agent's tools list
3. The web interface will automatically support them

## Troubleshooting

### Common Issues

**Connection Problems**
- Check if the server is running on port 8000
- Verify your Google API key is valid
- Ensure firewall allows local connections

**Audio Not Working**
- Grant microphone permissions in browser
- Check browser compatibility (Chrome/Firefox recommended)
- Verify HTTPS for production deployments

**Image Upload Issues**
- Ensure images are under 10MB
- Use supported formats: JPG, PNG, WebP
- Check browser console for error messages

### Debug Mode
Enable debug logging by setting in `.env`:
```env
DEBUG=True
LOG_LEVEL=DEBUG
```

## Production Deployment

### Docker Deployment
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables for Production
```env
GOOGLE_API_KEY=your_production_api_key
DEBUG=False
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=["https://yourdomain.com"]
```

### Security Considerations
- Use HTTPS in production
- Implement rate limiting
- Add authentication for sensitive operations
- Validate all file uploads
- Use environment-specific API keys

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the Apache License 2.0 - see the main project LICENSE file for details.

## Support

For questions or support:
1. Check the troubleshooting section above
2. Review the main project documentation
3. Open an issue on the GitHub repository

---

**Note**: This web interface is designed to work seamlessly with the existing Farmer AI agent and provides a modern, user-friendly way to access all farming tools and capabilities through a web browser.
