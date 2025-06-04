-- Manual Migration Fix for original_image_id
-- Run this in your Supabase SQL Editor

-- Step 1: Check current column type
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'images' 
AND column_name = 'original_image_id';

-- Step 2: Drop the foreign key constraint (if exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'images_original_image_id_fkey'
        AND table_name = 'images'
    ) THEN
        ALTER TABLE images DROP CONSTRAINT images_original_image_id_fkey;
        RAISE NOTICE 'Dropped foreign key constraint';
    ELSE
        RAISE NOTICE 'No foreign key constraint found';
    END IF;
END $$;

-- Step 3: Change column type from UUID to TEXT
ALTER TABLE images 
ALTER COLUMN original_image_id TYPE TEXT;

-- Step 4: Add explanatory comment
COMMENT ON COLUMN images.original_image_id IS 
'ID of the original image (for edited images). Changed from UUID to TEXT to support local image IDs like img_1748976895957_5b516nlg2';

-- Step 5: Verify the change
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    col_description(pgc.oid, pa.attnum) as comment
FROM information_schema.columns
JOIN pg_class pgc ON pgc.relname = 'images'
JOIN pg_attribute pa ON pa.attrelid = pgc.oid AND pa.attname = 'original_image_id'
WHERE table_name = 'images' 
AND column_name = 'original_image_id';

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Migration completed successfully! The original_image_id column now accepts text values.';
END $$;