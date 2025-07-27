# 🌾 KIRMADA AgriAI - Comprehensive Agricultural Intelligence Platform

**Empowering Farmers through Contract Farming, AI-Powered Decision Making, and Digital Marketplace Solutions**

## 🚀 Project Overview

KIRMADA AgriAI is a comprehensive agricultural technology platform that bridges the gap between farmers and buyers through AI-powered tools, contract farming solutions, and intelligent crop management systems. The platform provides end-to-end solutions for modern agriculture including crop planning, disease detection, marketplace connections, and financial planning.

### 🎯 Mission
To revolutionize agriculture through:
- **AI-Powered Decision Making**: ML models for crop recommendations and disease detection
- **Contract Farming**: Direct farmer-buyer connections with transparent bidding
- **Multi-Modal Accessibility**: Web portals, WhatsApp integration, and voice support
- **Financial Inclusion**: Government scheme integration and ROI planning

## 📁 Project Structure

```
kirmada_agriAi/
├── adk_agriAi/                          # Google ADK Multi-Agent System
├── buyer-aid-portal-main/               # Buyer Web Portal (React + FastAPI)
├── farmer-aid-portal-main/              # Farmer Web Portal (React + FastAPI)
├── farmer-vertex-ai/                    # WhatsApp AI Bot with ML Models
├── plant_disease_prediction_cnn_image_classifier.ipynb  # ML Model Training
└── README.md                            # This comprehensive guide
```

---

<img width="1320" height="1684" alt="diagram-export-27-07-2025-11_48_28" src="https://github.com/user-attachments/assets/4ff9c761-c57c-4ffa-97de-1f6bde82b02e" />


## 🏗️ Module Overview

### 1. 🤖 ADK AgriAI (`adk_agriAi/`)
**Google Agent Development Kit Multi-Agent System**

**Purpose**: Sophisticated AI agent architecture with specialized sub-agents for different agricultural domains.

**Key Features**:
- **Multi-Agent Architecture**: Coordinator + 5 specialist agents
- **ML Integration**: RandomForest crop recommendations, CNN disease detection
- **Firestore Integration**: Campaign and contract management
- **Intelligent Routing**: Context-aware agent selection

**Agents**:
- **Crop Planning Agent**: Soil analysis and crop recommendations
- **Plant Health Agent**: Disease diagnosis and treatment
- **Campaign Management Agent**: Contract farming marketplace
- **Government Schemes Agent**: Subsidies and financial assistance
- **NPK Management Agent**: Fertilizer recommendations

### 2. 🛒 Buyer Aid Portal (`buyer-aid-portal-main/`)
**Web Platform for Agricultural Buyers**

**Frontend** (React + TypeScript + Vite):
- **Campaign Management**: View and create purchase requests
- **Bidding System**: Real-time bid management and negotiations
- **Contract Generation**: AI-powered contract creation with legal templates
- **Market Analytics**: Price trends and supplier performance
- **AgriSangh Community**: Collaborative farming platform

**Backend** (FastAPI + Firestore):
- **RESTful APIs**: Campaign, bid, contract, and order management
- **Real-time Sync**: Cross-platform data synchronization
- **Document Generation**: PDF contract generation
- **Authentication**: User session management

### 3. 🚜 Farmer Aid Portal (`farmer-aid-portal-main/`)
**Web Platform for Farmers**

**Frontend** (React + TypeScript + Vite):
- **Campaign Creation**: List crops for contract farming
- **Bid Management**: Respond to buyer requests and counter-offers
- **Contract Tracking**: Monitor agreement progress and payments
- **Government Schemes**: Access to subsidies and financial aid
- **AgriSangh Community**: Farmer collaboration and resource sharing

**Backend** (FastAPI + Firestore):
- **Unified API**: Complete farmer service endpoints
- **Data Validation**: Pydantic models for type safety
- **Cross-Platform Sync**: Automatic contract synchronization

### 4. 📱 WhatsApp AI Bot (`farmer-vertex-ai/`)
**Multilingual Conversational AI with ML Models**

**Features**:
- **Multilingual Support**: English, Hindi, Kannada
- **Voice Processing**: Whisper STT + gTTS TTS
- **Image Analysis**: CNN-based plant disease detection
- **Crop Planning**: RandomForest-based recommendations
- **Campaign Management**: Firestore integration for contract farming
- **Financial Planning**: ROI calculations and investment analysis

