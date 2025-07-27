# Farmer AI - Vertex AI Agent Engine Deployment Guide

This guide walks you through deploying your Farmer AI agent to Vertex AI Agent Engine, which provides a fully managed environment with the default ADK web UI.

## Prerequisites

1. **Google Cloud Project**: Ensure you have a Google Cloud project with billing enabled
2. **gcloud CLI**: Install and authenticate the Google Cloud CLI
3. **Python 3.9+**: Ensure you have Python 3.9 or higher installed

## Quick Deployment

### Step 1: Set Environment Variables

```bash
# Set your Google Cloud project ID
export GOOGLE_CLOUD_PROJECT="your-project-id"

# Set your preferred location (optional, defaults to us-central1)
export GOOGLE_CLOUD_LOCATION="us-central1"

# Set staging bucket (optional, will be auto-created)
export STAGING_BUCKET="gs://your-project-id-farmer-ai-staging"
```

### Step 2: Authenticate with Google Cloud

```bash
# Login to Google Cloud
gcloud auth login

# Set application default credentials
gcloud auth application-default login

# Set your project
gcloud config set project $GOOGLE_CLOUD_PROJECT
```

### Step 3: Run the Deployment Script

```bash
# Make sure you're in the farmer-ai-clean directory
cd /path/to/farmer-ai-clean

# Run the deployment script
./deploy_vertex_ai.sh
```

The script will:
- Check and enable required APIs
- Create a staging bucket if needed
- Install the Vertex AI SDK and dependencies
- Deploy your agent to Agent Engine
- Provide you with the console URL to access your agent

### Step 4: Access Your Agent

After deployment, you can access your agent through:
- **Vertex AI Console**: https://console.cloud.google.com/vertex-ai/agents/agent-engines
- **Default ADK Web UI**: Available directly in the Agent Engine interface

## Manual Deployment (Alternative)

If you prefer to deploy manually or need more control:

### Install Dependencies

```bash
# Install Vertex AI SDK
pip install "google-cloud-aiplatform[adk,agent_engines]" cloudpickle

# Install other requirements
pip install -r requirements.txt
```

### Deploy with Python Script

```bash
# Set environment variables
export GOOGLE_CLOUD_PROJECT="your-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"
export STAGING_BUCKET="gs://your-staging-bucket"

# Run deployment
python deploy_agent_engine.py
```

## What You Get

After deployment, your Farmer AI agent will be available with:

### Default ADK Web UI Features:
- **Interactive Chat Interface**: Test your agent directly in the browser
- **Session Management**: Create and manage user sessions
- **Execution Tracing**: See detailed execution logs and tool calls
- **Performance Monitoring**: Track response times and usage
- **Multi-turn Conversations**: Persistent conversation memory

### Agent Capabilities:
- Plant disease identification and treatment recommendations
- Crop management advice and scheduling
- Weather-based farming recommendations
- Soil health analysis and improvement suggestions
- Pest and disease management strategies
- Market insights and crop planning

## Monitoring and Management

### Access the Agent Engine Console:
1. Go to https://console.cloud.google.com/vertex-ai/agents/agent-engines
2. Select your deployed agent
3. Use the built-in interface to:
   - Test your agent
   - View execution logs
   - Monitor performance metrics
   - Manage sessions

### Testing Your Agent:
1. In the Agent Engine UI, select your agent
2. Start a new session
3. Try sample queries like:
   - "What should I plant this season?"
   - "Help me identify this plant disease" (with image upload)
   - "What's the best time to harvest tomatoes?"
   - "How can I improve my soil health?"

## Troubleshooting

### Common Issues:

1. **Authentication Errors**:
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

2. **API Not Enabled**:
   ```bash
   gcloud services enable aiplatform.googleapis.com
   ```

3. **Permissions Issues**:
   Ensure your account has the following roles:
   - Vertex AI Administrator
   - Storage Admin (for staging bucket)
   - Service Usage Admin

4. **Staging Bucket Issues**:
   ```bash
   gsutil mb gs://your-unique-bucket-name
   export STAGING_BUCKET="gs://your-unique-bucket-name"
   ```

## Clean Up

To delete your deployed agent and avoid charges:

```python
# In Python, if you have the remote_app object
remote_app.delete(force=True)
```

Or delete through the console:
1. Go to the Agent Engine console
2. Select your agent
3. Click "Delete"

## Support

- **ADK Documentation**: https://google.github.io/adk-docs/
- **Agent Engine Guide**: https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/
- **Vertex AI Console**: https://console.cloud.google.com/vertex-ai/
