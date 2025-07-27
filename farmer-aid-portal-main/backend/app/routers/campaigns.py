from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models.schemas import Campaign, CampaignCreate, MessageResponse, ListResponse
from app.services.firestore_config import get_db
from google.cloud.firestore_v1.base_query import FieldFilter
import uuid
from datetime import datetime

router = APIRouter()

COLLECTION_NAME = "campaigns"

@router.get("/", response_model=ListResponse)
async def get_campaigns():
    """Get all campaigns"""
    try:
        db = get_db()
        campaigns_ref = db.collection(COLLECTION_NAME)
        docs = campaigns_ref.stream()
        
        campaigns = []
        for doc in docs:
            campaign_data = doc.to_dict()
            campaign_data["id"] = doc.id
            campaigns.append(campaign_data)
        
        return ListResponse(data=campaigns, count=len(campaigns))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching campaigns: {str(e)}")

@router.get("/{campaign_id}", response_model=Campaign)
async def get_campaign(campaign_id: str):
    """Get a specific campaign by ID"""
    try:
        db = get_db()
        campaign_ref = db.collection(COLLECTION_NAME).document(campaign_id)
        campaign_doc = campaign_ref.get()
        
        if not campaign_doc.exists:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        campaign_data = campaign_doc.to_dict()
        campaign_data["id"] = campaign_doc.id
        return Campaign(**campaign_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching campaign: {str(e)}")

@router.post("/", response_model=Campaign, status_code=status.HTTP_201_CREATED)
async def create_campaign(campaign: CampaignCreate):
    """Create a new campaign"""
    try:
        db = get_db()
        
        # Convert Pydantic model to dict
        campaign_data = campaign.model_dump(by_alias=True)
        campaign_data["createdAt"] = datetime.now()
        campaign_data["updatedAt"] = datetime.now()
        
        # Add to Firestore
        campaign_ref = db.collection(COLLECTION_NAME).document()
        campaign_ref.set(campaign_data)
        
        # Return created campaign with ID
        campaign_data["id"] = campaign_ref.id
        return Campaign(**campaign_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating campaign: {str(e)}")

@router.put("/{campaign_id}", response_model=Campaign)
async def update_campaign(campaign_id: str, campaign: CampaignCreate):
    """Update an existing campaign"""
    try:
        db = get_db()
        campaign_ref = db.collection(COLLECTION_NAME).document(campaign_id)
        
        # Check if campaign exists
        if not campaign_ref.get().exists:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        # Update campaign data
        campaign_data = campaign.model_dump(by_alias=True)
        campaign_data["updatedAt"] = datetime.now()
        
        campaign_ref.update(campaign_data)
        
        # Return updated campaign
        campaign_data["id"] = campaign_id
        return Campaign(**campaign_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating campaign: {str(e)}")

@router.delete("/{campaign_id}", response_model=MessageResponse)
async def delete_campaign(campaign_id: str):
    """Delete a campaign"""
    try:
        db = get_db()
        campaign_ref = db.collection(COLLECTION_NAME).document(campaign_id)
        
        # Check if campaign exists
        if not campaign_ref.get().exists:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        # Delete campaign
        campaign_ref.delete()
        
        return MessageResponse(message=f"Campaign {campaign_id} deleted successfully")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting campaign: {str(e)}")

@router.get("/status/{status_filter}", response_model=ListResponse)
async def get_campaigns_by_status(status_filter: str):
    """Get campaigns filtered by status"""
    try:
        db = get_db()
        campaigns_ref = db.collection(COLLECTION_NAME)
        query = campaigns_ref.where(filter=FieldFilter("status", "==", status_filter))
        docs = query.stream()
        
        campaigns = []
        for doc in docs:
            campaign_data = doc.to_dict()
            campaign_data["id"] = doc.id
            campaigns.append(campaign_data)
        
        return ListResponse(data=campaigns, count=len(campaigns))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching campaigns by status: {str(e)}") 