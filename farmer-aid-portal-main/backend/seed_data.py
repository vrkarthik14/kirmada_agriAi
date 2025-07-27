"""
Seed script to populate Firestore with initial sample data
Run this script after setting up your Firestore credentials
"""

from app.services.firestore_config import init_firestore, get_db
from datetime import datetime

def seed_campaigns():
    """Add sample campaigns to Firestore"""
    campaigns = [
        {
            "title": "Premium Wheat Harvest 2024",
            "crop": "Wheat",
            "cropType": "Premium Winter Wheat",
            "location": "North Field, Punjab",
            "duration": "Oct 2024 - Apr 2025",
            "status": "active",
            "estimatedYield": "4.2 tons/hectare",
            "minimumQuotation": "₹25,000/ton",
            "currentBid": "₹28,500/ton",
            "totalBids": 12,
            "createdAt": datetime.now(),
            "updatedAt": datetime.now(),
        },
        {
            "title": "Organic Basmati Rice Campaign",
            "crop": "Rice",
            "cropType": "Organic Basmati",
            "location": "East Field, Punjab",
            "duration": "May 2024 - Sep 2024",
            "status": "completed",
            "estimatedYield": "5.8 tons/hectare",
            "minimumQuotation": "₹45,000/ton",
            "currentBid": "₹52,000/ton",
            "totalBids": 28,
            "createdAt": datetime.now(),
            "updatedAt": datetime.now(),
        },
        {
            "title": "Sweet Corn Pre-Order",
            "crop": "Corn",
            "cropType": "Premium Sweet Corn",
            "location": "South Field, Haryana",
            "duration": "Mar 2025 - Jul 2025",
            "status": "upcoming",
            "estimatedYield": "3.5 tons/hectare",
            "minimumQuotation": "₹18,000/ton",
            "currentBid": "₹20,200/ton",
            "totalBids": 6,
            "createdAt": datetime.now(),
            "updatedAt": datetime.now(),
        },
    ]
    
    db = get_db()
    campaigns_ref = db.collection("campaigns")
    
    for campaign in campaigns:
        campaigns_ref.add(campaign)
        print(f"✅ Added campaign: {campaign['title']}")

def seed_contracts():
    """Add sample contracts to Firestore"""
    contracts = [
        {
            "title": "Wheat Supply Contract - ABC Mills",
            "crop": "Wheat",
            "cropType": "Winter Wheat",
            "location": "North Field, Punjab",
            "duration": "Dec 2024 - Apr 2025",
            "status": "active",
            "estimatedYield": "4.2 tons/hectare",
            "minimumQuotation": "₹25,000/ton",
            "currentBid": "₹26,800/ton",
            "agreedPrice": "₹26,800/ton",
            "totalBids": 1,
            "currentStage": "soil_prep",
            "farmerName": "Rajesh Kumar",
            "buyerName": "ABC Mills Ltd",
            "createdAt": datetime.now(),
            "updatedAt": datetime.now(),
        },
        {
            "title": "Rice Export Contract - Global Foods",
            "crop": "Rice",
            "cropType": "Basmati Rice",
            "location": "East Field, Punjab",
            "duration": "Jan 2025 - May 2025",
            "status": "completed",
            "estimatedYield": "5.8 tons/hectare",
            "minimumQuotation": "₹45,000/ton",
            "currentBid": "₹47,500/ton",
            "agreedPrice": "₹47,500/ton",
            "totalBids": 1,
            "currentStage": "delivery",
            "farmerName": "Suresh Patel",
            "buyerName": "Global Foods Inc",
            "createdAt": datetime.now(),
            "updatedAt": datetime.now(),
        },
        {
            "title": "Organic Wheat Contract - EcoMills",
            "crop": "Wheat",
            "cropType": "Organic Winter Wheat",
            "location": "West Field, Haryana",
            "duration": "Sep 2024 - Mar 2025",
            "status": "completed",
            "estimatedYield": "3.8 tons/hectare",
            "minimumQuotation": "₹30,000/ton",
            "currentBid": "₹32,000/ton",
            "agreedPrice": "₹32,000/ton",
            "totalBids": 1,
            "currentStage": "delivery",
            "farmerName": "Amit Singh",
            "buyerName": "EcoMills Ltd",
            "createdAt": datetime.now(),
            "updatedAt": datetime.now(),
        },
    ]
    
    db = get_db()
    contracts_ref = db.collection("contracts")
    
    for contract in contracts:
        contracts_ref.add(contract)
        print(f"✅ Added contract: {contract['title']}")

def seed_orders():
    """Add sample orders to Firestore"""
    orders = [
        {
            "product": "Organic Fertilizer",
            "quantity": "500 kg",
            "supplier": "GreenGrow Supplies",
            "orderDate": "Dec 15, 2024",
            "deliveryDate": "Dec 22, 2024",
            "status": "shipped",
            "amount": "₹12,500",
            "createdAt": datetime.now(),
            "updatedAt": datetime.now(),
        },
        {
            "product": "Pesticide Spray",
            "quantity": "50 liters",
            "supplier": "AgroChem Ltd",
            "orderDate": "Dec 10, 2024",
            "deliveryDate": "Dec 18, 2024",
            "status": "delivered",
            "amount": "₹8,750",
            "createdAt": datetime.now(),
            "updatedAt": datetime.now(),
        },
        {
            "product": "Seeds - Hybrid Wheat",
            "quantity": "200 kg",
            "supplier": "SeedTech Solutions",
            "orderDate": "Dec 20, 2024",
            "deliveryDate": "Dec 28, 2024",
            "status": "pending",
            "amount": "₹15,200",
            "createdAt": datetime.now(),
            "updatedAt": datetime.now(),
        },
    ]
    
    db = get_db()
    orders_ref = db.collection("orders")
    
    for order in orders:
        orders_ref.add(order)
        print(f"✅ Added order: {order['product']}")

def main():
    """Run all seeding functions"""
    print("🌱 Starting database seeding...")
    
    # Initialize Firestore
    init_firestore()
    
    # Seed collections
    seed_campaigns()
    seed_contracts()
    seed_orders()
    
    print("✅ Database seeding completed!")

if __name__ == "__main__":
    main() 