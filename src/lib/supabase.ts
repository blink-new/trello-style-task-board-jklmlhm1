
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Board = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type Column = {
  id: string;
  board_id: string;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
};

export type Tag = {
  id: string;
  name: string;
  color: string;
  created_at: string;
};

export type TaskTag = {
  task_id: string;
  tag_id: string;
};