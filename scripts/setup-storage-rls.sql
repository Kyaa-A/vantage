-- Supabase Storage RLS Policy Setup for MOV Files
-- Story 4.1.3: Define RLS policies for file access
--
-- This script sets up Row-Level Security policies for the mov-files storage bucket
-- Execute this in Supabase SQL Editor after creating the mov-files bucket
--
-- Path Structure: {assessment_id}/{indicator_id}/{file_name}
-- Example: assessment_123/indicator_456/evidence_photo.jpg

-- Enable RLS on storage.objects table (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running this script)
DROP POLICY IF EXISTS "BLGU users can upload MOV files for their assessments" ON storage.objects;
DROP POLICY IF EXISTS "BLGU users can view their own MOV files" ON storage.objects;
DROP POLICY IF EXISTS "BLGU users can delete their own MOV files" ON storage.objects;
DROP POLICY IF EXISTS "Assessors can view all MOV files" ON storage.objects;
DROP POLICY IF EXISTS "Validators can view MOV files for assigned areas" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all MOV files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete any MOV files" ON storage.objects;

-- ============================================================================
-- BLGU USER POLICIES
-- ============================================================================

-- Policy 1: BLGU users can upload files for their own assessments
-- This policy allows BLGU users to INSERT files into paths matching their assessment IDs
CREATE POLICY "BLGU users can upload MOV files for their assessments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'mov-files'
  AND (storage.foldername(name))[1]::int IN (
    SELECT id::text
    FROM assessments
    WHERE barangay_id = (
      SELECT barangay_id
      FROM users
      WHERE id = auth.uid()::int
      AND role = 'BLGU_USER'
    )
  )
);

-- Policy 2: BLGU users can read (SELECT) their own assessment files
CREATE POLICY "BLGU users can view their own MOV files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'mov-files'
  AND (storage.foldername(name))[1]::int IN (
    SELECT id::text
    FROM assessments
    WHERE barangay_id = (
      SELECT barangay_id
      FROM users
      WHERE id = auth.uid()::int
      AND role = 'BLGU_USER'
    )
  )
);

-- Policy 3: BLGU users can delete files from their own assessments
CREATE POLICY "BLGU users can delete their own MOV files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'mov-files'
  AND (storage.foldername(name))[1]::int IN (
    SELECT id::text
    FROM assessments
    WHERE barangay_id = (
      SELECT barangay_id
      FROM users
      WHERE id = auth.uid()::int
      AND role = 'BLGU_USER'
    )
  )
);

-- ============================================================================
-- ASSESSOR POLICIES
-- ============================================================================

-- Policy 4: Assessors can read ALL MOV files
-- Assessors need full visibility to validate BLGU submissions
CREATE POLICY "Assessors can view all MOV files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'mov-files'
  AND EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()::int
    AND role = 'ASSESSOR'
  )
);

-- ============================================================================
-- VALIDATOR POLICIES
-- ============================================================================

-- Policy 5: Validators can read MOV files for their assigned governance areas
-- Validators are restricted to files within their assigned governance area
CREATE POLICY "Validators can view MOV files for assigned areas"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'mov-files'
  AND (storage.foldername(name))[1]::int IN (
    SELECT a.id::text
    FROM assessments a
    JOIN barangays b ON a.barangay_id = b.id
    JOIN users u ON u.id = auth.uid()::int
    WHERE u.role = 'VALIDATOR'
    AND b.governance_area_id = u.validator_area_id
  )
);

-- ============================================================================
-- ADMIN (MLGOO_DILG) POLICIES
-- ============================================================================

-- Policy 6: MLGOO_DILG (admins) can read all files
CREATE POLICY "Admins can view all MOV files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'mov-files'
  AND EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()::int
    AND role = 'MLGOO_DILG'
  )
);

-- Policy 7: MLGOO_DILG (admins) can delete any files (for moderation)
CREATE POLICY "Admins can delete any MOV files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'mov-files'
  AND EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()::int
    AND role = 'MLGOO_DILG'
  )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify policies are created correctly
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Test policy for specific user (replace USER_ID with actual user ID)
-- SELECT EXISTS (
--   SELECT 1 FROM users WHERE id = USER_ID AND role = 'BLGU_USER'
-- );

COMMENT ON TABLE storage.objects IS 'Storage objects with RLS policies for MOV file access control';
