
-- Add user_id column to boards table
ALTER TABLE boards ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update RLS policies to be user-based
DROP POLICY IF EXISTS "Allow public access to boards" ON boards;
DROP POLICY IF EXISTS "Allow public access to columns" ON columns;
DROP POLICY IF EXISTS "Allow public access to tasks" ON tasks;
DROP POLICY IF EXISTS "Allow public access to tags" ON tags;
DROP POLICY IF EXISTS "Allow public access to task_tags" ON task_tags;

-- Create user-based policies
CREATE POLICY "Users can CRUD their own boards" ON boards
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD columns in their boards" ON columns
  FOR ALL USING (
    board_id IN (
      SELECT id FROM boards WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can CRUD tasks in their columns" ON tasks
  FOR ALL USING (
    column_id IN (
      SELECT c.id FROM columns c
      JOIN boards b ON c.board_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- Tags can be shared across users
CREATE POLICY "Users can read all tags" ON tags
  FOR SELECT USING (true);

CREATE POLICY "Users can create tags" ON tags
  FOR INSERT WITH CHECK (true);

-- Task tags junction table policy
CREATE POLICY "Users can CRUD task_tags for their tasks" ON task_tags
  FOR ALL USING (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN columns c ON t.column_id = c.id
      JOIN boards b ON c.board_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );