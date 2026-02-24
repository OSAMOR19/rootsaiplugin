-- ============================================================
--  FIX: Orphaned / Invisible Samples Cleanup
--  Run this in the Supabase SQL Editor
--  It finds all sample rows that have no audio_url (which makes
--  them invisible on the frontend) and removes them cleanly.
-- ============================================================

-- STEP 1: Preview — see what will be deleted BEFORE deleting
SELECT
    id,
    name,
    category,
    audio_url,
    created_at
FROM samples
WHERE
    audio_url IS NULL
    OR audio_url = ''
    OR audio_url = 'null'
ORDER BY created_at DESC;

-- ============================================================
-- If the query above shows rows you want gone, run STEP 2.
-- ============================================================

-- STEP 2: Delete invisible ghost rows (no audio_url)
-- Uncomment the lines below and run them when ready.

-- DELETE FROM samples
-- WHERE
--     audio_url IS NULL
--     OR audio_url = ''
--     OR audio_url = 'null';

-- ============================================================
-- STEP 3: Remove duplicate filenames (if any)
-- Shows any filename that appears more than once.
-- ============================================================
SELECT
    filename,
    COUNT(*) as count,
    array_agg(id) as ids
FROM samples
WHERE filename IS NOT NULL
GROUP BY filename
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- ============================================================
-- STEP 4: Fix duplicate filenames by making them unique
-- This updates each duplicate to append its ID to make it unique.
-- Safe to run — it only touches rows with duplicate filenames.
-- ============================================================
-- UPDATE samples s
-- SET filename = s.filename || '_' || s.id::text
-- WHERE s.id IN (
--     SELECT id FROM (
--         SELECT id,
--                ROW_NUMBER() OVER (PARTITION BY filename ORDER BY created_at ASC) AS rn
--         FROM samples
--         WHERE filename IS NOT NULL
--     ) t
--     WHERE t.rn > 1   -- only duplicates (keep the first occurrence as-is)
-- );

-- ============================================================
-- STEP 5: Verify - count of valid vs invalid samples
-- ============================================================
SELECT
    COUNT(*) FILTER (WHERE audio_url IS NOT NULL AND audio_url != '' AND audio_url != 'null') AS valid_samples,
    COUNT(*) FILTER (WHERE audio_url IS NULL OR audio_url = '' OR audio_url = 'null') AS ghost_samples,
    COUNT(*) AS total_samples
FROM samples;
