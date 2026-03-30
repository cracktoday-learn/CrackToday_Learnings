-- ============================================================================
-- DELETE IBPS Mains 2026 Test Batch and All Related Data
-- Run these queries in order in Supabase SQL Editor
-- ============================================================================

-- STEP 1: Find the batch ID first (verify before deleting)
SELECT id, name, created_at 
FROM batches 
WHERE name ILIKE '%IBPS Mains 2026%';

-- STEP 2: Find all tests in this batch
-- Replace 'BATCH_ID_HERE' with the actual ID from step 1
SELECT id, name, test_number 
FROM tests 
WHERE batch_id = 'BATCH_ID_HERE';

-- STEP 3: Find all questions in this batch
-- Replace 'BATCH_ID_HERE' with the actual ID from step 1
SELECT id, question_text, order_number 
FROM questions 
WHERE batch_id = 'BATCH_ID_HERE';

-- STEP 4: Delete test attempts for this batch (if any)
-- Replace 'BATCH_ID_HERE' with the actual ID from step 1
DELETE FROM test_attempts 
WHERE batch_id = 'BATCH_ID_HERE';

-- STEP 5: Delete questions for this batch
-- Replace 'BATCH_ID_HERE' with the actual ID from step 1
DELETE FROM questions 
WHERE batch_id = 'BATCH_ID_HERE';

-- STEP 6: Delete tests for this batch
-- Replace 'BATCH_ID_HERE' with the actual ID from step 1
DELETE FROM tests 
WHERE batch_id = 'BATCH_ID_HERE';

-- STEP 7: Delete purchases for this batch
-- Replace 'BATCH_ID_HERE' with the actual ID from step 1
DELETE FROM purchases 
WHERE batch_id = 'BATCH_ID_HERE';

-- STEP 8: Finally, delete the batch itself
-- Replace 'BATCH_ID_HERE' with the actual ID from step 1
DELETE FROM batches 
WHERE id = 'BATCH_ID_HERE';

-- ============================================================================
-- VERIFICATION - Check deletion
-- ============================================================================

-- Verify batch is deleted
SELECT * FROM batches WHERE name ILIKE '%IBPS Mains 2026%';

-- Verify no orphaned data
SELECT COUNT(*) as remaining_questions FROM questions WHERE batch_id = 'BATCH_ID_HERE';
SELECT COUNT(*) as remaining_tests FROM tests WHERE batch_id = 'BATCH_ID_HERE';
SELECT COUNT(*) as remaining_attempts FROM test_attempts WHERE batch_id = 'BATCH_ID_HERE';

-- ============================================================================
-- ALTERNATIVE: ONE-CLICK DELETE (Use with caution!)
-- This deletes everything in one go - replace the batch_id first!
-- ============================================================================

-- DELETE FROM test_attempts WHERE batch_id IN (SELECT id FROM batches WHERE name ILIKE '%IBPS Mains 2026%');
-- DELETE FROM questions WHERE batch_id IN (SELECT id FROM batches WHERE name ILIKE '%IBPS Mains 2026%');
-- DELETE FROM tests WHERE batch_id IN (SELECT id FROM batches WHERE name ILIKE '%IBPS Mains 2026%');
-- DELETE FROM purchases WHERE batch_id IN (SELECT id FROM batches WHERE name ILIKE '%IBPS Mains 2026%');
-- DELETE FROM batches WHERE name ILIKE '%IBPS Mains 2026%';
