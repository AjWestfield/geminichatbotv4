-- Verify the database schema is correctly updated

-- 1. Check the column type for original_image_id
SELECT 
    table_name,
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'images' 
AND column_name = 'original_image_id';

-- 2. Check if there are any constraints
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'images'
AND kcu.column_name = 'original_image_id';

-- 3. Try a test insert to verify it accepts text IDs
-- This is safe as it uses a transaction that rolls back
BEGIN;
INSERT INTO images (
    url, 
    prompt, 
    model, 
    original_image_id
) VALUES (
    'https://test.com/test.jpg',
    'Test prompt',
    'test-model',
    'img_1748976895957_5b516nlg2' -- Local ID format
);
-- Check if it worked
SELECT original_image_id FROM images WHERE url = 'https://test.com/test.jpg';
-- Roll back so we don't actually insert test data
ROLLBACK;

-- 4. Show successful message
SELECT 'If you see this message and no errors above, the schema is correctly updated!' as status;