**ML Models**:
- **Disease Detection**: TensorFlow CNN model for plant disease identification
- **Crop Recommendation**: RandomForest model for soil-based suggestions
- **Audio Processing**: Whisper for multilingual speech recognition

### 5. 📊 ML Model Training (`plant_disease_prediction_cnn_image_classifier.ipynb`)
**Jupyter Notebook for Plant Disease Detection Model**

**Purpose**: Training and evaluation of CNN models for plant disease classification.

---

## 🛠️ Installation & Setup

### Prerequisites
- **Python 3.8+**
- **Node.js 16+** 
- **Google Cloud Project** with Firestore enabled
- **Firebase Service Account Key**
- **Twilio Account** (for WhatsApp integration)

### 🚀 Quick Start Guide

#### 1. Clone Repository
```bash
git clone <repository-url>
cd kirmada_agriAi
```

#### 2. Set Up Environment Variables
Create `.env` files in respective directories:

**For WhatsApp Bot (`farmer-vertex-ai/.env`)**:
```env
GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceKey.json
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**For Web Portals (both `buyer-aid-portal-main/backend/.env` and `farmer-aid-portal-main/backend/.env`)**:
```env
FIREBASE_SERVICE_ACCOUNT_KEY=path/to/serviceAccountKey.json
GOOGLE_CLOUD_PROJECT=your-project-id
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
```

---

## 📋 Module-Specific Installation

### 🤖 ADK AgriAI Setup

```bash
cd adk_agriAi

# Install dependencies
pip install -r requirements.txt

# Set up Firebase credentials
cp path/to/serviceKey.json serviceKey.json

# Run the agent
python agent.py
```

**Test Queries**:
- "I want to plan wheat cultivation for this rabi season"
- "My tomato plants are showing yellow spots on leaves"
- "What government schemes can help me get a loan?"
- "I want to create a contract farming campaign"

### 🛒 Buyer Portal Setup

**Backend Setup**:
```bash
cd buyer-aid-portal-main/backend

# Install Python dependencies
pip install -r requirements.txt

# Set up Firebase
cp path/to/serviceAccountKey.json serviceAccountKey.json

# Seed sample data (optional)
python seed_data.py

# Start backend server
python run.py
# Server runs on: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

**Frontend Setup**:
```bash
cd buyer-aid-portal-main

# Install Node dependencies
npm install

# Start development server
npm run dev
# Frontend runs on: http://localhost:8082
```

### 🚜 Farmer Portal Setup

**Backend Setup**:
```bash
cd farmer-aid-portal-main/backend

# Install Python dependencies
pip install -r requirements.txt

# Set up Firebase
cp path/to/serviceAccountKey.json serviceAccountKey.json

# Seed sample data (optional)
python seed_data.py

# Start backend server
python run.py
# Server runs on: http://localhost:8001
# API Docs: http://localhost:8001/docs
```

**Frontend Setup**:
```bash
cd farmer-aid-portal-main

# Install Node dependencies
npm install

# Start development server
npm run dev
# Frontend runs on: http://localhost:8081
```

### 📱 WhatsApp AI Bot Setup

```bash
cd farmer-vertex-ai

# Install dependencies
pip install -r requirements.txt

# Set up Firebase and Twilio credentials
cp path/to/serviceKey.json serviceKey.json
# Configure .env file with Twilio credentials

# Start WhatsApp bot
python whatsapp.py
# Bot runs on: http://localhost:8000
# Status page: http://localhost:8000/
```

**WhatsApp Setup**:
1. Get Twilio WhatsApp Sandbox number: +1 415 523 8886
2. Send "join farmer-lead" to the number
3. Start chatting with the AI bot

**Supported Features**:
- **Text Commands**: "hi", "help", "create campaign", "crop recommendations"
- **Image Analysis**: Send plant photos for disease detection
- **Voice Messages**: Multilingual voice command processing
- **Language Support**: English, Hindi, Kannada

---

## 🔗 API Endpoints

### Buyer Portal APIs (Port 8000)
```
GET  /api/campaigns/          # List all campaigns
POST /api/campaigns/          # Create new campaign
GET  /api/bids/{campaign_id}  # Get bids for campaign
POST /api/bids/               # Create bid
PUT  /api/bids/{id}/action    # Accept/reject bid
GET  /api/contracts/          # List contracts
GET  /api/orders/             # List orders
```

