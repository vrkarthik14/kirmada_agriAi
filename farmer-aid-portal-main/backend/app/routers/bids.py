from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.schemas import (
    Bid, BidCreate, BidAction, BidResponse, CampaignWithBids, 
    MessageResponse, ListResponse, BiddingStatsResponse
)
from app.services.firestore_config import get_db
from datetime import datetime
import uuid

router = APIRouter()

@router.get("/", response_model=ListResponse)
async def get_all_bids(
    campaign_id: Optional[str] = Query(None, description="Filter bids by campaign ID"),
    bidder_type: Optional[str] = Query(None, description="Filter by bidder type (farmer/buyer)"),
    status: Optional[str] = Query(None, description="Filter by bid status")
):
    """Get all bids with optional filtering"""
    try:
        db = get_db()
        bids_ref = db.collection('bids')
        
        # Apply filters
        query = bids_ref
        if campaign_id:
            query = query.where('campaign_id', '==', campaign_id)
        if bidder_type:
            query = query.where('bidder_type', '==', bidder_type)
        if status:
            query = query.where('status', '==', status)
        
        # Get documents
        docs = query.stream()
        bids = []
        
        for doc in docs:
            bid_data = doc.to_dict()
            bid_data['id'] = doc.id
            bids.append(bid_data)
        
        return ListResponse(data=bids, count=len(bids))
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving bids: {str(e)}")

@router.get("/campaign/{campaign_id}", response_model=CampaignWithBids)
async def get_campaign_with_bids(campaign_id: str):
    """Get a campaign with all its bids"""
    try:
        db = get_db()
        
        # Skip campaign validation for cross-platform bidding
        # (Campaign might exist in buyer backend, not farmer backend)
        # campaign_doc = db.collection('campaigns').document(campaign_id).get()
        # if not campaign_doc.exists:
        #     raise HTTPException(status_code=404, detail="Campaign not found")
        
        # Create dummy campaign data since we're not validating campaigns
        campaign_data = {'id': campaign_id, 'title': f'Campaign {campaign_id[:8]}...'}
        
        # Get all bids for this campaign
        bids_ref = db.collection('bids').where('campaign_id', '==', campaign_id)
        bid_docs = bids_ref.stream()
        
        bids = []
        bid_amounts = []
        
        for doc in bid_docs:
            bid_data = doc.to_dict()
            bid_data['id'] = doc.id
            bids.append(bid_data)
            
            # Extract numeric value for comparison
            if bid_data.get('bid_amount'):
                try:
                    amount_str = bid_data['bid_amount'].replace('₹', '').replace(',', '')
                    bid_amounts.append(float(amount_str))
                except:
                    pass
        
        # Calculate bid statistics
        active_bids = [bid for bid in bids if bid.get('status') == 'pending']
        highest_bid = f"₹{max(bid_amounts):,.0f}" if bid_amounts else None
        lowest_bid = f"₹{min(bid_amounts):,.0f}" if bid_amounts else None
        
        # Create enhanced campaign response
        campaign_with_bids = CampaignWithBids(
            **campaign_data,
            bids=bids,
            active_bids_count=len(active_bids),
            highest_bid=highest_bid,
            lowest_bid=lowest_bid
        )
        
        return campaign_with_bids
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving campaign with bids: {str(e)}")

@router.post("/", response_model=BidResponse)
async def create_bid(bid: BidCreate):
    """Create a new bid on a campaign"""
    try:
        db = get_db()
        
        # Skip campaign validation for cross-platform bidding
        # (Campaign might exist in buyer backend, not farmer backend)
        # campaign_doc = db.collection('campaigns').document(bid.campaign_id).get()
        # if not campaign_doc.exists:
        #     raise HTTPException(status_code=404, detail="Campaign not found")
        
        # Create bid document
        bid_data = bid.model_dump(by_alias=True)
        bid_data['createdAt'] = datetime.now().isoformat()
        bid_data['updatedAt'] = datetime.now().isoformat()
        
        # Generate unique bid ID
        bid_id = str(uuid.uuid4())
        
        # Save to database
        db.collection('bids').document(bid_id).set(bid_data)
        
        # Skip campaign update for cross-platform bidding
        # Campaign exists in buyer backend, not farmer backend
        # campaign_data = campaign_doc.to_dict()
        # total_bids = campaign_data.get('totalBids', 0) + 1
        # campaign_updates = {
        #     'totalBids': total_bids,
        #     'currentBid': bid.bid_amount,
        #     'updatedAt': datetime.now().isoformat()
        # }
        # db.collection('campaigns').document(bid.campaign_id).update(campaign_updates)
        
        # Return created bid
        bid_data['id'] = bid_id
        created_bid = Bid(**bid_data)
        
        return BidResponse(
            bid=created_bid,
            message=f"Bid created successfully by {bid.bidder_name}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating bid: {str(e)}")

