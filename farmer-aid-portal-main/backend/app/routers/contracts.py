from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models.schemas import Contract, ContractCreate, MessageResponse, ListResponse
from app.services.firestore_config import get_db
from google.cloud.firestore_v1.base_query import FieldFilter
from datetime import datetime

router = APIRouter()

COLLECTION_NAME = "contracts"

@router.get("/", response_model=ListResponse)
async def get_contracts():
    """Get all contracts"""
    try:
        db = get_db()
        contracts_ref = db.collection(COLLECTION_NAME)
        docs = contracts_ref.stream()
        
        contracts = []
        for doc in docs:
            contract_data = doc.to_dict()
            contract_data["id"] = doc.id
            contracts.append(contract_data)
        
        return ListResponse(data=contracts, count=len(contracts))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching contracts: {str(e)}")

@router.get("/{contract_id}", response_model=Contract)
async def get_contract(contract_id: str):
    """Get a specific contract by ID"""
    try:
        db = get_db()
        contract_ref = db.collection(COLLECTION_NAME).document(contract_id)
        contract_doc = contract_ref.get()
        
        if not contract_doc.exists:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        contract_data = contract_doc.to_dict()
        contract_data["id"] = contract_doc.id
        return Contract(**contract_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching contract: {str(e)}")

@router.post("/", response_model=Contract, status_code=status.HTTP_201_CREATED)
async def create_contract(contract: ContractCreate):
    """Create a new contract"""
    try:
        db = get_db()
        
        # Convert Pydantic model to dict
        contract_data = contract.model_dump(by_alias=True)
        contract_data["createdAt"] = datetime.now()
        contract_data["updatedAt"] = datetime.now()
        
        # Add to Firestore
        contract_ref = db.collection(COLLECTION_NAME).document()
        contract_ref.set(contract_data)
        
        # Return created contract with ID
        contract_data["id"] = contract_ref.id
        return Contract(**contract_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating contract: {str(e)}")

@router.put("/{contract_id}", response_model=Contract)
async def update_contract(contract_id: str, contract: ContractCreate):
    """Update an existing contract"""
    try:
        db = get_db()
        contract_ref = db.collection(COLLECTION_NAME).document(contract_id)
        
        # Check if contract exists
        if not contract_ref.get().exists:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        # Update contract data
        contract_data = contract.model_dump(by_alias=True)
        contract_data["updatedAt"] = datetime.now()
        
        contract_ref.update(contract_data)
        
        # Return updated contract
        contract_data["id"] = contract_id
        return Contract(**contract_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating contract: {str(e)}")

@router.delete("/{contract_id}", response_model=MessageResponse)
async def delete_contract(contract_id: str):
    """Delete a contract"""
    try:
        db = get_db()
        contract_ref = db.collection(COLLECTION_NAME).document(contract_id)
        
        # Check if contract exists
        if not contract_ref.get().exists:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        # Delete contract
        contract_ref.delete()
        
        return MessageResponse(message=f"Contract {contract_id} deleted successfully")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting contract: {str(e)}")

@router.get("/status/{status_filter}", response_model=ListResponse)
async def get_contracts_by_status(status_filter: str):
    """Get contracts filtered by status"""
    try:
        db = get_db()
        contracts_ref = db.collection(COLLECTION_NAME)
        query = contracts_ref.where(filter=FieldFilter("status", "==", status_filter))
        docs = query.stream()
        
        contracts = []
        for doc in docs:
            contract_data = doc.to_dict()
            contract_data["id"] = doc.id
            contracts.append(contract_data)
        
        return ListResponse(data=contracts, count=len(contracts))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching contracts by status: {str(e)}") 