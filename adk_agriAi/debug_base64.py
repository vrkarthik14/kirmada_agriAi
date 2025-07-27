#!/usr/bin/env python3
"""Debug script to understand the ADK ToolContext data format"""

import base64
import tempfile
import os
from PIL import Image

def debug_base64_data():
    """Test different base64 scenarios to understand the issue"""
    
    # Create a simple test image
    test_image = Image.new('RGB', (100, 100), color='red')
    
    # Save to memory and get base64
    import io
    buffer = io.BytesIO()
    test_image.save(buffer, format='PNG')
    buffer.seek(0)
    original_bytes = buffer.getvalue()
    base64_string = base64.b64encode(original_bytes).decode('utf-8')
    
    print("=== Base64 Debug Test ===")
    print(f"Original image bytes: {len(original_bytes)} bytes")
    print(f"Original header: {original_bytes[:20]}")
    print(f"Base64 string length: {len(base64_string)}")
    print(f"Base64 first 50 chars: {base64_string[:50]}")
    
    # Test scenario 1: Direct base64 decode
    print("\n--- Scenario 1: Direct base64.b64decode(string) ---")
    try:
        decoded1 = base64.b64decode(base64_string)
        print(f"Decoded size: {len(decoded1)} bytes")
        print(f"Decoded header: {decoded1[:20]}")
        print(f"Matches original: {decoded1 == original_bytes}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test scenario 2: String to bytes then base64 decode
    print("\n--- Scenario 2: base64.b64decode(string.encode()) ---")
    try:
        decoded2 = base64.b64decode(base64_string.encode('utf-8'))
        print(f"Decoded size: {len(decoded2)} bytes")
        print(f"Decoded header: {decoded2[:20]}")
        print(f"Matches original: {decoded2 == original_bytes}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test scenario 3: What if data is already bytes but looks like base64?
    print("\n--- Scenario 3: Bytes that look like base64 ---")
    base64_bytes = base64_string.encode('utf-8')
    print(f"Base64 as bytes: {len(base64_bytes)} bytes")
    print(f"First 20 bytes: {base64_bytes[:20]}")
    
    try:
        decoded3 = base64.b64decode(base64_bytes.decode('utf-8'))
        print(f"Decoded size: {len(decoded3)} bytes")
        print(f"Decoded header: {decoded3[:20]}")
        print(f"Matches original: {decoded3 == original_bytes}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test scenario 4: Corrupt base64 (similar to what we're seeing)
    print("\n--- Scenario 4: What corrupt data looks like ---")
    # Simulate what happens if we incorrectly decode
    corrupt_data = original_bytes[:95]  # Take first 95 bytes like in error
    print(f"Corrupt data size: {len(corrupt_data)} bytes")
    print(f"Corrupt header: {corrupt_data[:20]}")
    
    # Try to save and open corrupt data
    try:
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
            temp_file.write(corrupt_data)
            temp_file_path = temp_file.name
        
        # This should fail like in the error
        img = Image.open(temp_file_path)
        print("Corrupt data opened successfully (unexpected)")
        os.unlink(temp_file_path)
    except Exception as e:
        print(f"Expected error with corrupt data: {e}")
        os.unlink(temp_file_path)

def test_different_data_access_patterns():
    """Test different ways to access inline_data.data"""
    
    # Create test data
    test_image = Image.new('RGB', (50, 50), color='blue')
    import io
    buffer = io.BytesIO()
    test_image.save(buffer, format='JPEG')
    buffer.seek(0)
    original_bytes = buffer.getvalue()
    base64_string = base64.b64encode(original_bytes).decode('utf-8')
    
    print("\n=== Data Access Pattern Test ===")
    print(f"Original JPEG size: {len(original_bytes)} bytes")
    print(f"Base64 string size: {len(base64_string)} chars")
    
    # Simulate different data types that might come from ADK
    test_cases = [
        ("Raw bytes", original_bytes),
        ("Base64 string", base64_string),
        ("Base64 as bytes", base64_string.encode('utf-8')),
        ("Truncated bytes", original_bytes[:95]),  # Like in the error
        ("Truncated base64", base64_string[:95]),
    ]
    
    for name, data in test_cases:
        print(f"\n--- Testing: {name} ---")
        print(f"Data type: {type(data)}")
        print(f"Data size: {len(data)}")
        print(f"First 20: {data[:20] if len(data) >= 20 else data}")
        
        # Try to process this data like our function would
        try:
            if isinstance(data, str):
                print("  -> Treating as base64 string")
                image_data = base64.b64decode(data)
            elif isinstance(data, bytes):
                # Check if it looks like base64
                try:
                    decoded_test = base64.b64decode(data.decode('utf-8'))
                    if len(decoded_test) > len(data):
                        print("  -> Treating as base64 in bytes")
                        image_data = decoded_test
                    else:
                        print("  -> Treating as raw bytes")
                        image_data = data
                except:
                    print("  -> Treating as raw bytes")
                    image_data = data
            
            print(f"  -> Final image data: {len(image_data)} bytes")
            print(f"  -> Header: {image_data[:10]}")
            
            # Try to save and open
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
                temp_file.write(image_data)
                temp_file_path = temp_file.name
            
            img = Image.open(temp_file_path)
            print(f"  -> ✅ Successfully opened: {img.format}, {img.mode}, {img.size}")
            os.unlink(temp_file_path)
            
        except Exception as e:
            print(f"  -> ❌ Error: {e}")
            try:
                os.unlink(temp_file_path)
            except:
                pass

if __name__ == "__main__":
    debug_base64_data()
    test_different_data_access_patterns()
    
    print("\n=== Summary ===")
    print("The 95-byte error suggests:")
    print("1. Data is being truncated somewhere")
    print("2. Base64 decoding is failing")
    print("3. Data format from ADK might be different than expected")
    print("\nNext step: Add more debugging to agent.py to see actual ADK data")