@router.put("/{bid_id}/action", response_model=BidResponse)
async def handle_bid_action(bid_id: str, action: BidAction):
    """Accept, reject, or counter-offer a bid"""
    try:
        db = get_db()
        
        # Get the bid
        bid_doc = db.collection('bids').document(bid_id).get()
        if not bid_doc.exists:
            raise HTTPException(status_code=404, detail="Bid not found")
        
        bid_data = bid_doc.to_dict()
        
        # Update bid based on action
        if action.action == "accept":
            # VALIDATION: Only the appropriate party can accept bids
            # Buyers can only accept farmer bids, farmers can only accept buyer counter-offers
            
            # Skip campaign validation for cross-platform bidding  
            # campaign_doc = db.collection('campaigns').document(bid_data['campaignId']).get()
            # if not campaign_doc.exists:
            #     raise HTTPException(status_code=404, detail="Campaign not found")
            # campaign_data = campaign_doc.to_dict()
            # Assume buyer campaigns for cross-platform bidding
            campaign_user_type = "buyer"  # Default assumption
            bid_user_type = bid_data.get('bidderType')  # "buyer" or "farmer"
            
            # Rule: Campaign creators can only accept bids from the opposite type
            if campaign_user_type == bid_user_type:
                raise HTTPException(
                    status_code=400, 
                    detail=f"A {campaign_user_type} cannot accept their own bid. Only the opposite party can accept bids."
                )
            
            # Rule: Farmers can only accept buyer counter-offers (status counter_offered)
            # Buyers can accept any farmer bid (pending or counter_offered)
            if campaign_user_type == "farmer" and bid_data.get('status') != 'counter_offered':
                raise HTTPException(
                    status_code=400,
                    detail="Farmers can only accept buyer counter-offers, not initial farmer bids."
                )
            
            bid_data['status'] = 'accepted'
            message = "Bid accepted successfully"
            
            # ONLY ONE BID CAN BE APPROVED: Reject all other bids for this campaign
            campaign_id = bid_data['campaignId']
            all_bids = db.collection('bids').where('campaignId', '==', campaign_id).stream()
            
            for other_bid_doc in all_bids:
                other_bid_id = other_bid_doc.id
                other_bid_data = other_bid_doc.to_dict()
                
                # Reject all other pending bids except the accepted one
                if other_bid_id != bid_id and other_bid_data.get('status') in ['pending', 'counter_offered']:
                    db.collection('bids').document(other_bid_id).update({
                        'status': 'rejected',
                        'actionNotes': 'Automatically rejected - another bid was accepted',
                        'updatedAt': datetime.now().isoformat()
                    })
            
            # If accepted, create a contract
            await _create_contract_from_bid(db, bid_data, bid_id)
            
        elif action.action == "reject":
            bid_data['status'] = 'rejected'
            # Track who rejected the bid
            if bid_data.get('bidderType') == 'farmer':
                bid_data['rejectedBy'] = 'buyer'
                message = "Farmer bid rejected by buyer"
            else:
                bid_data['rejectedBy'] = 'farmer'
                message = "Buyer counter offer rejected by farmer"
            
        elif action.action == "counter_offer":
            if not action.counter_amount:
                raise HTTPException(status_code=400, detail="Counter amount required for counter offer")
            bid_data['status'] = 'counter_offered'
            bid_data['counterAmount'] = action.counter_amount
            message = f"Counter offer made: {action.counter_amount}"
            
            # Update the campaign's current bid to reflect the counter offer
            db.collection('campaigns').document(bid_data['campaignId']).update({
                'currentBid': action.counter_amount,
                'updatedAt': datetime.now().isoformat()
            })
        
        # Add notes if provided
        if action.notes:
            bid_data['actionNotes'] = action.notes
        
        bid_data['updatedAt'] = datetime.now().isoformat()
        
        # Update in database
        db.collection('bids').document(bid_id).update(bid_data)
        
        # Return updated bid
        bid_data['id'] = bid_id
        updated_bid = Bid(**bid_data)
        
        return BidResponse(bid=updated_bid, message=message)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error handling bid action: {str(e)}")

