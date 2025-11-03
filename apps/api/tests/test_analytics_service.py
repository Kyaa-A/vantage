"""
🧪 Analytics Service Tests
Tests for analytics service layer - dashboard KPI calculations
"""

import pytest
from datetime import datetime
from app.db.enums import ComplianceStatus, UserRole, AreaType
from app.db.models import Assessment, AssessmentResponse, GovernanceArea, Indicator, User, Barangay
from app.services.analytics_service import analytics_service


@pytest.fixture
def governance_areas(db_session):
    """Create test governance areas"""
    areas = [
        GovernanceArea(id=1, name="Financial Administration", area_type=AreaType.CORE),
        GovernanceArea(id=2, name="Disaster Preparedness", area_type=AreaType.CORE),
        GovernanceArea(id=3, name="Social Protection", area_type=AreaType.ESSENTIAL),
    ]
    for area in areas:
        db_session.add(area)
    db_session.commit()
    for area in areas:
        db_session.refresh(area)
    return areas


@pytest.fixture
def indicators(db_session, governance_areas):
    """Create test indicators"""
    indicators = []
    for i, area in enumerate(governance_areas):
        for j in range(3):  # 3 indicators per area
            ind = Indicator(
                id=(i * 3) + j + 1,
                name=f"{area.name} Indicator {j+1}",
                description=f"Test indicator for {area.name}",
                form_schema={"type": "object", "properties": {}},
                governance_area_id=area.id,
            )
            db_session.add(ind)
            indicators.append(ind)
    db_session.commit()
    for ind in indicators:
        db_session.refresh(ind)
    return indicators


