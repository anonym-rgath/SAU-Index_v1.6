"""
Tests for retroactive fine entry feature.
Feature: Users can optionally specify a date when creating fines to enter them retroactively.
Business logic: Fiscal year runs from 01.08 to 31.07 of next year.
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestRetroactiveFines:
    """Tests for retroactive fine entry with optional date parameter"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        # Get existing member and fine type for testing
        members_resp = requests.get(f"{BASE_URL}/api/members", headers=self.headers)
        assert members_resp.status_code == 200
        members = members_resp.json()
        assert len(members) > 0, "Need at least one member for testing"
        self.test_member_id = members[0]["id"]
        
        fine_types_resp = requests.get(f"{BASE_URL}/api/fine-types", headers=self.headers)
        assert fine_types_resp.status_code == 200
        fine_types = fine_types_resp.json()
        assert len(fine_types) > 0, "Need at least one fine type for testing"
        self.test_fine_type_id = fine_types[0]["id"]
    
    def test_create_fine_without_date_uses_current_date(self):
        """POST /api/fines without 'date' parameter creates fine with current date"""
        payload = {
            "member_id": self.test_member_id,
            "fine_type_id": self.test_fine_type_id,
            "amount": 1.50,
            "notes": "TEST_no_date_fine"
        }
        
        response = requests.post(f"{BASE_URL}/api/fines", json=payload, headers=self.headers)
        
        assert response.status_code == 200, f"Create fine failed: {response.text}"
        data = response.json()
        
        # Verify fine was created
        assert "id" in data
        assert data["member_id"] == self.test_member_id
        assert data["amount"] == 1.50
        
        # Verify date is today (within reasonable tolerance)
        fine_date = datetime.fromisoformat(data["date"].replace("Z", "+00:00"))
        today = datetime.now()
        # Allow some timezone difference
        assert abs((fine_date.replace(tzinfo=None) - today).days) <= 1, "Date should be today"
        
        # Verify fiscal year is calculated correctly for current date
        assert "fiscal_year" in data
        assert "/" in data["fiscal_year"]  # Format: "YYYY/YYYY"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/fines/{data['id']}", headers=self.headers)
        print(f"✓ Fine without date created with current date: {data['date']}")
        print(f"✓ Fiscal year calculated: {data['fiscal_year']}")
    
    def test_create_fine_with_retroactive_date(self):
        """POST /api/fines with 'date' parameter creates fine with specified date"""
        # Use a date in October 2024 - should be fiscal year 2024/2025
        retroactive_date = "2024-10-15"
        
        payload = {
            "member_id": self.test_member_id,
            "fine_type_id": self.test_fine_type_id,
            "amount": 2.50,
            "date": retroactive_date,
            "notes": "TEST_retroactive_fine_oct"
        }
        
        response = requests.post(f"{BASE_URL}/api/fines", json=payload, headers=self.headers)
        
        assert response.status_code == 200, f"Create fine failed: {response.text}"
        data = response.json()
        
        # Verify date is the specified retroactive date
        fine_date = datetime.fromisoformat(data["date"].replace("Z", "+00:00"))
        expected_date = datetime(2024, 10, 15)
        assert fine_date.year == expected_date.year
        assert fine_date.month == expected_date.month
        assert fine_date.day == expected_date.day
        
        # Verify fiscal year is 2024/2025 (Oct 2024 is after Aug 1)
        assert data["fiscal_year"] == "2024/2025", f"Expected 2024/2025, got {data['fiscal_year']}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/fines/{data['id']}", headers=self.headers)
        print(f"✓ Retroactive fine created with date: {data['date']}")
        print(f"✓ Correct fiscal year: {data['fiscal_year']}")
    
    def test_create_fine_with_date_before_fiscal_year_start(self):
        """Test fiscal year calculation for date before August 1 (belongs to previous fiscal year)"""
        # June 2024 - should be fiscal year 2023/2024 (before Aug 1, 2024)
        retroactive_date = "2024-06-15"
        
        payload = {
            "member_id": self.test_member_id,
            "fine_type_id": self.test_fine_type_id,
            "amount": 3.00,
            "date": retroactive_date,
            "notes": "TEST_retroactive_fine_june"
        }
        
        response = requests.post(f"{BASE_URL}/api/fines", json=payload, headers=self.headers)
        
        assert response.status_code == 200, f"Create fine failed: {response.text}"
        data = response.json()
        
        # Verify fiscal year is 2023/2024 (June 2024 is before Aug 1, 2024)
        assert data["fiscal_year"] == "2023/2024", f"Expected 2023/2024, got {data['fiscal_year']}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/fines/{data['id']}", headers=self.headers)
        print(f"✓ Fine with date before fiscal year start")
        print(f"✓ Correct fiscal year (previous): {data['fiscal_year']}")
    
    def test_create_fine_with_date_exactly_on_fiscal_year_start(self):
        """Test fiscal year calculation for date exactly on August 1"""
        # August 1, 2024 - should be fiscal year 2024/2025
        retroactive_date = "2024-08-01"
        
        payload = {
            "member_id": self.test_member_id,
            "fine_type_id": self.test_fine_type_id,
            "amount": 4.00,
            "date": retroactive_date,
            "notes": "TEST_retroactive_fine_aug1"
        }
        
        response = requests.post(f"{BASE_URL}/api/fines", json=payload, headers=self.headers)
        
        assert response.status_code == 200, f"Create fine failed: {response.text}"
        data = response.json()
        
        # August 1 should start the new fiscal year
        assert data["fiscal_year"] == "2024/2025", f"Expected 2024/2025, got {data['fiscal_year']}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/fines/{data['id']}", headers=self.headers)
        print(f"✓ Fine on fiscal year start date (Aug 1)")
        print(f"✓ Correct fiscal year: {data['fiscal_year']}")
    
    def test_create_fine_with_date_day_before_fiscal_year_start(self):
        """Test fiscal year calculation for July 31 (last day of previous fiscal year)"""
        # July 31, 2024 - should be fiscal year 2023/2024
        retroactive_date = "2024-07-31"
        
        payload = {
            "member_id": self.test_member_id,
            "fine_type_id": self.test_fine_type_id,
            "amount": 5.00,
            "date": retroactive_date,
            "notes": "TEST_retroactive_fine_jul31"
        }
        
        response = requests.post(f"{BASE_URL}/api/fines", json=payload, headers=self.headers)
        
        assert response.status_code == 200, f"Create fine failed: {response.text}"
        data = response.json()
        
        # July 31 should be in the previous fiscal year
        assert data["fiscal_year"] == "2023/2024", f"Expected 2023/2024, got {data['fiscal_year']}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/fines/{data['id']}", headers=self.headers)
        print(f"✓ Fine on last day of fiscal year (Jul 31)")
        print(f"✓ Correct fiscal year (previous): {data['fiscal_year']}")
    
    def test_create_fine_with_iso_date_format_with_time(self):
        """Test that ISO datetime format with time is accepted"""
        retroactive_date = "2024-09-20T14:30:00"
        
        payload = {
            "member_id": self.test_member_id,
            "fine_type_id": self.test_fine_type_id,
            "amount": 2.00,
            "date": retroactive_date,
            "notes": "TEST_iso_datetime"
        }
        
        response = requests.post(f"{BASE_URL}/api/fines", json=payload, headers=self.headers)
        
        assert response.status_code == 200, f"Create fine failed: {response.text}"
        data = response.json()
        
        # Verify the date was parsed correctly
        fine_date = datetime.fromisoformat(data["date"].replace("Z", "+00:00"))
        assert fine_date.year == 2024
        assert fine_date.month == 9
        assert fine_date.day == 20
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/fines/{data['id']}", headers=self.headers)
        print(f"✓ ISO datetime format accepted: {retroactive_date}")
    
    def test_fine_appears_in_correct_fiscal_year_filter(self):
        """Test that retroactive fine appears when filtering by its fiscal year"""
        # Create fine for fiscal year 2024/2025
        retroactive_date = "2024-10-15"
        
        payload = {
            "member_id": self.test_member_id,
            "fine_type_id": self.test_fine_type_id,
            "amount": 6.00,
            "date": retroactive_date,
            "notes": "TEST_fiscal_year_filter"
        }
        
        create_resp = requests.post(f"{BASE_URL}/api/fines", json=payload, headers=self.headers)
        assert create_resp.status_code == 200
        created_fine = create_resp.json()
        fine_id = created_fine["id"]
        
        # Fetch fines for 2024/2025 and verify the fine appears
        fines_resp = requests.get(f"{BASE_URL}/api/fines?fiscal_year=2024/2025", headers=self.headers)
        assert fines_resp.status_code == 200
        fines = fines_resp.json()
        
        # Find our test fine
        test_fine = next((f for f in fines if f["id"] == fine_id), None)
        assert test_fine is not None, "Retroactive fine should appear in 2024/2025 filter"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/fines/{fine_id}", headers=self.headers)
        print(f"✓ Retroactive fine appears in correct fiscal year filter")
    
    def test_create_fine_with_null_date(self):
        """Test that explicit null date uses current date"""
        payload = {
            "member_id": self.test_member_id,
            "fine_type_id": self.test_fine_type_id,
            "amount": 1.00,
            "date": None,
            "notes": "TEST_null_date"
        }
        
        response = requests.post(f"{BASE_URL}/api/fines", json=payload, headers=self.headers)
        
        assert response.status_code == 200, f"Create fine failed: {response.text}"
        data = response.json()
        
        # Verify date is today
        fine_date = datetime.fromisoformat(data["date"].replace("Z", "+00:00"))
        today = datetime.now()
        assert abs((fine_date.replace(tzinfo=None) - today).days) <= 1
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/fines/{data['id']}", headers=self.headers)
        print(f"✓ Null date uses current date: {data['date']}")
    
    def test_create_fine_with_empty_string_date(self):
        """Test that empty string date uses current date"""
        payload = {
            "member_id": self.test_member_id,
            "fine_type_id": self.test_fine_type_id,
            "amount": 1.00,
            "date": "",
            "notes": "TEST_empty_date"
        }
        
        response = requests.post(f"{BASE_URL}/api/fines", json=payload, headers=self.headers)
        
        # Empty string should either use current date or fail validation
        # Based on the code, it will use current date since empty string is falsy
        if response.status_code == 200:
            data = response.json()
            fine_date = datetime.fromisoformat(data["date"].replace("Z", "+00:00"))
            today = datetime.now()
            assert abs((fine_date.replace(tzinfo=None) - today).days) <= 1
            requests.delete(f"{BASE_URL}/api/fines/{data['id']}", headers=self.headers)
            print(f"✓ Empty string date uses current date")
        else:
            print(f"✓ Empty string date returns error (acceptable): {response.status_code}")


