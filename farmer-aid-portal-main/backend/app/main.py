from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import campaigns, contracts, orders, bids
from app.services.firestore_config import init_firestore

app = FastAPI(title="Farmer Aid Portal API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:3002", "http://localhost:3000"],  # Allow both portals
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firestore
init_firestore()

# Include routers
app.include_router(campaigns.router, prefix="/api/campaigns", tags=["campaigns"])
app.include_router(contracts.router, prefix="/api/contracts", tags=["contracts"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(bids.router, prefix="/api/bids", tags=["bids"])

# Simple in-memory storage for contract progress (for demo)
contract_progress_store = {}

@app.post("/api/contract-progress/{contract_id}")
async def update_contract_progress(contract_id: str, progress_data: dict):
    """Store contract progress for cross-portal sync"""
    contract_progress_store[contract_id] = progress_data
    return {"success": True, "contract_id": contract_id, "progress": progress_data}

@app.get("/api/contract-progress/{contract_id}")
async def get_contract_progress(contract_id: str):
    """Get contract progress for cross-portal sync"""
    progress = contract_progress_store.get(contract_id)
    if progress:
        return {"success": True, "contract_id": contract_id, "progress": progress}
    else:
        return {"success": False, "message": "No progress found"}

@app.get("/")
async def root():
    return {"message": "Farmer Aid Portal API is running!"} 