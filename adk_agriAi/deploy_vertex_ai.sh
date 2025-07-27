#!/bin/bash

# Farmer AI - Vertex AI Agent Engine Deployment Script
# This script deploys your Farmer AI agent to Vertex AI Agent Engine with default ADK web UI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🌾 Farmer AI - Vertex AI Agent Engine Deployment${NC}"
echo "=================================================="

# Check if required environment variables are set
check_env_vars() {
    echo -e "${YELLOW}Checking environment variables...${NC}"
    
    if [ -z "$GOOGLE_CLOUD_PROJECT" ]; then
        echo -e "${RED}❌ GOOGLE_CLOUD_PROJECT environment variable is not set${NC}"
        echo "Please set it with: export GOOGLE_CLOUD_PROJECT='your-project-id'"
        exit 1
    fi
    
    if [ -z "$GOOGLE_CLOUD_LOCATION" ]; then
        echo -e "${YELLOW}⚠️  GOOGLE_CLOUD_LOCATION not set, defaulting to us-central1${NC}"
        export GOOGLE_CLOUD_LOCATION="us-central1"
    fi
    
    if [ -z "$STAGING_BUCKET" ]; then
        echo -e "${YELLOW}⚠️  STAGING_BUCKET not set. Creating one...${NC}"
        BUCKET_NAME="${GOOGLE_CLOUD_PROJECT}-farmer-ai-staging"
        export STAGING_BUCKET="gs://${BUCKET_NAME}"
        echo -e "${BLUE}📦 Will create staging bucket: ${STAGING_BUCKET}${NC}"
    fi
    
    echo -e "${GREEN}✅ Project: $GOOGLE_CLOUD_PROJECT${NC}"
    echo -e "${GREEN}✅ Location: $GOOGLE_CLOUD_LOCATION${NC}"
    echo -e "${GREEN}✅ Staging Bucket: $STAGING_BUCKET${NC}"
}

# Check if gcloud is installed and authenticated
check_gcloud() {
    echo -e "${YELLOW}Checking Google Cloud CLI...${NC}"
    
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}❌ gcloud CLI is not installed${NC}"
        echo "Please install it from: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 > /dev/null; then
        echo -e "${RED}❌ No active gcloud authentication found${NC}"
        echo "Please run: gcloud auth login"
        exit 1
    fi
    
    echo -e "${GREEN}✅ gcloud CLI is installed and authenticated${NC}"
    
    # Set the project
    gcloud config set project $GOOGLE_CLOUD_PROJECT
}

# Enable required APIs
enable_apis() {
    echo -e "${YELLOW}Enabling required Google Cloud APIs...${NC}"
    
    gcloud services enable aiplatform.googleapis.com
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable storage.googleapis.com
    gcloud services enable compute.googleapis.com
    
    echo -e "${GREEN}✅ APIs enabled${NC}"
}

# Create staging bucket if it doesn't exist
create_staging_bucket() {
    echo -e "${YELLOW}Setting up staging bucket...${NC}"
    
    BUCKET_NAME=$(echo $STAGING_BUCKET | sed 's/gs:\/\///')
    
    if gsutil ls "$STAGING_BUCKET" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Staging bucket already exists: $STAGING_BUCKET${NC}"
    else
        echo -e "${YELLOW}📦 Creating staging bucket: $STAGING_BUCKET${NC}"
        gsutil mb -p $GOOGLE_CLOUD_PROJECT -c STANDARD -l $GOOGLE_CLOUD_LOCATION "$STAGING_BUCKET"
        echo -e "${GREEN}✅ Staging bucket created${NC}"
    fi
}

# Install required Python packages
install_requirements() {
    echo -e "${YELLOW}Installing Vertex AI SDK and dependencies...${NC}"
    
    # Check if virtual environment exists
    if [ ! -d "farmer_ai_env" ]; then
        echo -e "${YELLOW}Creating virtual environment...${NC}"
        python3 -m venv farmer_ai_env
    fi
    
    # Activate virtual environment
    source farmer_ai_env/bin/activate
    
    # Install Vertex AI SDK with Agent Engine support
    pip install --upgrade pip
    pip install "google-cloud-aiplatform[adk,agent_engines]" cloudpickle
    
    # Install existing requirements
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
    fi
    
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Deploy the agent
deploy_agent() {
    echo -e "${YELLOW}Deploying Farmer AI agent to Vertex AI Agent Engine...${NC}"
    
    # Activate virtual environment
    source farmer_ai_env/bin/activate
    
    # Set environment variables for the Python script
    export GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT
    export GOOGLE_CLOUD_LOCATION=$GOOGLE_CLOUD_LOCATION
    export STAGING_BUCKET=$STAGING_BUCKET
    
    # Run the deployment script
    python deploy_agent_engine.py
    
    echo -e "${GREEN}✅ Deployment script executed${NC}"
}

# Main deployment flow
main() {
    check_env_vars
    check_gcloud
    enable_apis
    create_staging_bucket
    install_requirements
    deploy_agent
    
    echo ""
    echo -e "${GREEN}🎉 Deployment Process Complete!${NC}"
    echo "================================"
    echo -e "${BLUE}🌐 Access your agent through the Vertex AI Agent Engine UI:${NC}"
    echo "   https://console.cloud.google.com/vertex-ai/agents/agent-engines"
    echo ""
    echo -e "${BLUE}📝 What you can do next:${NC}"
    echo "1. Open the Agent Engine console to see your deployed agent"
    echo "2. Use the built-in web UI to interact with your agent"
    echo "3. Create sessions and test your farmer AI assistant"
    echo "4. Monitor performance and usage in the console"
    echo ""
    echo -e "${YELLOW}💡 The default ADK web UI provides:${NC}"
    echo "• Session management"
    echo "• Interactive chat interface"
    echo "• Execution details and tracing"
    echo "• Performance monitoring"
}

# Run the deployment
main "$@"
