#!/usr/bin/env python3
"""
Test script for Phase 6 Hierarchical Indicator Creation endpoints.

Tests:
1. Database migration - indicator_drafts table exists
2. Draft creation
3. Draft listing
4. Draft update with optimistic locking
5. Bulk indicator creation with topological sorting
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
LOGIN_URL = "http://localhost:8000/api/v1/auth/login"

# Test credentials (adjust as needed)
TEST_EMAIL = "admin@example.com"
TEST_PASSWORD = "admin123"

# Color codes for output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


def print_test(message):
    print(f"{BLUE}🧪 TEST:{RESET} {message}")


def print_success(message):
    print(f"{GREEN}✅ PASS:{RESET} {message}")


def print_error(message):
    print(f"{RED}❌ FAIL:{RESET} {message}")


def print_info(message):
    print(f"{YELLOW}ℹ️  INFO:{RESET} {message}")


def print_section(message):
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}{message}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")


def login():
    """Login and get access token."""
    print_test("Logging in to get access token...")

    response = requests.post(
        LOGIN_URL,
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )

    if response.status_code == 200:
        token = response.json()["access_token"]
        print_success(f"Login successful")
        return token
    else:
        print_error(f"Login failed: {response.status_code} - {response.text}")
        return None


def test_database_migration():
    """Test that indicator_drafts table exists."""
    print_section("Test 1: Database Migration")
    print_test("Checking if indicator_drafts table exists...")

    # We'll test this indirectly by trying to create a draft
    # If the table doesn't exist, we'll get a database error
    print_success("Database migration will be tested via draft creation")


def test_create_draft(token):
    """Test creating a new indicator draft."""
    print_section("Test 2: Create Indicator Draft")
    print_test("Creating a new indicator draft...")

    headers = {"Authorization": f"Bearer {token}"}
    draft_data = {
        "governance_area_id": 1,
        "creation_mode": "incremental",
        "title": "Test Draft - Financial Indicators",
        "data": []
    }

    response = requests.post(
        f"{BASE_URL}/indicators/drafts",
        headers=headers,
        json=draft_data
    )

    if response.status_code == 201:
        draft = response.json()
        print_success(f"Draft created successfully!")
        print_info(f"Draft ID: {draft['id']}")
        print_info(f"Title: {draft['title']}")
        print_info(f"Status: {draft['status']}")
        print_info(f"Version: {draft['version']}")
        return draft
    else:
        print_error(f"Failed to create draft: {response.status_code}")
        print_error(f"Response: {response.text}")
        return None


def test_list_drafts(token):
    """Test listing user's drafts."""
    print_section("Test 3: List Indicator Drafts")
    print_test("Fetching list of user's drafts...")

    headers = {"Authorization": f"Bearer {token}"}

    response = requests.get(
        f"{BASE_URL}/indicators/drafts",
        headers=headers
    )

    if response.status_code == 200:
        drafts = response.json()
        print_success(f"Retrieved {len(drafts)} draft(s)")
        for i, draft in enumerate(drafts[:3], 1):  # Show first 3
            print_info(f"  {i}. {draft['title']} - Status: {draft['status']}")
        return drafts
    else:
        print_error(f"Failed to list drafts: {response.status_code}")
        print_error(f"Response: {response.text}")
        return []


def test_update_draft(token, draft):
    """Test updating a draft with optimistic locking."""
    print_section("Test 4: Update Draft with Optimistic Locking")
    print_test("Updating draft data...")

    headers = {"Authorization": f"Bearer {token}"}

    # Add some indicator data
    update_data = {
        "current_step": 2,
        "title": "Test Draft - Financial Indicators (Updated)",
        "data": [
            {
                "temp_id": "temp-001",
                "name": "1.1 Budget Planning",
                "description": "Test indicator for budget planning"
            }
        ],
        "version": draft["version"]  # Optimistic locking
    }

    response = requests.put(
        f"{BASE_URL}/indicators/drafts/{draft['id']}",
        headers=headers,
        json=update_data
    )

    if response.status_code == 200:
        updated_draft = response.json()
        print_success(f"Draft updated successfully!")
        print_info(f"New version: {updated_draft['version']}")
        print_info(f"Updated title: {updated_draft['title']}")
        print_info(f"Current step: {updated_draft['current_step']}")
        print_info(f"Data items: {len(updated_draft['data'])}")
        return updated_draft
    else:
        print_error(f"Failed to update draft: {response.status_code}")
        print_error(f"Response: {response.text}")
        return None


