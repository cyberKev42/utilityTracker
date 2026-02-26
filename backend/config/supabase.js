import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('ENV CHECK:');
console.log('SUPABASE_URL:', supabaseUrl ? 'FOUND' : 'MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'FOUND' : 'MISSING');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Database not configured: missing env vars');
}

export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;
