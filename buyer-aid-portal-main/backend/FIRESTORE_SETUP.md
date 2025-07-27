# 🔥 Google Firestore Setup Guide

## 🎯 **Current Status**
- ✅ **Backend API**: Running with mock database  
- ✅ **Frontend**: Connected to backend API
- ⚠️ **Database**: Using mock Firestore (in-memory)
- 🎯 **Goal**: Replace mock with real Google Firestore

## 🚀 **Quick Setup (5 minutes)**

### **Step 1: Google Cloud Console Setup**

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**

2. **Create New Project** (or select existing)
   - Click "Select a project" → "New Project"
   - Name: `farmer-aid-portal` (or your choice)
   - Click "Create"

3. **Enable Firestore API**
   - Go to "APIs & Services" → "Library" 
   - Search: "Cloud Firestore API"
   - Click "Enable"

4. **Create Firestore Database**
   - Go to "Firestore" in the sidebar
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select location (e.g., `us-central1`)

### **Step 2: Service Account Setup**

1. **Create Service Account**
   - Go to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - Name: `farmer-aid-portal-service`
   - Description: `Service account for Farmer Aid Portal backend`
   - Click "Create and Continue"

2. **Assign Roles**
   - Add role: `Cloud Datastore User` (or `Editor` for full access)
   - Click "Continue" → "Done"

3. **Download JSON Key**
   - Click on your service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key" → "JSON"
   - **Save the downloaded file** as:
     ```
     /Users/radas2502/Downloads/farmer-aid-portal-main/backend/serviceAccountKey.json
     ```

### **Step 3: Configure Backend**

1. **Place Key File**
   ```bash
   # Make sure your key file is here:
   cd /Users/radas2502/Downloads/farmer-aid-portal-main/backend
   ls serviceAccountKey.json  # Should exist
   ```

2. **Test Configuration**
   ```bash
   cd backend
   source venv/bin/activate
   python3 setup_firestore.py
   ```

3. **Restart Backend with Real Firestore**
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart:
   python run.py
   ```

### **Step 4: Verify Setup**

1. **Check Server Logs**
   - Should see: `✅ Firestore initialized with service account key`
   - Instead of: `🧪 Using mock Firestore for testing...`

2. **Test API with Real Database**
   ```bash
   # Create test data in real Firestore
   curl -X POST http://localhost:8000/api/campaigns/ \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Real Firestore Test",
       "crop": "Rice", 
       "cropType": "Basmati",
       "location": "Real Database",
       "duration": "2025",
       "status": "active",
       "estimatedYield": "5.0 tons",
       "minimumQuotation": "₹30,000", 
       "currentBid": "₹35,000",
       "totalBids": 1
     }'
   ```

3. **Verify in Google Cloud Console**
   - Go to Firestore → Data
   - Should see `campaigns` collection with your data

## 🔄 **Migration from Mock to Real Database**

Once Firestore is configured:

```bash
cd backend
source venv/bin/activate
python3 seed_data.py  # Populates real Firestore with sample data
```

## 🛠️ **Troubleshooting**

### **Error: "Application Default Credentials were not found"**
- ✅ **Solution**: Make sure `serviceAccountKey.json` is in the `backend/` directory

### **Error: "Permission denied"** 
- ✅ **Solution**: Check service account has `Cloud Datastore User` role

### **Error: "Firestore API not enabled"**
- ✅ **Solution**: Enable Cloud Firestore API in Google Cloud Console

### **Mock Database Still Active**
- ✅ **Solution**: Check server logs for `✅ Firestore initialized` message
- ✅ **Restart**: Stop server (Ctrl+C) and run `python run.py` again

## 🎉 **Benefits of Real Firestore**

- **🔄 Persistent Data**: Data survives server restarts
- **⚡ Real-time Sync**: Multiple users see updates instantly  
- **📊 Scalable**: Handles thousands of farmers and orders
- **🔍 Advanced Queries**: Complex filtering and search
- **📱 Mobile Ready**: Perfect for mobile farming apps
- **🔒 Secure**: Built-in authentication and security rules

## 🌐 **Production Deployment**

For production (Google Cloud Run, App Engine, etc.):

1. **Use Application Default Credentials**:
   ```bash
   gcloud auth application-default login
   ```

2. **Remove service account key file** (more secure)

3. **Update firestore_config.py** to prefer Application Default Credentials

---

## 📞 **Need Help?**

- **🧪 Test Setup**: `python3 setup_firestore.py`
- **📊 Check Data**: Visit [Firestore Console](https://console.cloud.google.com/firestore)
- **🌐 API Docs**: http://localhost:8000/docs
- **🖥️ Frontend**: http://localhost:8082

Your farmer aid portal will be production-ready with real database persistence! 🚜🌾 