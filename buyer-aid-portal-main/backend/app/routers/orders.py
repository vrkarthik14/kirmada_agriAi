from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models.schemas import Order, OrderCreate, MessageResponse, ListResponse
from app.services.firestore_config import get_db
from google.cloud.firestore_v1.base_query import FieldFilter
from datetime import datetime

router = APIRouter()

COLLECTION_NAME = "orders"

@router.get("/", response_model=ListResponse)
async def get_orders():
    """Get all orders"""
    try:
        db = get_db()
        orders_ref = db.collection(COLLECTION_NAME)
        docs = orders_ref.stream()
        
        orders = []
        for doc in docs:
            order_data = doc.to_dict()
            order_data["id"] = doc.id
            orders.append(order_data)
        
        return ListResponse(data=orders, count=len(orders))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching orders: {str(e)}")

@router.get("/{order_id}", response_model=Order)
async def get_order(order_id: str):
    """Get a specific order by ID"""
    try:
        db = get_db()
        order_ref = db.collection(COLLECTION_NAME).document(order_id)
        order_doc = order_ref.get()
        
        if not order_doc.exists:
            raise HTTPException(status_code=404, detail="Order not found")
        
        order_data = order_doc.to_dict()
        order_data["id"] = order_doc.id
        return Order(**order_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching order: {str(e)}")

@router.post("/", response_model=Order, status_code=status.HTTP_201_CREATED)
async def create_order(order: OrderCreate):
    """Create a new order"""
    try:
        db = get_db()
        
        # Convert Pydantic model to dict
        order_data = order.model_dump(by_alias=True)
        order_data["createdAt"] = datetime.now()
        order_data["updatedAt"] = datetime.now()
        
        # Add to Firestore
        order_ref = db.collection(COLLECTION_NAME).document()
        order_ref.set(order_data)
        
        # Return created order with ID
        order_data["id"] = order_ref.id
        return Order(**order_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating order: {str(e)}")

@router.put("/{order_id}", response_model=Order)
async def update_order(order_id: str, order: OrderCreate):
    """Update an existing order"""
    try:
        db = get_db()
        order_ref = db.collection(COLLECTION_NAME).document(order_id)
        
        # Check if order exists
        if not order_ref.get().exists:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Update order data
        order_data = order.model_dump(by_alias=True)
        order_data["updatedAt"] = datetime.now()
        
        order_ref.update(order_data)
        
        # Return updated order
        order_data["id"] = order_id
        return Order(**order_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating order: {str(e)}")

@router.delete("/{order_id}", response_model=MessageResponse)
async def delete_order(order_id: str):
    """Delete an order"""
    try:
        db = get_db()
        order_ref = db.collection(COLLECTION_NAME).document(order_id)
        
        # Check if order exists
        if not order_ref.get().exists:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Delete order
        order_ref.delete()
        
        return MessageResponse(message=f"Order {order_id} deleted successfully")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting order: {str(e)}")

@router.get("/status/{status_filter}", response_model=ListResponse)
async def get_orders_by_status(status_filter: str):
    """Get orders filtered by status"""
    try:
        db = get_db()
        orders_ref = db.collection(COLLECTION_NAME)
        query = orders_ref.where(filter=FieldFilter("status", "==", status_filter))
        docs = query.stream()
        
        orders = []
        for doc in docs:
            order_data = doc.to_dict()
            order_data["id"] = doc.id
            orders.append(order_data)
        
        return ListResponse(data=orders, count=len(orders))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching orders by status: {str(e)}")

@router.patch("/{order_id}/status", response_model=Order)
async def update_order_status(order_id: str, status_update: dict):
    """Update order status (for tracking shipments, deliveries, etc.)"""
    try:
        db = get_db()
        order_ref = db.collection(COLLECTION_NAME).document(order_id)
        
        # Check if order exists
        order_doc = order_ref.get()
        if not order_doc.exists:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Update only the status
        new_status = status_update.get("status")
        if new_status not in ["pending", "shipped", "delivered", "cancelled"]:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        order_ref.update({
            "status": new_status,
            "updatedAt": datetime.now()
        })
        
        # Return updated order
        updated_doc = order_ref.get()
        order_data = updated_doc.to_dict()
        order_data["id"] = order_id
        return Order(**order_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating order status: {str(e)}") 