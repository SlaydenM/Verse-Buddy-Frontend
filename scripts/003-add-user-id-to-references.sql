-- Add user_id column to references table
ALTER TABLE "references"
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_references_user_id ON "references"(user_id);

-- Update existing references to have a default user_id (optional - for migration)
-- You might want to remove this if you want to start fresh
-- UPDATE references SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

-- Make user_id NOT NULL after migration (uncomment if you want to enforce this)
-- ALTER TABLE references ALTER COLUMN user_id SET NOT NULL;
