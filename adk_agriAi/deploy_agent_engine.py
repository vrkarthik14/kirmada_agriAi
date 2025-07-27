"""
Vertex AI Agent Engine Deployment Script for Farmer AI
This script deploys the Farmer AI agent to Vertex AI Agent Engine with the default ADK web UI
"""

import os
import vertexai
from vertexai.preview import reasoning_engines
from vertexai import agent_engines

# Import your agent
from agent import unified_farmer_agent as root_agent

def main():
    """Deploy Farmer AI agent to Vertex AI Agent Engine"""
    
    # Configuration - Update these values
    PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT")
    LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
    STAGING_BUCKET = os.environ.get("STAGING_BUCKET")  # gs://your-bucket-name
    
    if not PROJECT_ID:
        raise ValueError("Please set GOOGLE_CLOUD_PROJECT environment variable")
    
    if not STAGING_BUCKET:
        print("⚠️  No STAGING_BUCKET set. Please set it as: export STAGING_BUCKET='gs://your-bucket-name'")
        print("You can create a bucket with: gsutil mb gs://your-unique-bucket-name")
        return
    
    print(f"🌾 Deploying Farmer AI to Vertex AI Agent Engine")
    print(f"📍 Project: {PROJECT_ID}")
    print(f"📍 Location: {LOCATION}")
    print(f"📍 Staging Bucket: {STAGING_BUCKET}")
    
    # Initialize Vertex AI
    print("\n🚀 Initializing Vertex AI...")
    vertexai.init(
        project=PROJECT_ID,
        location=LOCATION,
        staging_bucket=STAGING_BUCKET,
    )
    
    # Prepare agent for Agent Engine
    print("📦 Preparing agent for deployment...")
    app = reasoning_engines.AdkApp(
        agent=root_agent,
        enable_tracing=True,
    )
    
    # Test locally first
    print("\n🧪 Testing agent locally...")
    try:
        session = app.create_session(user_id="test_user")
        print(f"✅ Local test successful - Session ID: {session.id}")
        
        # Test a quick query
        print("Testing a sample query...")
        responses = list(app.stream_query(
            user_id="test_user",
            session_id=session.id,
            message="Hello, what can you help me with?"
        ))
        print("✅ Local agent is responding correctly")
        
    except Exception as e:
        print(f"❌ Local test failed: {e}")
        print("Please fix the agent before deploying")
        return
    
    # Deploy to Agent Engine
    print("\n🚀 Deploying to Vertex AI Agent Engine...")
    print("This may take several minutes...")
    
    try:
        remote_app = agent_engines.create(
            agent_engine=app,
            requirements=[
                "google-cloud-aiplatform[adk,agent_engines]",
                "google-adk>=0.1.0",
                "google-generativeai>=0.8.0",
                "firebase-admin>=6.5.0",
                "tensorflow>=2.15.0",
                "numpy>=1.26.0",
                "scikit-learn>=1.3.0",
                "Pillow>=10.1.0",
                "pydantic>=2.0.0",
                "cloudpickle"
            ]
        )
        
        print(f"✅ Deployment successful!")
        print(f"🔗 Resource Name: {remote_app.resource_name}")
        
        # Test the deployed agent
        print("\n🧪 Testing deployed agent...")
        remote_session = remote_app.create_session(user_id="remote_test_user")
        print(f"✅ Remote session created: {remote_session['id']}")
        
        # Test a query on the deployed agent
        responses = list(remote_app.stream_query(
            user_id="remote_test_user",
            session_id=remote_session["id"],
            message="Hello, what farming advice can you provide?"
        ))
        print("✅ Deployed agent is responding correctly")
        
        print(f"\n🎉 Deployment Complete!")
        print(f"📊 Monitor your agent at: https://console.cloud.google.com/vertex-ai/agents/agent-engines")
        print(f"🌐 You can interact with your agent through the Agent Engine UI")
        print(f"🔗 Resource Name: {remote_app.resource_name}")
        
        return remote_app
        
    except Exception as e:
        print(f"❌ Deployment failed: {e}")
        print("Please check your configuration and try again")
        return None

if __name__ == "__main__":
    main()