def test_version_conflict(token, draft):
    """Test optimistic locking by using wrong version."""
    print_section("Test 5: Optimistic Locking (Version Conflict)")
    print_test("Attempting update with wrong version number...")

    headers = {"Authorization": f"Bearer {token}"}

    update_data = {
        "title": "This should fail",
        "version": 1  # Wrong version (should be 2 now)
    }

    response = requests.put(
        f"{BASE_URL}/indicators/drafts/{draft['id']}",
        headers=headers,
        json=update_data
    )

    if response.status_code == 409:
        print_success(f"Version conflict detected correctly! (HTTP 409)")
        print_info(f"Response: {response.json()['detail']}")
    else:
        print_error(f"Expected 409 Conflict, got {response.status_code}")


def test_bulk_create_indicators(token):
    """Test bulk creation of hierarchical indicators."""
    print_section("Test 6: Bulk Indicator Creation")
    print_test("Creating hierarchical indicators in bulk...")

    headers = {"Authorization": f"Bearer {token}"}

    # Create a simple hierarchy: 1.1 -> 1.1.1, 1.1.2
    bulk_data = {
        "governance_area_id": 1,
        "indicators": [
            {
                "temp_id": "temp-parent",
                "parent_temp_id": None,
                "order": 1,
                "name": "1.1 Test Parent Indicator",
                "description": "Parent indicator for testing",
                "is_active": True,
                "is_auto_calculable": False,
                "is_profiling_only": False,
                "governance_area_id": 1
            },
            {
                "temp_id": "temp-child-1",
                "parent_temp_id": "temp-parent",
                "order": 1,
                "name": "1.1.1 Test Child Indicator 1",
                "description": "First child indicator",
                "is_active": True,
                "is_auto_calculable": False,
                "is_profiling_only": False,
                "governance_area_id": 1
            },
            {
                "temp_id": "temp-child-2",
                "parent_temp_id": "temp-parent",
                "order": 2,
                "name": "1.1.2 Test Child Indicator 2",
                "description": "Second child indicator",
                "is_active": True,
                "is_auto_calculable": False,
                "is_profiling_only": False,
                "governance_area_id": 1
            }
        ]
    }

    response = requests.post(
        f"{BASE_URL}/indicators/bulk",
        headers=headers,
        json=bulk_data
    )

    if response.status_code == 201:
        result = response.json()
        print_success(f"Bulk creation successful!")
        print_info(f"Created {len(result['created'])} indicators")
        print_info(f"Temp ID mapping: {result['temp_id_mapping']}")

        # Show created indicators
        for indicator in result['created']:
            parent_info = f" (child of {indicator['parent_id']})" if indicator['parent_id'] else " (root)"
            print_info(f"  - {indicator['name']} [ID: {indicator['id']}]{parent_info}")

        return result
    else:
        print_error(f"Failed bulk creation: {response.status_code}")
        print_error(f"Response: {response.text}")
        return None


def test_get_draft(token, draft_id):
    """Test retrieving a specific draft."""
    print_section("Test 7: Get Specific Draft")
    print_test(f"Retrieving draft {draft_id}...")

    headers = {"Authorization": f"Bearer {token}"}

    response = requests.get(
        f"{BASE_URL}/indicators/drafts/{draft_id}",
        headers=headers
    )

    if response.status_code == 200:
        draft = response.json()
        print_success(f"Draft retrieved successfully!")
        print_info(f"Title: {draft['title']}")
        print_info(f"Version: {draft['version']}")
        print_info(f"Last accessed: {draft['last_accessed_at']}")
        return draft
    else:
        print_error(f"Failed to get draft: {response.status_code}")
        return None


def main():
    """Run all tests."""
    print(f"\n{GREEN}{'='*60}")
    print(f"Phase 6: Hierarchical Indicator Creation - API Tests")
    print(f"{'='*60}{RESET}\n")

    # Login
    token = login()
    if not token:
        print_error("Cannot proceed without authentication token")
        return

    # Test 1: Database migration (implicit)
    test_database_migration()

    # Test 2: Create draft
    draft = test_create_draft(token)
    if not draft:
        print_error("Cannot proceed without draft")
        return

    # Test 3: List drafts
    drafts = test_list_drafts(token)

    # Test 4: Update draft
    updated_draft = test_update_draft(token, draft)
    if not updated_draft:
        return

    # Test 5: Version conflict
    test_version_conflict(token, updated_draft)

    # Test 6: Bulk creation
    bulk_result = test_bulk_create_indicators(token)

    # Test 7: Get specific draft
    test_get_draft(token, draft['id'])

    # Summary
    print_section("Test Summary")
    print_success("All tests completed!")
    print_info("Check the results above for any failures.")

    # Cleanup instructions
    print(f"\n{YELLOW}Note: Test data created (drafts and indicators). ")
    print(f"You may want to clean up test data from the database.{RESET}\n")


if __name__ == "__main__":
    main()
