import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tjtzyfbgpwwhiblihxxl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqdHp5ZmJncHd3aGlibGloeHhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNzc4MTUsImV4cCI6MjA4ODk1MzgxNX0.yenKA_P5xITb3LTT0jsdjSvIGozLJ5hc2y-38Zn_hnk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
