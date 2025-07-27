#!/bin/bash
# Farmer AI Web Interface Startup Script

echo "🌾 Starting Farmer AI Web Interface..."

# Check if we're in the right directory
if [ ! -f "main.py" ]; then
    echo "❌ Please run this script from the web_app directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it with your Google API key."
    exit 1
fi

# Start the Python application
python3 start.py
