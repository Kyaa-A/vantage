"""
Tests for MOV File Management API Endpoints (Story 4.7)

Tests the file upload, list, and deletion endpoints.
"""

import io
from datetime import datetime
from unittest.mock import patch

import pytest
from fastapi import status

from app.db.enums import AssessmentStatus
from app.db.models.assessment import Assessment, MOVFile
from app.db.models.user import User


class TestUploadMOVFile:
    """Test suite for POST /api/v1/movs/assessments/{assessment_id}/indicators/{indicator_id}/upload"""

    @pytest.fixture
    def blgu_user(self, db_session):
        """Fixture providing a BLGU user."""
        user = User(
            id=100,
            email="blgu@test.com",
            name="Test BLGU User",
            hashed_password="hashed",
            role="BLGU_USER",
            barangay_id=1,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    @pytest.fixture
    def assessment(self, db_session, blgu_user):
        """Fixture providing a draft assessment."""
        assessment = Assessment(
            id=1,
            blgu_user_id=blgu_user.id,
            status=AssessmentStatus.DRAFT,
        )
        db_session.add(assessment)
        db_session.commit()
        db_session.refresh(assessment)
        return assessment

    @pytest.fixture
    def auth_headers(self, blgu_user):
        """Fixture providing authentication headers."""
        from app.core.security import create_access_token

        token = create_access_token(subject=str(blgu_user.id))
        return {"Authorization": f"Bearer {token}"}

    def test_upload_valid_pdf_file(self, client, assessment, auth_headers):
        """Test successful upload of a valid PDF file."""
        # Mock the storage service upload
        with patch("app.api.v1.movs.storage_service.upload_mov_file") as mock_upload:
            # Create mock MOVFile
            mock_mov_file = MOVFile(
                id=1,
                assessment_id=assessment.id,
                indicator_id=1,
                file_name="test-file.pdf",
                file_url="https://storage.example.com/test-file.pdf",
                file_type="application/pdf",
                file_size=1024,
                uploaded_by=100,
                uploaded_at=datetime.utcnow(),
            )
            mock_upload.return_value = mock_mov_file

            # Create test file
            file_content = b"%PDF-1.4\n%"
            file_data = io.BytesIO(file_content)

            # Upload file
            response = client.post(
                f"/api/v1/movs/assessments/{assessment.id}/indicators/1/upload",
                headers=auth_headers,
                files={"file": ("test.pdf", file_data, "application/pdf")},
            )

            # Assertions
            assert response.status_code == status.HTTP_201_CREATED
            data = response.json()
            assert data["id"] == 1
            assert data["assessment_id"] == assessment.id
            assert data["indicator_id"] == 1
            assert data["file_name"] == "test-file.pdf"
            assert data["file_url"] == "https://storage.example.com/test-file.pdf"
            assert data["file_type"] == "application/pdf"
            assert data["file_size"] == 1024
            assert data["uploaded_by"] == 100

    def test_upload_valid_docx_file(self, client, assessment, auth_headers):
        """Test successful upload of a valid DOCX file."""
        with patch("app.api.v1.movs.storage_service.upload_mov_file") as mock_upload:
            mock_mov_file = MOVFile(
                id=2,
                assessment_id=assessment.id,
                indicator_id=2,
                file_name="document.docx",
                file_url="https://storage.example.com/document.docx",
                file_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                file_size=2048,
                uploaded_by=100,
                uploaded_at=datetime.utcnow(),
            )
            mock_upload.return_value = mock_mov_file

            file_content = b"PK\x03\x04" + b"\x00" * 100  # ZIP signature for DOCX
            file_data = io.BytesIO(file_content)

            response = client.post(
                f"/api/v1/movs/assessments/{assessment.id}/indicators/2/upload",
                headers=auth_headers,
                files={
                    "file": (
                        "document.docx",
                        file_data,
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    )
                },
            )

            assert response.status_code == status.HTTP_201_CREATED
            data = response.json()
            assert data["file_type"] == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    def test_upload_valid_jpg_file(self, client, assessment, auth_headers):
        """Test successful upload of a valid JPG file."""
        with patch("app.api.v1.movs.storage_service.upload_mov_file") as mock_upload:
            mock_mov_file = MOVFile(
                id=3,
                assessment_id=assessment.id,
                indicator_id=3,
                file_name="image.jpg",
                file_url="https://storage.example.com/image.jpg",
                file_type="image/jpeg",
                file_size=4096,
                uploaded_by=100,
                uploaded_at=datetime.utcnow(),
            )
            mock_upload.return_value = mock_mov_file

            file_content = b"\xFF\xD8\xFF"  # JPEG signature
            file_data = io.BytesIO(file_content)

            response = client.post(
                f"/api/v1/movs/assessments/{assessment.id}/indicators/3/upload",
                headers=auth_headers,
                files={"file": ("image.jpg", file_data, "image/jpeg")},
            )

            assert response.status_code == status.HTTP_201_CREATED
            data = response.json()
            assert data["file_type"] == "image/jpeg"

    def test_upload_rejects_invalid_file_type(self, client, assessment, auth_headers):
        """Test that upload rejects invalid file types (e.g., .exe)."""
        file_content = b"MZ\x90\x00"  # Windows executable signature
        file_data = io.BytesIO(file_content)

        response = client.post(
            f"/api/v1/movs/assessments/{assessment.id}/indicators/1/upload",
            headers=auth_headers,
            files={"file": ("malware.exe", file_data, "application/x-msdownload")},
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "detail" in data
        assert "not allowed" in data["detail"]["message"].lower()
        assert data["detail"]["error_code"] == "INVALID_FILE_TYPE"

    def test_upload_rejects_text_file(self, client, assessment, auth_headers):
        """Test that upload rejects .txt files."""
        file_content = b"This is a text file"
        file_data = io.BytesIO(file_content)

        response = client.post(
            f"/api/v1/movs/assessments/{assessment.id}/indicators/1/upload",
            headers=auth_headers,
            files={"file": ("document.txt", file_data, "text/plain")},
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert data["detail"]["error_code"] == "INVALID_FILE_TYPE"

    def test_upload_rejects_oversized_file(self, client, assessment, auth_headers):
        """Test that upload rejects files larger than 50MB."""
        # Create a file larger than 50MB (52,428,801 bytes)
        large_size = 52_428_801
        file_content = b"x" * large_size
        file_data = io.BytesIO(file_content)

        response = client.post(
            f"/api/v1/movs/assessments/{assessment.id}/indicators/1/upload",
            headers=auth_headers,
            files={"file": ("large.pdf", file_data, "application/pdf")},
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "exceeds 50MB limit" in data["detail"]["message"]
        assert data["detail"]["error_code"] == "FILE_TOO_LARGE"

    def test_upload_rejects_executable_content(self, client, assessment, auth_headers):
        """Test that upload rejects files with executable content."""
        # PDF file with executable signature (should be caught by content validation)
        file_content = b"MZ\x90\x00" + b"\x00" * 100
        file_data = io.BytesIO(file_content)

        response = client.post(
            f"/api/v1/movs/assessments/{assessment.id}/indicators/1/upload",
            headers=auth_headers,
            files={"file": ("fake.pdf", file_data, "application/pdf")},
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "suspicious or executable" in data["detail"]["message"].lower()
        assert data["detail"]["error_code"] == "SUSPICIOUS_CONTENT"

    def test_upload_rejects_extension_mismatch(self, client, assessment, auth_headers):
        """Test that upload rejects files where extension doesn't match content type."""
        # PDF content but .jpg extension
        file_content = b"%PDF-1.4\n%"
        file_data = io.BytesIO(file_content)

        response = client.post(
            f"/api/v1/movs/assessments/{assessment.id}/indicators/1/upload",
            headers=auth_headers,
            files={"file": ("fake.jpg", file_data, "application/pdf")},
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "extension does not match" in data["detail"]["message"].lower()
        assert data["detail"]["error_code"] == "EXTENSION_MISMATCH"

    def test_upload_handles_storage_service_error(self, client, assessment, auth_headers):
        """Test that upload handles storage service errors gracefully."""
        with patch("app.api.v1.movs.storage_service.upload_mov_file") as mock_upload:
            # Mock storage service raising an error
            mock_upload.side_effect = Exception("Supabase connection failed")

            file_content = b"%PDF-1.4\n%"
            file_data = io.BytesIO(file_content)

            response = client.post(
                f"/api/v1/movs/assessments/{assessment.id}/indicators/1/upload",
                headers=auth_headers,
                files={"file": ("test.pdf", file_data, "application/pdf")},
            )

            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            data = response.json()
            assert "Failed to upload file" in data["detail"]

    def test_upload_requires_authentication(self, client, assessment):
        """Test that upload requires authentication."""
        file_content = b"%PDF-1.4\n%"
        file_data = io.BytesIO(file_content)

        response = client.post(
            f"/api/v1/movs/assessments/{assessment.id}/indicators/1/upload",
            files={"file": ("test.pdf", file_data, "application/pdf")},
        )

        # Accept either 401 or 403 - both indicate authentication/authorization failure
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_upload_with_valid_png_file(self, client, assessment, auth_headers):
        """Test successful upload of a valid PNG file."""
        with patch("app.api.v1.movs.storage_service.upload_mov_file") as mock_upload:
            mock_mov_file = MOVFile(
                id=4,
                assessment_id=assessment.id,
                indicator_id=4,
                file_name="screenshot.png",
                file_url="https://storage.example.com/screenshot.png",
                file_type="image/png",
                file_size=8192,
                uploaded_by=100,
                uploaded_at=datetime.utcnow(),
            )
            mock_upload.return_value = mock_mov_file

            file_content = b"\x89PNG\r\n\x1a\n"  # PNG signature
            file_data = io.BytesIO(file_content)

            response = client.post(
                f"/api/v1/movs/assessments/{assessment.id}/indicators/4/upload",
                headers=auth_headers,
                files={"file": ("screenshot.png", file_data, "image/png")},
            )

            assert response.status_code == status.HTTP_201_CREATED
            data = response.json()
            assert data["file_type"] == "image/png"
