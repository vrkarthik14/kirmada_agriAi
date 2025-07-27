# Farmer Aid Portal - FastAPI Backend

This is the backend API for the Farmer Aid Portal, built with **FastAPI** and **Google Firestore**.

## 🚀 Features

- **FastAPI** - Modern, fast web framework for building APIs
- **Google Firestore** - NoSQL document database
- **Pydantic** - Data validation using Python type annotations
- **CORS** - Configured for frontend communication
- **Auto Documentation** - Interactive API docs at `/docs`

## 📋 Prerequisites

1. **Python 3.8+** installed
2. **Google Cloud Project** with Firestore enabled
3. **Service Account Key** (for local development) or **Application Default Credentials**

## 🛠️ Setup Instructions

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Firebase/Firestore Setup

#### Option A: Using Service Account Key (Recommended for Local Development)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Firestore API**
4. Go to **IAM & Admin > Service Accounts**
5. Create a new service account or use an existing one
6. Download the JSON key file
7. Place the key file in the `backend/` directory
8. Update `firestore_config.py` to use your key file:

```python
# In app/services/firestore_config.py, uncomment and modify:
key_path = "path/to/your/serviceAccountKey.json"
cred = credentials.Certificate(key_path)
```

#### Option B: Using Application Default Credentials (for Production)

```bash
# Install Google Cloud CLI
# https://cloud.google.com/sdk/docs/install

# Authenticate with your Google account
gcloud auth application-default login

# Set your project ID
gcloud config set project YOUR_PROJECT_ID
```

### 3. Start the Backend Server

```bash
# Option 1: Using the run script
python run.py

# Option 2: Using uvicorn directly
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:
- **API Base**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 4. Seed Sample Data (Optional)

To populate your Firestore database with sample data:

```bash
python seed_data.py
```

## 📖 API Endpoints

### Health & Info
- `GET /` - API status
- `GET /health` - Health check

### Campaigns
- `GET /api/campaigns/` - List all campaigns
- `GET /api/campaigns/{id}` - Get campaign by ID
- `POST /api/campaigns/` - Create new campaign
- `PUT /api/campaigns/{id}` - Update campaign
- `DELETE /api/campaigns/{id}` - Delete campaign
- `GET /api/campaigns/status/{status}` - Filter by status

### Contracts
- `GET /api/contracts/` - List all contracts
- `GET /api/contracts/{id}` - Get contract by ID
- `POST /api/contracts/` - Create new contract
- `PUT /api/contracts/{id}` - Update contract
- `DELETE /api/contracts/{id}` - Delete contract
- `GET /api/contracts/status/{status}` - Filter by status

### Orders
- `GET /api/orders/` - List all orders
- `GET /api/orders/{id}` - Get order by ID
- `POST /api/orders/` - Create new order
- `PUT /api/orders/{id}` - Update order
- `DELETE /api/orders/{id}` - Delete order
- `GET /api/orders/status/{status}` - Filter by status
- `PATCH /api/orders/{id}/status` - Update order status

## 🗄️ Database Collections

### Campaigns
```json
{
  "title": "Premium Wheat Harvest 2024",
  "crop": "Wheat",
  "cropType": "Premium Winter Wheat",
  "location": "North Field, Punjab",
  "duration": "Oct 2024 - Apr 2025",
  "status": "active", // "active" | "completed" | "upcoming"
  "estimatedYield": "4.2 tons/hectare",
  "minimumQuotation": "₹25,000/ton",
  "currentBid": "₹28,500/ton",
  "totalBids": 12,
  "createdAt": "2024-12-20T...",
  "updatedAt": "2024-12-20T..."
}
```

### Contracts
```json
{
  "title": "Wheat Supply Contract - ABC Mills",
  "crop": "Wheat",
  "cropType": "Winter Wheat",
  "location": "North Field, Punjab",
  "duration": "Dec 2024 - Apr 2025",
  "status": "active", // "active" | "completed" | "upcoming"
  "estimatedYield": "4.2 tons/hectare",
  "minimumQuotation": "₹25,000/ton",
  "currentBid": "₹26,800/ton",
  "totalBids": 1,
  "createdAt": "2024-12-20T...",
  "updatedAt": "2024-12-20T..."
}
```

### Orders
```json
{
  "product": "Organic Fertilizer",
  "quantity": "500 kg",
  "supplier": "GreenGrow Supplies",
  "orderDate": "Dec 15, 2024",
  "deliveryDate": "Dec 22, 2024",
  "status": "shipped", // "pending" | "shipped" | "delivered" | "cancelled"
  "amount": "₹12,500",
  "createdAt": "2024-12-20T...",
  "updatedAt": "2024-12-20T..."
}
```

## 🧪 Testing the API

### Using curl
```bash
# Get all campaigns
curl http://localhost:8000/api/campaigns/

# Create a new campaign
curl -X POST http://localhost:8000/api/campaigns/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Campaign",
    "crop": "Rice",
    "cropType": "Basmati",
    "location": "Test Field",
    "duration": "Jan 2025 - May 2025",
    "status": "upcoming",
    "estimatedYield": "5.0 tons/hectare",
    "minimumQuotation": "₹30,000/ton",
    "currentBid": "₹32,000/ton",
    "totalBids": 0
  }'
```

### Using the Interactive Docs
1. Go to http://localhost:8000/docs
2. Try out the endpoints directly in the browser
3. View request/response schemas

## 🚀 Running with Frontend

1. **Start Backend**: `python run.py` (Port 8000)
2. **Start Frontend**: `npm run dev` (Port 8082)
3. The frontend will automatically connect to the backend API

## 🔧 Environment Variables

Create a `.env` file in the backend directory (optional):

```env
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_KEY=path/to/serviceAccountKey.json
GOOGLE_CLOUD_PROJECT=your-project-id

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
```

## 📝 Development Notes

- **CORS** is configured to allow requests from React dev server ports
- **Automatic reloading** is enabled in development mode
- **Error handling** includes detailed error messages for debugging
- **Data validation** is handled by Pydantic models
- **Firestore indexes** may be needed for complex queries

## 🐛 Troubleshooting

### Common Issues

1. **Firestore Permission Denied**
   - Check your service account has Firestore permissions
   - Verify your credentials are properly configured

2. **Import Errors**
   - Make sure you're in the backend directory
   - Check all dependencies are installed

3. **CORS Errors**
   - Verify frontend port is included in CORS origins
   - Check if both servers are running

4. **Module Not Found**
   - Run `pip install -r requirements.txt`
   - Check Python path and virtual environment

### Getting Help

- Check the **Interactive API Docs** at `/docs`
- Review **Firestore Console** for data issues
- Enable **debug mode** for detailed error logs 