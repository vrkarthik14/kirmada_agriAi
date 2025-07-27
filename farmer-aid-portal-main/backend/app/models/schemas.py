from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import datetime

# User Types
UserType = Literal["farmer", "buyer"]

# Campaign Models
class CampaignBase(BaseModel):
    title: str
    crop: str
    crop_type: str = Field(..., alias="cropType")
    location: str
    duration: str
    estimated_yield: str = Field(..., alias="estimatedYield")
    minimum_quotation: Optional[str] = Field(None, alias="minimumQuotation")  # Optional for buyer requests
    current_bid: Optional[str] = Field(None, alias="currentBid")  # Will be set by farmers
    total_bids: int = Field(default=0, alias="totalBids")

class CampaignCreate(CampaignBase):
    status: Literal["active", "completed", "upcoming"] = "upcoming"
    user_type: UserType = Field(default="farmer", alias="userType")  # Who created this campaign
    user_id: Optional[str] = Field(default=None, alias="userId")  # Creator's ID

class Campaign(CampaignBase):
    id: Optional[str] = None
    status: Literal["active", "completed", "upcoming"]
    user_type: UserType = Field(default="farmer", alias="userType")
    user_id: Optional[str] = Field(default=None, alias="userId")
    created_at: Optional[datetime] = Field(default_factory=datetime.now, alias="createdAt")
    updated_at: Optional[datetime] = Field(default_factory=datetime.now, alias="updatedAt")

    class Config:
        populate_by_name = True

# Bid Models
class BidBase(BaseModel):
    campaign_id: str = Field(..., alias="campaignId")
    bidder_type: UserType = Field(..., alias="bidderType")  # farmer or buyer
    bidder_id: Optional[str] = Field(None, alias="bidderId")  # Who made the bid
    bidder_name: str = Field(..., alias="bidderName")
    bid_amount: str = Field(..., alias="bidAmount")
    quantity: str
    quality_grade: str = Field(default="Grade A", alias="qualityGrade")
    delivery_terms: Optional[str] = Field(None, alias="deliveryTerms")
    notes: Optional[str] = None

class BidCreate(BidBase):
    status: Literal["pending", "accepted", "rejected", "counter_offered"] = "pending"

class BidAction(BaseModel):
    action: Literal["accept", "reject", "counter"]
    counter_amount: Optional[str] = Field(None, alias="counterAmount")
    counter_terms: Optional[str] = Field(None, alias="counterTerms")
    notes: Optional[str] = None

class Bid(BidBase):
    id: Optional[str] = None
    status: Literal["pending", "accepted", "rejected", "counter_offered"]
    created_at: Optional[datetime] = Field(default_factory=datetime.now, alias="createdAt")
    updated_at: Optional[datetime] = Field(default_factory=datetime.now, alias="updatedAt")

    class Config:
        populate_by_name = True

# Bidding Action Models
class BidAction(BaseModel):
    action: Literal["accept", "reject", "counter_offer"]
    counter_amount: Optional[str] = Field(None, alias="counterAmount")
    notes: Optional[str] = None

# Enhanced Campaign with Bids
class CampaignWithBids(Campaign):
    bids: List[Bid] = []
    active_bids_count: int = Field(default=0, alias="activeBidsCount")
    highest_bid: Optional[str] = Field(None, alias="highestBid")
    lowest_bid: Optional[str] = Field(None, alias="lowestBid")

# Contract Models (similar to campaigns but with contract-specific fields)
class ContractBase(BaseModel):
    title: str
    crop: str
    crop_type: str = Field(..., alias="cropType")
    location: str
    duration: str
    estimated_yield: str = Field(..., alias="estimatedYield")
    minimum_quotation: str = Field(..., alias="minimumQuotation")
    current_bid: str = Field(..., alias="currentBid")
    agreed_price: Optional[str] = Field(None, alias="agreedPrice")
    total_bids: int = Field(..., alias="totalBids")
    farmer_name: Optional[str] = Field(None, alias="farmerName")
    buyer_name: Optional[str] = Field(None, alias="buyerName")
    current_stage: Optional[str] = Field(None, alias="currentStage")
    quality_grade: Optional[str] = Field(None, alias="qualityGrade")
    delivery_terms: Optional[str] = Field(None, alias="deliveryTerms")
    contract_notes: Optional[str] = Field(None, alias="contractNotes")
    farmer_name: Optional[str] = Field(None, alias="farmerName")
    buyer_name: Optional[str] = Field(None, alias="buyerName")

class ContractCreate(ContractBase):
    status: Literal["active", "completed", "upcoming"] = "upcoming"
    farmer_id: Optional[str] = Field(None, alias="farmerId")
    buyer_id: Optional[str] = Field(None, alias="buyerId")
    agreed_price: Optional[str] = Field(None, alias="agreedPrice")
    original_campaign_id: Optional[str] = Field(None, alias="originalCampaignId")

class Contract(ContractBase):
    id: Optional[str] = None
    status: Literal["active", "completed", "upcoming"]
    farmer_id: Optional[str] = Field(None, alias="farmerId")
    buyer_id: Optional[str] = Field(None, alias="buyerId")
    agreed_price: Optional[str] = Field(None, alias="agreedPrice")
    original_campaign_id: Optional[str] = Field(None, alias="originalCampaignId")
    created_at: Optional[datetime] = Field(default_factory=datetime.now, alias="createdAt")
    updated_at: Optional[datetime] = Field(default_factory=datetime.now, alias="updatedAt")

    class Config:
        populate_by_name = True

# Order Models
class OrderBase(BaseModel):
    product: str
    quantity: str
    supplier: str
    order_date: str = Field(..., alias="orderDate")
    delivery_date: str = Field(..., alias="deliveryDate")
    amount: str

class OrderCreate(OrderBase):
    status: Literal["pending", "shipped", "delivered", "cancelled"] = "pending"

class Order(OrderBase):
    id: Optional[str] = None
    status: Literal["pending", "shipped", "delivered", "cancelled"]
    created_at: Optional[datetime] = Field(default_factory=datetime.now, alias="createdAt")
    updated_at: Optional[datetime] = Field(default_factory=datetime.now, alias="updatedAt")

    class Config:
        populate_by_name = True

# Response Models
class MessageResponse(BaseModel):
    message: str
    success: bool = True

class ListResponse(BaseModel):
    data: list
    count: int
    success: bool = True

# Bidding-specific Response Models
class BidResponse(BaseModel):
    bid: Bid
    message: str
    success: bool = True

class BiddingStatsResponse(BaseModel):
    total_campaigns: int = Field(..., alias="totalCampaigns")
    active_bids: int = Field(..., alias="activeBids")
    successful_contracts: int = Field(..., alias="successfulContracts")
    average_bid_amount: Optional[str] = Field(None, alias="averageBidAmount")
    success: bool = True

    class Config:
        populate_by_name = True 