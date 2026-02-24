import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl ? 'loaded' : 'missing');
console.log('Supabase Service Key:', supabaseServiceKey ? 'loaded' : 'missing');

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Database not configured: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