class TestFiscalYearCalculation:
    """Unit tests for fiscal year calculation logic"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        # Get test data
        members_resp = requests.get(f"{BASE_URL}/api/members", headers=self.headers)
        fine_types_resp = requests.get(f"{BASE_URL}/api/fine-types", headers=self.headers)
        self.test_member_id = members_resp.json()[0]["id"]
        self.test_fine_type_id = fine_types_resp.json()[0]["id"]
    
    @pytest.mark.parametrize("date,expected_fy", [
        ("2025-01-15", "2024/2025"),   # Jan 2025 -> 2024/2025
        ("2025-07-31", "2024/2025"),   # Jul 31, 2025 -> 2024/2025
        ("2025-08-01", "2025/2026"),   # Aug 1, 2025 -> 2025/2026
        ("2025-12-25", "2025/2026"),   # Dec 2025 -> 2025/2026
        ("2026-03-15", "2025/2026"),   # Mar 2026 -> 2025/2026
        ("2024-02-29", "2023/2024"),   # Leap year Feb -> 2023/2024
    ])
    def test_fiscal_year_for_various_dates(self, date, expected_fy):
        """Test fiscal year calculation for various dates"""
        payload = {
            "member_id": self.test_member_id,
            "fine_type_id": self.test_fine_type_id,
            "amount": 1.00,
            "date": date,
            "notes": f"TEST_fy_{date}"
        }
        
        response = requests.post(f"{BASE_URL}/api/fines", json=payload, headers=self.headers)
        assert response.status_code == 200, f"Create fine failed for {date}: {response.text}"
        
        data = response.json()
        assert data["fiscal_year"] == expected_fy, f"For {date}: expected {expected_fy}, got {data['fiscal_year']}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/fines/{data['id']}", headers=self.headers)
        print(f"✓ Date {date} -> Fiscal year {data['fiscal_year']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
