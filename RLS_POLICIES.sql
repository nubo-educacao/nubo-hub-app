-- Enable RLS on tables
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous read access (Public Catalog)
CREATE POLICY "Allow public read access" ON opportunities FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON institutions FOR SELECT USING (true);

-- Note: By enabling RLS, all other operations (INSERT, UPDATE, DELETE) are implicitly DENIED 
-- for anonymous users unless a specific policy is created to allow them.
-- Since we only created a SELECT policy, the database is now secure against unauthorized writes.