### Farmer Portal APIs (Port 8001)
```
GET  /api/campaigns/          # List campaigns
POST /api/campaigns/          # Create farmer campaign
GET  /api/contracts/          # List farmer contracts
GET  /api/orders/             # List farmer orders
POST /api/bids/               # Submit bid
```

### WhatsApp Bot APIs (Port 8000)
```
POST /webhook                 # WhatsApp message handler
GET  /                        # Bot status and documentation
GET  /health                  # Health check
GET  /stats                   # Bot usage statistics
```

---

## 🎯 Usage Examples

### Contract Farming Workflow

1. **Farmer Creates Campaign** (via Web or WhatsApp):
   ```
   Title: "Premium Wheat Harvest 2025"
   Crop: Wheat, Premium Winter Wheat
   Location: Punjab, India
   Duration: Oct 2024 - Apr 2025
   Estimated Yield: 4.2 tons/hectare
   Minimum Price: ₹25,000/ton
   ```

2. **Buyer Views & Bids** (via Buyer Portal):
   - Browse active campaigns
   - Submit competitive bids
   - Negotiate terms and pricing

3. **Contract Generation** (Automatic):
   - AI-powered contract creation
   - Legal templates with payment schedules
   - Quality assurance clauses
   - Insurance and risk management

4. **Progress Tracking** (Both Platforms):
   - Milestone-based payments (25% + 25% + 40% + 10%)
   - Quality check integration
   - Delivery confirmation

### AI-Powered Features

#### Crop Recommendation (via WhatsApp/Web):
```
Input: N=80, P=40, K=50, pH=6.5, Area=5 acres
Output: 
🌱 Top 3 Crop Recommendations:
1. Rice 🥇
2. Wheat 🥈  
3. Cotton 🥉
```

#### Disease Detection (via WhatsApp Image):
```
Send plant photo → 
🤖 ML Detection: Tomato Late Blight

🔍 Symptoms to Watch:
• Dark brown/black spots on leaves
• White fungal growth on leaf undersides
• Rapid spread in humid conditions

⚡ Immediate Actions:
• Remove affected leaves immediately
• Apply copper-based fungicide
• Improve air circulation

🛡️ Prevention: Avoid overhead watering
```

#### Financial Planning:
```
Crop: Tomato, Area: 2 acres
💰 Investment: ₹85,000
📈 Revenue: ₹1,20,000  
📊 ROI: 41.2%
📋 Summary: High-value crop with good market demand
```

---

## 🔧 Technical Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Lucide React** for icons

### Backend Stack
- **FastAPI** for REST APIs
- **Google Firestore** for database
- **Pydantic** for data validation
- **CORS** middleware for cross-origin requests

### AI/ML Stack
- **Google Gemini 2.5 Pro** for LLM processing
- **LangChain** for agent orchestration
- **TensorFlow** for CNN disease detection
- **Scikit-learn** for RandomForest crop recommendations
- **Whisper** for speech-to-text
- **gTTS** for text-to-speech

### Integration Stack
- **Twilio** for WhatsApp messaging
- **Firebase Admin SDK** for Firestore operations
- **Google ADK** for multi-agent systems

---

## 📊 Database Schema

### Campaigns Collection
```json
{
  "title": "Premium Wheat Harvest 2024",
  "crop": "Wheat",
  "cropType": "Premium Winter Wheat", 
  "location": "North Field, Punjab",
  "duration": "Oct 2024 - Apr 2025",
  "status": "active",
  "estimatedYield": "4.2 tons/hectare",
  "minimumQuotation": "₹25,000/ton",
  "currentBid": "₹28,500/ton",
  "totalBids": 12,
  "userType": "farmer",
  "userId": "farmer123",
  "createdAt": "2024-12-20T...",
  "updatedAt": "2024-12-20T..."
}
```

### Contracts Collection
```json
{
  "title": "Wheat Supply Contract - ABC Mills",
  "crop": "Wheat",
  "agreedPrice": "₹47,500/ton",
  "farmerId": "farmer123", 
  "buyerId": "buyer456",
  "farmerName": "Suresh Patel",
  "buyerName": "Global Foods Inc",
  "status": "active",
  "contractStatus": "active",
  "currentStage": "planting",
  "originalBidId": "bid789",
  "createdAt": "2024-12-20T...",
  "updatedAt": "2024-12-20T..."
}
```

