-- Create the references table
CREATE TABLE IF NOT EXISTS "references" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  start_verse INTEGER NOT NULL,
  end_verse INTEGER NOT NULL,
  final_verse INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_references_book_chapter ON "references"(book, chapter);
CREATE INDEX IF NOT EXISTS idx_references_version ON "references"(version);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_references_updated_at 
  BEFORE UPDATE ON "references" 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
