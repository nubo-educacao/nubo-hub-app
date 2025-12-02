-- 1. Update institutions (ensure external_code)
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS external_code TEXT;

-- 2. Update campus (add institution_id)
CREATE TABLE IF NOT EXISTS campus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  external_code TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE campus ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id);
ALTER TABLE campus ADD COLUMN IF NOT EXISTS external_code TEXT;
ALTER TABLE campus ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE campus ADD COLUMN IF NOT EXISTS state TEXT;

-- 3. Update courses (add campus_id)
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_name TEXT NOT NULL,
  course_code TEXT,
  vacancies JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE courses ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES campus(id);

-- Ensure unique course_code per campus
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'courses_campus_id_course_code_key'
    ) THEN
        ALTER TABLE courses ADD CONSTRAINT courses_campus_id_course_code_key UNIQUE (campus_id, course_code);
    END IF;
END $$;

-- 4. Update opportunities
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS semester TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS shift TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS scholarship_type TEXT;
-- City and State moved to Campus
-- ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS city TEXT; 
-- ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS cutoff_score NUMERIC;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS opportunity_type TEXT;

-- 5. Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus ENABLE ROW LEVEL SECURITY;

-- 6. Policies
DROP POLICY IF EXISTS "Allow public read access" ON courses;
CREATE POLICY "Allow public read access" ON courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON campus;
CREATE POLICY "Allow public read access" ON campus FOR SELECT USING (true);

-- 7. Reload schema
NOTIFY pgrst, 'reload schema';

-- 8. Persistent Chat History
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender TEXT CHECK (sender IN ('user', 'cloudinha')),
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS Policies for chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own messages" ON chat_messages;
CREATE POLICY "Users can view their own messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own messages" ON chat_messages;
CREATE POLICY "Users can insert their own messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

