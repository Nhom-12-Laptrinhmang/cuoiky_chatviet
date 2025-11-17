#!/usr/bin/env python
"""
Test script to verify profile update with image upload works correctly
Run this to diagnose issues with profile updates
"""

import os
import sys
import requests
import json
from pathlib import Path

# Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'

def print_pass(msg):
    print(f"{GREEN}✓ {msg}{RESET}")

def print_fail(msg):
    print(f"{RED}✗ {msg}{RESET}")

def print_warn(msg):
    print(f"{YELLOW}⚠ {msg}{RESET}")

def check_backend():
    """Check if backend is running"""
    print("\n=== Checking Backend ===")
    try:
        response = requests.get('http://localhost:5000/users', timeout=3)
        print_pass(f"Backend is running (status: {response.status_code})")
        return True
    except requests.exceptions.ConnectionError:
        print_fail("Backend is NOT running on localhost:5000")
        print("   Start with: cd server && python app.py")
        return False
    except Exception as e:
        print_fail(f"Error checking backend: {e}")
        return False

def check_uploads_dir():
    """Check if uploads directory exists"""
    print("\n=== Checking Uploads Directory ===")
    uploads_path = Path('server/storage/uploads')
    if uploads_path.exists() and uploads_path.is_dir():
        print_pass(f"Uploads directory exists: {uploads_path.absolute()}")
        # Check write permissions
        test_file = uploads_path / '.write_test'
        try:
            test_file.write_text('test')
            test_file.unlink()
            print_pass("Uploads directory is writable")
            return True
        except Exception as e:
            print_fail(f"Uploads directory is NOT writable: {e}")
            return False
    else:
        print_warn(f"Uploads directory does not exist: {uploads_path}")
        print("   Creating it now...")
        try:
            uploads_path.mkdir(parents=True, exist_ok=True)
            print_pass("Uploads directory created")
            return True
        except Exception as e:
            print_fail(f"Failed to create uploads directory: {e}")
            return False

def test_upload_endpoint():
    """Test the upload endpoint"""
    print("\n=== Testing Upload Endpoint ===")
    # Create a test image (small PNG)
    test_image = Path('test_image.png')
    # Minimal PNG 1x1 transparent
    png_data = bytes([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0A, 0x49, 0x44, 0x41, 0x54, 0x08, 0x5B, 0x63, 0x00, 0x00, 0x00, 0x02,
        0x00, 0x01, 0xE5, 0x27, 0xDE, 0xFC, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
        0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ])
    test_image.write_bytes(png_data)
    
    try:
        with open(test_image, 'rb') as f:
            files = {'avatar': f}
            headers = {'Authorization': 'Bearer test_token'}
            response = requests.post(
                'http://localhost:5000/uploads/avatar',
                files=files,
                headers=headers,
                timeout=5
            )
        
        if response.status_code == 200:
            data = response.json()
            if 'avatar_url' in data:
                print_pass(f"Upload endpoint works! Avatar URL: {data['avatar_url']}")
                return True
            else:
                print_fail(f"Upload succeeded but no avatar_url in response: {data}")
                return False
        else:
            print_fail(f"Upload endpoint returned {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_fail(f"Error testing upload: {e}")
        return False
    finally:
        test_image.unlink(missing_ok=True)

def test_user_update():
    """Test user profile update endpoint"""
    print("\n=== Testing User Update Endpoint ===")
    try:
        # First get a valid token by logging in
        login_response = requests.post(
            'http://localhost:5000/login',
            json={'username': 'alice', 'password': 'password'},
            timeout=5
        )
        
        if login_response.status_code != 200:
            print_fail(f"Login failed: {login_response.text}")
            return False
        
        token = login_response.json().get('token')
        if not token:
            print_fail("Login succeeded but no token returned")
            return False
        
        # Now try to update profile
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.patch(
            'http://localhost:5000/users/me',
            json={'display_name': 'Test User'},
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            print_pass("User update endpoint works!")
            return True
        else:
            print_fail(f"Update endpoint returned {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_fail(f"Error testing user update: {e}")
        return False

def main():
    print("\n" + "="*60)
    print("PROFILE UPDATE TEST SUITE")
    print("="*60)
    
    results = []
    
    # Run tests
    results.append(("Backend Running", check_backend()))
    results.append(("Uploads Directory", check_uploads_dir()))
    
    # Only test endpoints if backend is running
    if results[0][1]:
        results.append(("Upload Endpoint", test_upload_endpoint()))
        results.append(("User Update Endpoint", test_user_update()))
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = f"{GREEN}PASS{RESET}" if result else f"{RED}FAIL{RESET}"
        print(f"{test_name}: {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print_pass("All tests passed! Profile update should work.")
    else:
        print_warn("Some tests failed. Check the errors above.")
    
    print("="*60 + "\n")

if __name__ == '__main__':
    main()
