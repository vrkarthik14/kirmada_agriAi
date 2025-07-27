import firebase_admin
from firebase_admin import credentials, firestore
import os
from typing import Optional, Dict, Any
import json
from datetime import datetime
import uuid

# Global Firestore client
db: Optional[firestore.Client] = None
mock_db: Dict[str, Dict[str, Any]] = {}

class MockFirestoreCollection:
    """Mock Firestore collection for testing without credentials"""
    
    def __init__(self, collection_name: str):
        self.collection_name = collection_name
        if collection_name not in mock_db:
            mock_db[collection_name] = {}
    
    def add(self, data: Dict[str, Any]) -> str:
        """Add a document and return its ID"""
        doc_id = f"doc_{len(mock_db[self.collection_name]) + 1}"
        mock_db[self.collection_name][doc_id] = data
        return doc_id
    
    def document(self, doc_id: Optional[str] = None):
        """Get a document reference"""
        if doc_id is None:
            # Generate a new document ID when none is provided
            doc_id = str(uuid.uuid4())
        return MockFirestoreDocument(self.collection_name, doc_id)
    
    def where(self, field, operator, value):
        """Filter documents by field value"""
        # Create a filtered collection that stores the query criteria
        filtered_collection = MockFirestoreCollection(self.collection_name)
        filtered_collection._query_field = field
        filtered_collection._query_operator = operator 
        filtered_collection._query_value = value
        return filtered_collection

    def stream(self):
        """Stream all documents in the collection, applying any filters"""
        documents = []
        collection_data = mock_db.get(self.collection_name, {})
        
        for doc_id, data in collection_data.items():
            # Apply filter if this is a filtered collection
            if hasattr(self, '_query_field'):
                field = self._query_field
                operator = self._query_operator
                value = self._query_value
                
                if field in data:
                    if operator == "==" and data[field] == value:
                        documents.append(MockFirestoreDocument(self.collection_name, doc_id, data))
            else:
                # No filter - return all documents
                documents.append(MockFirestoreDocument(self.collection_name, doc_id, data))
                
        return documents

class MockFirestoreDocument:
    """Mock Firestore document for testing"""
    
    def __init__(self, collection_name: str, doc_id: str, data: Optional[Dict[str, Any]] = None):
        self.collection_name = collection_name
        self.id = doc_id
        self._data = data
    
    def get(self):
        """Get document data"""
        return MockDocumentSnapshot(self.collection_name, self.id)
    
    def set(self, data: Dict[str, Any]):
        """Set document data"""
        mock_db[self.collection_name][self.id] = data
    
    def update(self, data: Dict[str, Any]):
        """Update document data"""
        if self.id in mock_db[self.collection_name]:
            mock_db[self.collection_name][self.id].update(data)
    
    def delete(self):
        """Delete document"""
        if self.id in mock_db[self.collection_name]:
            del mock_db[self.collection_name][self.id]
    
    def to_dict(self):
        """Return document data as dictionary"""
        return self._data if self._data is not None else mock_db.get(self.collection_name, {}).get(self.id, {})

class MockDocumentSnapshot:
    """Mock document snapshot"""
    
    def __init__(self, collection_name: str, doc_id: str):
        self.collection_name = collection_name
        self.id = doc_id
    
    @property
    def exists(self) -> bool:
        return self.id in mock_db.get(self.collection_name, {})
    
    def to_dict(self) -> Dict[str, Any]:
        return mock_db[self.collection_name].get(self.id, {})

class MockFirestoreClient:
    """Mock Firestore client for testing"""
    
    def collection(self, collection_name: str):
        return MockFirestoreCollection(collection_name)

def init_firestore():
    """Initialize Firestore database connection"""
    global db
    
    try:
        # Check if Firebase app is already initialized
        firebase_admin.get_app()
        db = firestore.client()
        print("✅ Firestore initialized with real credentials")
    except ValueError:
        # Try to initialize with service account key
        try:
            key_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY", "serviceAccountKey.json")
            if os.path.exists(key_path):
                cred = credentials.Certificate(key_path)
                firebase_admin.initialize_app(cred)
                db = firestore.client()
                print("✅ Firestore initialized with service account key")
            else:
                # Try application default credentials
                try:
                    cred = credentials.ApplicationDefault()
                    firebase_admin.initialize_app(cred)
                    db = firestore.client()
                    print("✅ Firestore initialized with application default credentials")
                except Exception as e:
                    print(f"⚠️  Could not initialize Firestore with credentials: {e}")
                    print("🧪 Using mock Firestore for testing...")
                    db = MockFirestoreClient()
        except Exception as e:
            print(f"⚠️  Could not initialize Firestore: {e}")
            print("🧪 Using mock Firestore for testing...")
            db = MockFirestoreClient()

def get_db():
    """Get Firestore database client"""
    if db is None:
        init_firestore()
    return db

def get_mock_data():
    """Get mock database data for debugging"""
    return mock_db

def clear_mock_data():
    """Clear mock database data"""
    global mock_db
    mock_db = {} 