@router.get("/stats", response_model=BiddingStatsResponse)
async def get_bidding_stats():
    """Get overall bidding statistics"""
    try:
        db = get_db()
        
        # Count campaigns
        campaigns = list(db.collection('campaigns').stream())
        total_campaigns = len(campaigns)
        
        # Count active bids
        active_bids = list(db.collection('bids').where('status', '==', 'pending').stream())
        active_bids_count = len(active_bids)
        
        # Count successful contracts
        contracts = list(db.collection('contracts').stream())
        successful_contracts = len(contracts)
        
        # Calculate average bid amount
        all_bids = list(db.collection('bids').stream())
        bid_amounts = []
        
        for bid_doc in all_bids:
            bid_data = bid_doc.to_dict()
            if bid_data.get('bid_amount'):
                try:
                    amount_str = bid_data['bid_amount'].replace('₹', '').replace(',', '')
                    bid_amounts.append(float(amount_str))
                except:
                    pass
        
        average_bid = f"₹{sum(bid_amounts)/len(bid_amounts):,.0f}" if bid_amounts else None
        
        return BiddingStatsResponse(
            total_campaigns=total_campaigns,
            active_bids=active_bids_count,
            successful_contracts=successful_contracts,
            average_bid_amount=average_bid
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving bidding stats: {str(e)}")

@router.delete("/{bid_id}", response_model=MessageResponse)
async def delete_bid(bid_id: str):
    """Delete a bid"""
    try:
        db = get_db()
        
        # Check if bid exists
        bid_doc = db.collection('bids').document(bid_id).get()
        if not bid_doc.exists:
            raise HTTPException(status_code=404, detail="Bid not found")
        
        # Delete the bid
        db.collection('bids').document(bid_id).delete()
        
        return MessageResponse(message="Bid deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting bid: {str(e)}")

async def _create_contract_from_bid(db, bid_data, bid_id):
    """Helper function to create a contract when a bid is accepted"""
    try:
        # Get campaign data using correct field name
        campaign_id = bid_data.get('campaignId')
        if not campaign_id:
            print("Error: No campaignId found in bid_data")
            return
            
        campaign_doc = db.collection('campaigns').document(campaign_id).get()
        if not campaign_doc.exists:
            print(f"Error: Campaign {campaign_id} not found")
            return
        
        campaign_data = campaign_doc.to_dict()
        
        # Get the final agreed price (could be counter offer amount or original bid)
        agreed_price = bid_data.get('counterAmount') or bid_data.get('bidAmount', '')
        
        # Create contract data with correct field names
        contract_data = {
            'title': f"📄 Contract: {campaign_data.get('title', 'Unknown Campaign')}",
            'crop': campaign_data.get('crop', ''),
            'cropType': campaign_data.get('cropType', ''),
            'location': campaign_data.get('location', ''),
            'duration': campaign_data.get('duration', ''),
            'estimatedYield': bid_data.get('quantity', ''),
            'minimumQuotation': agreed_price,
            'currentBid': agreed_price,
            'totalBids': 1,
            'status': 'completed',  # Contracts start as completed/agreed
            'contractStatus': 'active',  # Separate field for contract lifecycle
            'farmerId': bid_data.get('bidderId') if bid_data.get('bidderType') == 'farmer' else campaign_data.get('userId'),
            'farmerName': bid_data.get('bidderName') if bid_data.get('bidderType') == 'farmer' else 'Unknown Farmer',
            'buyerId': bid_data.get('bidderId') if bid_data.get('bidderType') == 'buyer' else campaign_data.get('userId'),
            'buyerName': bid_data.get('bidderName') if bid_data.get('bidderType') == 'buyer' else 'Unknown Buyer',
            'agreedPrice': agreed_price,
            'originalCampaignId': campaign_id,
            'originalBidId': bid_id,
            'deliveryTerms': bid_data.get('deliveryTerms', 'Standard delivery terms'),
            'qualityGrade': bid_data.get('qualityGrade', 'Standard'),
            'contractNotes': f"Contract created from accepted bid. Original bid: {bid_data.get('bidAmount')}" + 
                           (f", Final negotiated price: {agreed_price}" if bid_data.get('counterAmount') else ""),
            'createdAt': datetime.now().isoformat(),
            'updatedAt': datetime.now().isoformat()
        }
        
        # Generate contract ID and save
        contract_id = str(uuid.uuid4())
        contract_data['id'] = contract_id
        db.collection('contracts').document(contract_id).set(contract_data)
        print(f"✅ Contract created successfully: {contract_id}")
        
        # Update campaign status to completed
        db.collection('campaigns').document(campaign_id).update({
            'status': 'completed',
            'contractId': contract_id,  # Link to the created contract
            'finalPrice': agreed_price,
            'updatedAt': datetime.now().isoformat()
        })
        print(f"✅ Campaign {campaign_id} marked as completed")
        
    except Exception as e:
        # Log error but don't fail the bid acceptance
        print(f"❌ Error creating contract from bid: {str(e)}")
        import traceback
        traceback.print_exc()
        pass 