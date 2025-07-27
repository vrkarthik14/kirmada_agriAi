#!/usr/bin/env python3
"""
Setup script for Google Firestore configuration
Run this after downloading your service account key from Google Cloud Console
"""

import os
import json
import sys

def setup_firestore():
    print("🔥 Setting up Google Firestore for Farmer Aid Portal")
    print("=" * 50)
    
    # Check if service account key exists
    key_file = "serviceAccountKey.json"
    if os.path.exists(key_file):
        print(f"✅ Service account key found: {key_file}")
        
        # Validate the key file
        try:
            with open(key_file, 'r') as f:
                key_data = json.load(f)
                project_id = key_data.get('project_id', 'Unknown')
                print(f"📊 Project ID: {project_id}")
                print(f"📧 Service Account: {key_data.get('client_email', 'Unknown')}")
        except Exception as e:
            print(f"❌ Error reading service account key: {e}")
            return False
    else:
        print(f"❌ Service account key not found: {key_file}")
        print("\n📋 To set up Firestore:")
        print("1. Go to https://console.cloud.google.com/")
        print("2. Create a new project (or select existing)")
        print("3. Enable Cloud Firestore API")
        print("4. Create a service account with Firestore permissions")
        print("5. Download the JSON key file")
        print(f"6. Save it as: {os.path.abspath(key_file)}")
        return False
    
    print("\n🧪 Testing Firestore connection...")
    try:
        # Test the connection
        from app.services.firestore_config import init_firestore, get_db
        init_firestore()
        db = get_db()
        
        # Try to access a collection (this will work if properly configured)
        test_collection = db.collection('test')
        print("✅ Firestore connection successful!")
        
        # Show current data
        print("\n📊 Current database contents:")
        collections = ['campaigns', 'contracts', 'orders']
        for collection_name in collections:
            try:
                collection_ref = db.collection(collection_name)
                docs = list(collection_ref.stream())
                print(f"  📁 {collection_name}: {len(docs)} documents")
            except Exception as e:
                print(f"  ❌ {collection_name}: Error accessing - {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Firestore connection failed: {e}")
        print("\n💡 This is normal if you haven't set up the service account yet.")
        return False

def migrate_mock_data():
    """Migrate data from mock database to real Firestore"""
    print("\n📦 Would you like to migrate mock data to Firestore? (y/n): ", end="")
    response = input().lower()
    
    if response == 'y':
        print("🔄 Running data migration...")
        try:
            # This would run the seed script with real Firestore
            os.system("python3 seed_data.py")
            print("✅ Data migration completed!")
        except Exception as e:
            print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    print("🌱 Welcome to Farmer Aid Portal Firestore Setup!")
    
    if setup_firestore():
        print("\n🎉 Firestore is ready to use!")
        migrate_mock_data()
    else:
        print("\n⚠️  Complete the setup steps above and run this script again.")
        
    print("\n🚀 Once configured, restart your backend server to use real Firestore.")
    print("   cd backend && source venv/bin/activate && python run.py") 