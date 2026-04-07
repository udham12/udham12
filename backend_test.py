#!/usr/bin/env python3
"""
HeartEase Backend API Testing Suite
Tests all backend endpoints systematically
"""

import asyncio
import aiohttp
import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://emotional-support-25.preview.emergentagent.com/api"

# Test credentials from /app/memory/test_credentials.md
import time
timestamp = int(time.time())

TEST_USER = {
    "email": f"user{timestamp}@test.com",
    "password": "test123",
    "name": "Test User",
    "phone": "+1234567890",
    "gender": "female",
    "role": "user",
    "gender_preference": "female"
}

TEST_AGENT = {
    "email": f"agent{timestamp}@test.com", 
    "password": "test123",
    "name": "Test Agent",
    "phone": "+0987654321",
    "gender": "female",
    "role": "agent"
}

class HeartEaseAPITester:
    def __init__(self):
        self.session = None
        self.user_token = None
        self.agent_token = None
        self.user_id = None
        self.agent_id = None
        self.session_id = None
        self.payment_id = None
        self.results = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.results.append({
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "response": response_data
        })
        print(f"{status} {test_name}")
        if details:
            print(f"    {details}")
        if not success and response_data:
            print(f"    Response: {response_data}")
        print()
    
    async def make_request(self, method: str, endpoint: str, data: Dict = None, 
                          token: str = None, params: Dict = None) -> tuple[bool, Any]:
        """Make HTTP request and return (success, response_data)"""
        url = f"{BASE_URL}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            async with self.session.request(
                method, url, json=data, headers=headers, params=params
            ) as response:
                try:
                    response_data = await response.json()
                except:
                    response_data = await response.text()
                
                return response.status < 400, response_data
                
        except Exception as e:
            return False, str(e)
    
    # ===========================
    # AUTHENTICATION TESTS
    # ===========================
    
    async def test_user_registration(self):
        """Test user registration"""
        success, response = await self.make_request("POST", "/auth/register", TEST_USER)
        
        if success and "access_token" in response:
            self.user_token = response["access_token"]
            self.user_id = response["user"]["id"]
            self.log_result("User Registration", True, f"User ID: {self.user_id}")
        else:
            self.log_result("User Registration", False, "Failed to register user", response)
    
    async def test_agent_registration(self):
        """Test agent registration"""
        success, response = await self.make_request("POST", "/auth/register", TEST_AGENT)
        
        if success and "access_token" in response:
            self.agent_token = response["access_token"]
            self.agent_id = response["user"]["id"]
            self.log_result("Agent Registration", True, f"Agent ID: {self.agent_id}")
        else:
            self.log_result("Agent Registration", False, "Failed to register agent", response)
    
    async def test_user_login(self):
        """Test user login"""
        login_data = {"email": TEST_USER["email"], "password": TEST_USER["password"]}
        success, response = await self.make_request("POST", "/auth/login", login_data)
        
        if success and "access_token" in response:
            self.log_result("User Login", True, "Login successful")
        else:
            self.log_result("User Login", False, "Login failed", response)
    
    async def test_agent_login(self):
        """Test agent login"""
        login_data = {"email": TEST_AGENT["email"], "password": TEST_AGENT["password"]}
        success, response = await self.make_request("POST", "/auth/login", login_data)
        
        if success and "access_token" in response:
            self.log_result("Agent Login", True, "Login successful")
        else:
            self.log_result("Agent Login", False, "Login failed", response)
    
    async def test_get_user_profile(self):
        """Test get user profile"""
        if not self.user_token:
            self.log_result("Get User Profile", False, "No user token available")
            return
            
        success, response = await self.make_request("GET", "/auth/profile", token=self.user_token)
        
        if success and "email" in response:
            self.log_result("Get User Profile", True, f"Profile retrieved for {response['email']}")
        else:
            self.log_result("Get User Profile", False, "Failed to get profile", response)
    
    async def test_update_user_profile(self):
        """Test update user profile"""
        if not self.user_token:
            self.log_result("Update User Profile", False, "No user token available")
            return
            
        # Use query parameters instead of JSON body
        params = {
            "name": "Updated Test User",
            "phone": "+1111111111"
        }
        
        success, response = await self.make_request("PUT", "/auth/profile", params=params, token=self.user_token)
        
        if success and response.get("name") == "Updated Test User":
            self.log_result("Update User Profile", True, "Profile updated successfully")
        else:
            self.log_result("Update User Profile", False, "Failed to update profile", response)
    
    # ===========================
    # AGENT MANAGEMENT TESTS
    # ===========================
    
    async def test_toggle_agent_availability(self):
        """Test toggle agent availability"""
        if not self.agent_token:
            self.log_result("Toggle Agent Availability", False, "No agent token available")
            return
            
        success, response = await self.make_request("PUT", "/agents/toggle-availability", token=self.agent_token)
        
        if success and "is_available" in response:
            self.log_result("Toggle Agent Availability", True, f"Availability: {response['is_available']}")
        else:
            self.log_result("Toggle Agent Availability", False, "Failed to toggle availability", response)
    
    async def test_get_available_agents(self):
        """Test get available agents"""
        success, response = await self.make_request("GET", "/agents/available")
        
        if success and isinstance(response, list):
            self.log_result("Get Available Agents", True, f"Found {len(response)} available agents")
        else:
            self.log_result("Get Available Agents", False, "Failed to get agents", response)
    
    async def test_get_available_agents_with_filter(self):
        """Test get available agents with gender filter"""
        success, response = await self.make_request("GET", "/agents/available", params={"gender": "female"})
        
        if success and isinstance(response, list):
            self.log_result("Get Available Agents (Filtered)", True, f"Found {len(response)} female agents")
        else:
            self.log_result("Get Available Agents (Filtered)", False, "Failed to get filtered agents", response)
    
    async def test_agent_dashboard(self):
        """Test agent dashboard"""
        if not self.agent_token:
            self.log_result("Agent Dashboard", False, "No agent token available")
            return
            
        success, response = await self.make_request("GET", "/agents/dashboard", token=self.agent_token)
        
        if success and "is_available" in response:
            self.log_result("Agent Dashboard", True, f"Dashboard loaded, earnings: ${response.get('total_earnings', 0)}")
        else:
            self.log_result("Agent Dashboard", False, "Failed to get dashboard", response)
    
    # ===========================
    # SESSION MANAGEMENT TESTS
    # ===========================
    
    async def test_start_session(self):
        """Test start session"""
        if not self.user_token or not self.agent_id:
            self.log_result("Start Session", False, "Missing user token or agent ID")
            return
            
        session_data = {
            "agent_id": self.agent_id,
            "session_type": "chat"
        }
        
        success, response = await self.make_request("POST", "/sessions/start", session_data, self.user_token)
        
        if success and "_id" in response:
            self.session_id = response["_id"]
            self.log_result("Start Session", True, f"Session created: {self.session_id}")
        else:
            self.log_result("Start Session", False, "Failed to start session", response)
    
    async def test_accept_session(self):
        """Test accept session"""
        if not self.agent_token or not self.session_id:
            self.log_result("Accept Session", False, "Missing agent token or session ID")
            return
            
        success, response = await self.make_request("PUT", f"/sessions/accept/{self.session_id}", token=self.agent_token)
        
        if success and "message" in response:
            self.log_result("Accept Session", True, "Session accepted successfully")
        else:
            self.log_result("Accept Session", False, "Failed to accept session", response)
    
    async def test_get_active_session(self):
        """Test get active session"""
        if not self.user_token:
            self.log_result("Get Active Session", False, "No user token available")
            return
            
        success, response = await self.make_request("GET", "/sessions/active", token=self.user_token)
        
        if success:
            if response:
                self.log_result("Get Active Session", True, f"Active session found: {response.get('_id')}")
            else:
                self.log_result("Get Active Session", True, "No active session (expected)")
        else:
            self.log_result("Get Active Session", False, "Failed to get active session", response)
    
    async def test_end_session(self):
        """Test end session"""
        if not self.user_token or not self.session_id:
            self.log_result("End Session", False, "Missing user token or session ID")
            return
            
        # End session with duration and amount as query parameters
        params = {"duration": 300, "amount": 50.0}
        success, response = await self.make_request("PUT", f"/sessions/end/{self.session_id}", params=params, token=self.user_token)
        
        if success and "message" in response:
            self.log_result("End Session", True, "Session ended successfully")
        else:
            self.log_result("End Session", False, "Failed to end session", response)
    
    async def test_session_history(self):
        """Test get session history"""
        if not self.user_token:
            self.log_result("Session History", False, "No user token available")
            return
            
        success, response = await self.make_request("GET", "/sessions/history", token=self.user_token)
        
        if success and isinstance(response, list):
            self.log_result("Session History", True, f"Found {len(response)} completed sessions")
        else:
            self.log_result("Session History", False, "Failed to get session history", response)
    
    # ===========================
    # AI MOOD TRACKING TESTS
    # ===========================
    
    async def test_mood_checkin(self):
        """Test mood check-in with AI affirmation"""
        if not self.user_token:
            self.log_result("Mood Check-in", False, "No user token available")
            return
            
        mood_data = {
            "mood_score": 7,
            "note": "Feeling pretty good today, had a productive morning"
        }
        
        success, response = await self.make_request("POST", "/mood/checkin", mood_data, self.user_token)
        
        if success and "affirmation" in response:
            affirmation = response["affirmation"]
            self.log_result("Mood Check-in", True, f"AI affirmation generated: {affirmation[:50]}...")
        else:
            self.log_result("Mood Check-in", False, "Failed to check-in mood", response)
    
    async def test_mood_history(self):
        """Test get mood history"""
        if not self.user_token:
            self.log_result("Mood History", False, "No user token available")
            return
            
        success, response = await self.make_request("GET", "/mood/history", token=self.user_token)
        
        if success and isinstance(response, list):
            self.log_result("Mood History", True, f"Found {len(response)} mood entries")
        else:
            self.log_result("Mood History", False, "Failed to get mood history", response)
    
    async def test_daily_affirmation(self):
        """Test get daily AI-generated affirmation"""
        if not self.user_token:
            self.log_result("Daily Affirmation", False, "No user token available")
            return
            
        success, response = await self.make_request("GET", "/affirmations/daily", token=self.user_token)
        
        if success and "affirmation" in response:
            affirmation = response["affirmation"]
            self.log_result("Daily Affirmation", True, f"Daily affirmation: {affirmation[:50]}...")
        else:
            self.log_result("Daily Affirmation", False, "Failed to get daily affirmation", response)
    
    # ===========================
    # PAYMENT TESTS
    # ===========================
    
    async def test_initiate_payment(self):
        """Test initiate mock payment"""
        if not self.user_token or not self.session_id:
            self.log_result("Initiate Payment", False, "Missing user token or session ID")
            return
            
        payment_data = {
            "session_id": self.session_id,
            "amount": 50.0
        }
        
        success, response = await self.make_request("POST", "/payments/initiate", payment_data, self.user_token)
        
        if success and "_id" in response:
            self.payment_id = response["_id"]
            self.log_result("Initiate Payment", True, f"Payment initiated: {self.payment_id}")
        else:
            self.log_result("Initiate Payment", False, "Failed to initiate payment", response)
    
    async def test_verify_payment(self):
        """Test verify mock payment"""
        if not self.user_token or not self.payment_id:
            self.log_result("Verify Payment", False, "Missing user token or payment ID")
            return
            
        success, response = await self.make_request("POST", f"/payments/verify/{self.payment_id}", token=self.user_token)
        
        if success and response.get("status") == "completed":
            self.log_result("Verify Payment", True, "Payment verified successfully")
        else:
            self.log_result("Verify Payment", False, "Failed to verify payment", response)
    
    # ===========================
    # SAFETY TESTS
    # ===========================
    
    async def test_create_report(self):
        """Test create safety report"""
        if not self.user_token or not self.agent_id:
            self.log_result("Create Report", False, "Missing user token or agent ID")
            return
            
        report_data = {
            "reported_id": self.agent_id,
            "reason": "inappropriate_behavior",
            "details": "Test report for safety feature verification",
            "session_id": self.session_id
        }
        
        success, response = await self.make_request("POST", "/reports/create", report_data, self.user_token)
        
        if success and "message" in response:
            self.log_result("Create Report", True, "Safety report created successfully")
        else:
            self.log_result("Create Report", False, "Failed to create report", response)
    
    # ===========================
    # MAIN TEST RUNNER
    # ===========================
    
    async def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting HeartEase Backend API Tests")
        print("=" * 50)
        
        # Authentication Flow
        print("\n📝 AUTHENTICATION TESTS")
        await self.test_user_registration()
        await self.test_agent_registration()
        await self.test_user_login()
        await self.test_agent_login()
        await self.test_get_user_profile()
        await self.test_update_user_profile()
        
        # Agent Management
        print("\n👥 AGENT MANAGEMENT TESTS")
        await self.test_toggle_agent_availability()
        await self.test_get_available_agents()
        await self.test_get_available_agents_with_filter()
        await self.test_agent_dashboard()
        
        # Session Management
        print("\n💬 SESSION MANAGEMENT TESTS")
        await self.test_start_session()
        await self.test_accept_session()
        await self.test_get_active_session()
        await self.test_end_session()
        await self.test_session_history()
        
        # AI Mood Tracking
        print("\n🧠 AI MOOD TRACKING TESTS")
        await self.test_mood_checkin()
        await self.test_mood_history()
        await self.test_daily_affirmation()
        
        # Payment System
        print("\n💳 PAYMENT SYSTEM TESTS")
        await self.test_initiate_payment()
        await self.test_verify_payment()
        
        # Safety Features
        print("\n🛡️ SAFETY FEATURE TESTS")
        await self.test_create_report()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for r in self.results if r["success"])
        failed = len(self.results) - passed
        
        print(f"Total Tests: {len(self.results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.results)*100):.1f}%")
        
        if failed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.results:
                if not result["success"]:
                    print(f"  ❌ {result['test']}: {result['details']}")
        
        print("\n🎯 CRITICAL FEATURES STATUS:")
        critical_tests = [
            "User Registration", "Agent Registration", "User Login", "Agent Login",
            "Toggle Agent Availability", "Start Session", "Accept Session", 
            "Mood Check-in", "Daily Affirmation"
        ]
        
        for test_name in critical_tests:
            result = next((r for r in self.results if r["test"] == test_name), None)
            if result:
                status = "✅" if result["success"] else "❌"
                print(f"  {status} {test_name}")

async def main():
    """Main test runner"""
    async with HeartEaseAPITester() as tester:
        await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())