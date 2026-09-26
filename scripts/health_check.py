import requests
import time

# Configuration
BASE_URL = "http://localhost:3000"
API_URL = "http://localhost:5000/api"
ADMIN_USER = "staffERBE"
ADMIN_PASS = "hijauERBE"

PUBLIC_ROUTES = [
    "/",
    "/members",
    "/music",
    "/media",
    "/schedule",
    "/shop",
    "/faq",
    "/story",
    "/admin/login"
]

def check_status(url):
    try:
        response = requests.get(url, timeout=5)
        return response.status_code
    except Exception as e:
        return f"Error: {str(e)}"

def test_public_routes():
    print("\n--- Testing Public Routes ---")
    results = []
    for route in PUBLIC_ROUTES:
        status = check_status(BASE_URL + route)
        print(f"[{status}] {route}")
        if status != 200:
            results.append(f"Broken Route: {route} (Status: {status})")
    return results

def test_admin_login():
    print("\n--- Testing Admin Login ---")
    try:
        response = requests.post(f"{API_URL}/auth/login", json={
            "username": ADMIN_USER,
            "password": ADMIN_PASS
        }, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print("[200] Login Successful")
                return data.get("token")
            else:
                print(f"[ERROR] Login failed: {data.get('error')}")
        else:
            print(f"[{response.status_code}] Login failed")
    except Exception as e:
        print(f"Error: {str(e)}")
    return None

def test_api_endpoints(token):
    if not token:
        return ["Skipping API tests: No token"]
    
    print("\n--- Testing API Endpoints ---")
    headers = {"Authorization": f"Bearer {token}"}
    endpoints = [
        "/orders",
        "/members",
        "/events",
        "/config",
        "/merchandise",
        "/merch-orders"
    ]
    
    errors = []
    for ep in endpoints:
        try:
            # Note: API might require Authorization header if implemented
            response = requests.get(f"{API_URL}{ep}", headers=headers, timeout=5)
            print(f"[{response.status_code}] {ep}")
            if response.status_code != 200:
                errors.append(f"API Error: {ep} (Status: {response.status_code})")
        except Exception as e:
            errors.append(f"API Exception: {ep} ({str(e)})")
    return errors

def run_tests():
    print("Starting Web Application Test...")
    print(f"Target: {BASE_URL}")
    print(f"API: {API_URL}")
    
    errors = []
    
    # 1. Test Public Routes
    public_errors = test_public_routes()
    errors.extend(public_errors)
    
    # 2. Test Admin Login
    token = test_admin_login()
    if not token:
        errors.append("Admin Login Failed: Correct credentials provided but login rejected or server down.")
    
    # 3. Test Private API Endpoints
    api_errors = test_api_endpoints(token)
    errors.extend(api_errors)
    
    print("\n--- Summary ---")
    if not errors:
        print("All tests passed successfully!")
    else:
        print(f"Found {len(errors)} issues:")
        for err in errors:
            print(f"- {err}")

if __name__ == "__main__":
    run_tests()
