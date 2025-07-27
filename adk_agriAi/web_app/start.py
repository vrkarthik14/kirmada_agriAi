#!/usr/bin/env python3
"""
Startup script for Farmer AI Web Application
Checks dependencies, environment, and starts the server
"""

import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Check if Python version is 3.9+"""
    if sys.version_info < (3, 9):
        print("❌ Python 3.9+ is required")
        print(f"Current version: {sys.version}")
        return False
    print(f"✅ Python {sys.version.split()[0]} detected")
    return True

def check_dependencies():
    """Check if required packages are installed"""
    # Map package names to their import names
    required_packages = {
        'fastapi': 'fastapi',
        'uvicorn': 'uvicorn',
        'google-adk': 'google.adk',
        'python-dotenv': 'dotenv'
    }
    
    missing_packages = []
    for package_name, import_name in required_packages.items():
        try:
            __import__(import_name)
            print(f"✅ {package_name} installed")
        except ImportError:
            missing_packages.append(package_name)
            print(f"❌ {package_name} not found")
    
    if missing_packages:
        print(f"\nMissing packages: {', '.join(missing_packages)}")
        print("Run: pip install -r requirements.txt")
        return False
    
    return True

def check_environment():
    """Check environment configuration"""
    env_file = Path('.env')
    if not env_file.exists():
        print("❌ .env file not found")
        print("Please create .env file with your Google API key")
        return False
    
    # Load environment variables
    with open(env_file) as f:
        env_content = f.read()
    
    if 'your_google_api_key_here' in env_content:
        print("❌ Please update .env file with your actual Google API key")
        return False
    
    if 'GOOGLE_API_KEY=' not in env_content:
        print("❌ GOOGLE_API_KEY not found in .env file")
        return False
    
    print("✅ Environment configuration looks good")
    return True

def check_agent_file():
    """Check if agent.py exists in parent directory"""
    agent_file = Path('../agent.py')
    if not agent_file.exists():
        print("❌ agent.py not found in parent directory")
        print("Please ensure you're running from the web_app directory")
        return False
    
    print("✅ Agent file found")
    return True

def start_server():
    """Start the FastAPI server"""
    print("\n🚀 Starting Farmer AI Web Interface...")
    print("📱 Open your browser to: http://localhost:8000")
    print("⌨️  Press Ctrl+C to stop the server\n")
    
    try:
        # Start uvicorn server
        subprocess.run([
            sys.executable, '-m', 'uvicorn',
            'main:app',
            '--host', '0.0.0.0',
            '--port', '8000',
            '--reload'
        ])
    except KeyboardInterrupt:
        print("\n👋 Server stopped. Goodbye!")
    except Exception as e:
        print(f"❌ Error starting server: {e}")

def main():
    """Main startup function"""
    print("🌾 Farmer AI Web Interface Startup")
    print("=" * 40)
    
    # Check all prerequisites
    checks = [
        ("Python Version", check_python_version),
        ("Dependencies", check_dependencies),
        ("Environment", check_environment),
        ("Agent File", check_agent_file)
    ]
    
    for check_name, check_func in checks:
        print(f"\n📋 Checking {check_name}...")
        if not check_func():
            print(f"\n❌ {check_name} check failed. Please fix the issues above.")
            sys.exit(1)
    
    print("\n✅ All checks passed!")
    start_server()

if __name__ == "__main__":
    main()
