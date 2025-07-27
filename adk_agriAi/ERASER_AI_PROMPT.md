# Eraser.ai Prompt for Farmer AI Architecture Diagram

## System Overview
Create a comprehensive system architecture diagram for "Farmer AI" - an intelligent agricultural assistant system built using Google's Agent Development Kit (ADK). The system features a unified AI agent that handles multimodal inputs (text, voice, images) and provides comprehensive farming solutions through various specialized tools.

## Architecture Layers (Top to Bottom)

### Layer 1: User Interface & Input Processing
**Components:**
- User Interface (web-based, mobile-friendly)
- Multimodal Input Processor with 4 input types:
  - Text Input Handler
  - Voice/Audio Input Handler  
  - Image Input Handler
  - Mixed Multimodal Input Handler

**Styling:** Use blue color scheme (#e1f5fe background, #01579b border)

### Layer 2: Core AI Agent
**Main Component:**
- Unified Farmer AI Agent (center, prominent)
  - Label: "unified_farmer_agent"
  - Model: "gemini-2.0-flash-exp"
  - Capabilities: "Multimodal LLM"

**Sub-component:**
- Disease Explanation Specialist (smaller, connected to main agent)
  - Label: "Sub-agent for complex disease cases"

**Styling:** Use purple color scheme (#f3e5f5 background, #4a148c border, thicker border)

### Layer 3: Tool Ecosystem (3 Categories Side by Side)

#### Category A: AI-Powered Tools
**Components:**
- AI Crop Planner
  - Description: "ML Model: RandomForest-2.pkl"
  - Function: "Soil-based recommendations"
- Crop Health Analyzer  
  - Description: "CNN Model: plant_disease_prediction_model.h5"
  - Function: "Plant disease detection"

**Styling:** Use green color scheme (#e8f5e8 background, #1b5e20 border)

#### Category B: Knowledge-Based Tools
**Components:**
- Government Schemes Tool
- NPK Management Tool
- Plant Health Diagnostic Tool  
- Crop Planning Tool

**Styling:** Use orange color scheme (#fff3e0 background, #e65100 border)

#### Category C: Database Tools
**Components:**
- Create Campaign Tool
- Fetch Documents Tool
- Update Campaign Tool
- Create Bid Tool

**Styling:** Use pink color scheme (#fce4ec background, #880e4f border)

### Layer 4: External Data Sources
**Components (3 cylinders/databases):**
- Firestore Database
  - Content: "Campaigns, Bids, Documents"
  - Icon: Database cylinder
- ML Models Repository
  - Content: "Disease Detection Models, Crop Planning Models"
  - Icon: Brain/AI symbol
- Knowledge Base
  - Content: "Government Schemes, NPK Data, Farming Best Practices"
  - Icon: Book/Library symbol

**Styling:** Use light green color scheme (#f1f8e9 background, #33691e border)

### Layer 5: Response Generation
**Components:**
- Text Response Generator
- Voice Response Generator  
- Multimodal Response Generator
- Output Formatter (combines all responses)

**Styling:** Use light blue color scheme

### Layer 6: Deployment Options (Bottom)
**Components (3 deployment targets):**
- Vertex AI Agent Engine
  - Description: "Default ADK Web UI, Fully Managed"
  - Icon: Cloud
- Custom FastAPI Web App
  - Description: "web_app/main.py, Custom UI/UX"
  - Icon: Web application
- Google Cloud Run
  - Description: "Containerized, Auto-scaling"
  - Icon: Container

**Styling:** Use blue gradient (#e3f2fd background, #0d47a1 border)

## Connection Flow Specifications

### Input Flow (Top to Bottom):
1. User Interface → Multimodal Input Processor
2. Each input type → Unified Farmer AI Agent
3. Main Agent ↔ Disease Specialist (bidirectional for complex cases)

### Tool Execution Flow:
1. Unified Agent → All 10 tools (show all connections)
2. AI Tools → ML Models Repository
3. Knowledge Tools → Knowledge Base
4. Database Tools → Firestore Database

### Response Flow:
1. All tools → Unified Agent
2. Unified Agent → Response Generators
3. Response Generators → Output Formatter
4. Output Formatter → User Interface

### Deployment Connections:
- Show dotted lines from Core Agent to all 3 deployment options

## Visual Hierarchy & Layout
- **Vertical Layout:** 6 distinct layers flowing top to bottom
- **Grouping:** Use rounded rectangles to group related components
- **Emphasis:** Make the Unified AI Agent the central focal point (larger, prominent)
- **Tool Categories:** Arrange the 3 tool categories side by side in Layer 3
- **Data Sources:** Show as traditional database cylinders in Layer 4

## Labels & Annotations
- **System Title:** "Farmer AI - Agent Architecture"
- **Layer Labels:** Show each layer name clearly
- **Component Counts:** "10 Specialized Tools", "3 Data Sources", "3 Deployment Options"
- **Technology Stack:** Add small annotations for key technologies (ADK, Gemini, Firestore)

## Color Coding Legend
Include a legend showing:
- Blue: User Interface & Deployment
- Purple: Core AI Agent  
- Green: AI-Powered Components
- Orange: Knowledge-Based Components
- Pink: Database Operations
- Light Green: External Data

## Additional Visual Elements
- Use icons where appropriate (cloud, database, brain, tools)
- Show data flow with arrows (solid for primary flow, dotted for deployment)
- Add small badges showing "Multimodal", "AI-Powered", "Real-time"
- Include version/model information as small text under components

## Output Requirements
Generate a clean, professional architecture diagram that clearly shows:
1. The unified nature of the AI agent
2. The comprehensive tool ecosystem
3. The multimodal input capabilities  
4. The integration with external data sources
5. The flexible deployment options
6. The complete data flow from user input to response output

Make it suitable for technical documentation and stakeholder presentations.