@pytest.fixture
def barangays_with_assessments(db_session, indicators):
    """Create test barangays with assessments"""
    # Create 10 barangays with various compliance statuses
    barangays = []
    assessments = []

    for i in range(10):
        # Create barangay
        barangay = Barangay(name=f"Test Barangay {i+1}")
        db_session.add(barangay)
        db_session.commit()
        db_session.refresh(barangay)
        barangays.append(barangay)

        # Create user for barangay
        user = User(
            email=f"blgu{i+1}@test.com",
            name=f"BLGU User {i+1}",
            hashed_password="hashed",
            role=UserRole.BLGU_USER,
            barangay_id=barangay.id,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        # Create assessment with compliance status
        # First 7 pass, last 3 fail
        compliance_status = ComplianceStatus.PASSED if i < 7 else ComplianceStatus.FAILED

        assessment = Assessment(
            blgu_user_id=user.id,
            final_compliance_status=compliance_status,
            validated_at=datetime(2024, 1, 1),
        )
        db_session.add(assessment)
        db_session.commit()
        db_session.refresh(assessment)
        assessments.append(assessment)

        # Create assessment responses for indicators
        for ind_idx, indicator in enumerate(indicators):
            # Make some indicators fail for failed assessments
            is_completed = True
            if compliance_status == ComplianceStatus.FAILED:
                # Fail specific indicators more often
                if ind_idx in [0, 3, 6]:  # Fail indicators 1, 4, 7 more often
                    is_completed = False

            response = AssessmentResponse(
                assessment_id=assessment.id,
                indicator_id=indicator.id,
                is_completed=is_completed,
                response_data={},
            )
            db_session.add(response)

        db_session.commit()

    return barangays, assessments


def test_get_dashboard_kpis_with_data(db_session, governance_areas, indicators, barangays_with_assessments):
    """Test get_dashboard_kpis returns correct data structure with valid data"""
    # Act
    result = analytics_service.get_dashboard_kpis(db_session, cycle_id=None)

    # Assert
    assert result is not None
    assert hasattr(result, 'overall_compliance_rate')
    assert hasattr(result, 'completion_status')
    assert hasattr(result, 'area_breakdown')
    assert hasattr(result, 'top_failed_indicators')
    assert hasattr(result, 'barangay_rankings')
    assert hasattr(result, 'trends')

    # Check overall compliance rate
    assert result.overall_compliance_rate.total_barangays == 10
    assert result.overall_compliance_rate.passed == 7
    assert result.overall_compliance_rate.failed == 3
    assert result.overall_compliance_rate.pass_percentage == 70.0


def test_calculate_overall_compliance_all_passed(db_session):
    """Test overall compliance calculation when all assessments pass"""
    # Arrange: Create 5 passing assessments
    for i in range(5):
        barangay = Barangay(name=f"Pass Barangay {i+1}")
        db_session.add(barangay)
        db_session.commit()
        db_session.refresh(barangay)

        user = User(
            email=f"pass{i+1}@test.com",
            name=f"Pass User {i+1}",
            hashed_password="hashed",
            role=UserRole.BLGU_USER,
            barangay_id=barangay.id,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        assessment = Assessment(
            blgu_user_id=user.id,
            final_compliance_status=ComplianceStatus.PASSED,
        )
        db_session.add(assessment)

    db_session.commit()

    # Act
    result = analytics_service._calculate_overall_compliance(db_session, None)

    # Assert
    assert result.total_barangays == 5
    assert result.passed == 5
    assert result.failed == 0
    assert result.pass_percentage == 100.0


def test_calculate_overall_compliance_no_assessments(db_session):
    """Test overall compliance calculation with no assessments"""
    # Act
    result = analytics_service._calculate_overall_compliance(db_session, None)

    # Assert - should return zeros, not crash
    assert result.total_barangays == 0
    assert result.passed == 0
    assert result.failed == 0
    assert result.pass_percentage == 0.0


def test_calculate_area_breakdown(db_session, governance_areas, indicators, barangays_with_assessments):
    """Test area breakdown calculation with multiple governance areas"""
    # Act
    result = analytics_service._calculate_area_breakdown(db_session, None)

    # Assert
    assert len(result) == 3  # 3 governance areas
    assert all(hasattr(area, 'area_code') for area in result)
    assert all(hasattr(area, 'area_name') for area in result)
    assert all(hasattr(area, 'passed') for area in result)
    assert all(hasattr(area, 'failed') for area in result)
    assert all(hasattr(area, 'percentage') for area in result)

    # Check area names match
    area_names = [area.area_name for area in result]
    expected_names = ["Financial Administration", "Disaster Preparedness", "Social Protection"]
    for expected in expected_names:
        assert expected in area_names


def test_calculate_area_breakdown_no_areas(db_session):
    """Test area breakdown with no governance areas"""
    # Act
    result = analytics_service._calculate_area_breakdown(db_session, None)

    # Assert - should return empty list, not crash
    assert result == []


def test_calculate_top_failed_indicators(db_session, governance_areas, indicators, barangays_with_assessments):
    """Test top failed indicators returns max 5 items"""
    # Act
    result = analytics_service._calculate_top_failed_indicators(db_session, None)

    # Assert
    assert len(result) <= 5  # Should never exceed 5
    if len(result) > 0:
        # Should be sorted by failure_count descending
        for i in range(len(result) - 1):
            assert result[i].failure_count >= result[i + 1].failure_count

        # Each item should have required fields
        for item in result:
            assert hasattr(item, 'indicator_id')
            assert hasattr(item, 'indicator_name')
            assert hasattr(item, 'failure_count')
            assert hasattr(item, 'percentage')
            assert item.failure_count > 0


def test_calculate_top_failed_indicators_no_failures(db_session, governance_areas, indicators):
    """Test top failed indicators when all indicators pass"""
    # Arrange: Create assessment with all indicators completed
    barangay = Barangay(name="Perfect Barangay")
    db_session.add(barangay)
    db_session.commit()
    db_session.refresh(barangay)

    user = User(
        email="perfect@test.com",
        name="Perfect User",
        hashed_password="hashed",
        role=UserRole.BLGU_USER,
        barangay_id=barangay.id,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assessment = Assessment(
        blgu_user_id=user.id,
        final_compliance_status=ComplianceStatus.PASSED,
    )
    db_session.add(assessment)
    db_session.commit()
    db_session.refresh(assessment)

    # All indicators completed
    for indicator in indicators:
        response = AssessmentResponse(
            assessment_id=assessment.id,
            indicator_id=indicator.id,
            is_completed=True,
        )
        db_session.add(response)
    db_session.commit()

    # Act
    result = analytics_service._calculate_top_failed_indicators(db_session, None)

    # Assert - should return empty list
    assert result == []


def test_calculate_barangay_rankings(db_session, governance_areas, indicators, barangays_with_assessments):
    """Test barangay rankings calculation"""
    # Act
    result = analytics_service._calculate_barangay_rankings(db_session, None)

    # Assert
    assert len(result) == 10  # 10 barangays
    assert all(hasattr(item, 'barangay_id') for item in result)
    assert all(hasattr(item, 'barangay_name') for item in result)
    assert all(hasattr(item, 'score') for item in result)
    assert all(hasattr(item, 'rank') for item in result)

    # Rankings should be in descending order by score
    for i in range(len(result) - 1):
        assert result[i].score >= result[i + 1].score

    # Ranks should be sequential
    for i, item in enumerate(result):
        assert item.rank == i + 1

    # Scores should be between 0 and 100
    assert all(0 <= item.score <= 100 for item in result)


def test_calculate_barangay_rankings_no_assessments(db_session):
    """Test barangay rankings with no assessments"""
    # Act
    result = analytics_service._calculate_barangay_rankings(db_session, None)

    # Assert - should return empty list, not crash
    assert result == []


def test_calculate_completion_status(db_session, governance_areas, indicators, barangays_with_assessments):
    """Test completion status calculation"""
    # Act
    result = analytics_service._calculate_completion_status(db_session, None)

    # Assert
    assert result.total_barangays == 10
    assert result.passed == 10  # All have final_compliance_status (validated)
    assert result.failed == 0  # None are in progress
    assert result.pass_percentage == 100.0


def test_calculate_completion_status_mixed(db_session, governance_areas, indicators):
    """Test completion status with mixed validated/in-progress assessments"""
    # Arrange: Create mix of validated and in-progress
    for i in range(5):
        barangay = Barangay(name=f"Mixed Barangay {i+1}")
        db_session.add(barangay)
        db_session.commit()
        db_session.refresh(barangay)

        user = User(
            email=f"mixed{i+1}@test.com",
            name=f"Mixed User {i+1}",
            hashed_password="hashed",
            role=UserRole.BLGU_USER,
            barangay_id=barangay.id,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        # First 3 validated, last 2 in progress (no final_compliance_status)
        assessment = Assessment(
            blgu_user_id=user.id,
            final_compliance_status=ComplianceStatus.PASSED if i < 3 else None,
        )
        db_session.add(assessment)

    db_session.commit()

    # Act
    result = analytics_service._calculate_completion_status(db_session, None)

    # Assert
    assert result.total_barangays == 5
    assert result.passed == 3  # Validated
    assert result.failed == 2  # In progress
    assert result.pass_percentage == 60.0


def test_calculate_trends_empty(db_session):
    """Test trends calculation returns empty list (placeholder implementation)"""
    # Act
    result = analytics_service._calculate_trends(db_session)

    # Assert - currently returns empty as cycles not implemented
    assert result == []


def test_get_dashboard_kpis_cycle_filtering(db_session, governance_areas, indicators, barangays_with_assessments):
    """Test that cycle_id parameter is accepted (even if not filtering yet)"""
    # Act - should not crash with cycle_id parameter
    result = analytics_service.get_dashboard_kpis(db_session, cycle_id=1)

    # Assert - should return data structure
    assert result is not None
    assert hasattr(result, 'overall_compliance_rate')