### Bids Collection
```json
{
  "campaignId": "campaign123",
  "bidderType": "farmer",
  "bidderId": "farmer123", 
  "bidderName": "Suresh Patel",
  "bidAmount": "₹28,500/ton",
  "quantity": "4.2 tons",
  "qualityGrade": "Premium A",
  "deliveryTerms": "Farm pickup",
  "status": "pending",
  "createdAt": "2024-12-20T...",
  "updatedAt": "2024-12-20T..."
}
```

---

## 🌐 Deployment

### Local Development
```bash
# Start all services
# Terminal 1: Buyer Backend
cd buyer-aid-portal-main/backend && python run.py

# Terminal 2: Farmer Backend  
cd farmer-aid-portal-main/backend && python run.py

# Terminal 3: Buyer Frontend
cd buyer-aid-portal-main && npm run dev

# Terminal 4: Farmer Frontend
cd farmer-aid-portal-main && npm run dev

# Terminal 5: WhatsApp Bot
cd farmer-vertex-ai && python whatsapp.py

# Terminal 6: ADK Agent
cd adk_agriAi && python agent.py
```

### Production Deployment
- **Frontend**: Deploy to Vercel/Netlify
- **Backend**: Deploy to Google Cloud Run/AWS Lambda
- **WhatsApp Bot**: Deploy to Cloud Functions with persistent storage
- **Database**: Google Firestore (production instance)

---

## 🧪 Testing

### API Testing
```bash
# Test buyer portal API
curl http://localhost:8000/api/campaigns/

# Test farmer portal API  
curl http://localhost:8001/api/campaigns/

# Test WhatsApp bot health
curl http://localhost:8000/health
```

### WhatsApp Bot Testing
1. Send "hi" to +1 415 523 8886
2. Join with: "join farmer-lead"
3. Test commands:
   - "crop recommendations"
   - "create campaign"
   - Send plant image for disease detection
   - Send voice message in Hindi/Kannada

### Web Portal Testing
1. **Buyer Portal**: http://localhost:8082
2. **Farmer Portal**: http://localhost:8081
3. Create campaigns, submit bids, generate contracts

---

## 📈 Features

### ✅ Core Features
- **Multi-Platform Access**: Web portals + WhatsApp bot
- **AI-Powered Crop Planning**: ML-based recommendations
- **Disease Detection**: CNN model for plant health analysis
- **Contract Farming**: End-to-end marketplace solution
- **Real-time Bidding**: Live bid management and negotiations
- **Multilingual Support**: English, Hindi, Kannada
- **Voice Integration**: Speech-to-text and text-to-speech
- **Government Schemes**: Subsidy and loan information
- **Financial Planning**: ROI calculations and investment analysis

### 🚧 Advanced Features
- **AgriSangh Community**: Farmer collaboration platform
- **Smart Contracts**: Blockchain integration (planned)
- **IoT Integration**: Sensor data for precision farming
- **Weather Integration**: Real-time weather-based recommendations
- **Market Analytics**: Price prediction and trend analysis
- **Quality Assurance**: AI-powered produce grading

---

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards
- **Python**: Follow PEP 8, use type hints
- **TypeScript**: Use strict mode, proper typing
- **API Design**: RESTful conventions, proper HTTP codes
- **Documentation**: Comprehensive docstrings and comments

---

## 📞 Support & Contact

### Technical Support
- **Issues**: GitHub Issues for bug reports
- **Documentation**: In-code documentation and README files
- **API Documentation**: FastAPI auto-generated docs at `/docs`

### Getting Help
1. **WhatsApp Bot**: Send "help" command for available features
2. **Web Portals**: In-app help sections and tooltips
3. **API Testing**: Use interactive documentation at `/docs` endpoints

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Cloud Platform** for AI/ML services and Firestore
- **Twilio** for WhatsApp Business API integration
- **OpenAI Whisper** for multilingual speech recognition
- **LangChain** for AI agent orchestration
- **FastAPI** for high-performance backend APIs
- **React Ecosystem** for modern frontend development

---

**🌾 KIRMADA AgriAI - Transforming Agriculture Through Technology**

*Empowering farmers, connecting markets, and building sustainable agricultural ecosystems through AI-powered solutions.*
