#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:8000"

def test_register():
    """Test user registration"""
    print("\n=== Testing /register ===")
    data = {
        "username": "user1",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/register", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.json()

def test_login():
    """Test user login"""
    print("\n=== Testing /login ===")
    data = {
        "username": "user1",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/login", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.json()

def test_get_users():
    """Test get all users"""
    print("\n=== Testing GET /users ===")
    response = requests.get(f"{BASE_URL}/users")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_forgot_password():
    """Test forgot password OTP"""
    print("\n=== Testing /forgot-password ===")
    data = {
        "username": "user1"
    }
    response = requests.post(f"{BASE_URL}/forgot-password", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

if __name__ == "__main__":
    try:
        test_register()
        test_login()
        test_get_users()
        test_forgot_password()
        print("\n✅ All tests completed!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
