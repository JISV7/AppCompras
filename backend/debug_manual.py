# Place this in C:\Users\destr\AppCompras\backend
import sys
import os

# Add current folder to path so we can import src
sys.path.append(os.getcwd())

try:
    from src.core.security import get_password_hash
    
    print("--- TESTING SECURITY MODULE ---")
    test_password = "strongpassword123"
    print(f"Attempting to hash: '{test_password}' (Type: {type(test_password)})")
    
    # This is the moment of truth
    hashed = get_password_hash(test_password)
    
    print(f"SUCCESS! Hash result: {hashed}")

except Exception as e:
    print(f"\nCRITICAL FAILURE: {e}")
    import traceback
    traceback.print_exc()