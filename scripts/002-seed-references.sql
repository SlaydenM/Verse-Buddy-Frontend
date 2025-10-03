-- Insert some sample references
INSERT INTO references (version, book, chapter, start_verse, end_verse, final_verse) VALUES
('KJV', 'John', 3, 16, 17, 36),
('KJV', 'Psalms', 23, 1, 6, 6),
('KJV', 'Genesis', 1, 1, 31, 31),
('KJV', 'Matthew', 5, 3, 10, 48),
('NIV', 'Romans', 8, 28, 39, 39),
('ESV', 'Ephesians', 2, 8, 10, 22),
('KJV', 'Philippians', 4, 13, 13, 23),
('KJV', '1 Corinthians', 13, 4, 8, 13)
ON CONFLICT DO NOTHING;
