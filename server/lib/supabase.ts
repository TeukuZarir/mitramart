import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in environment variables');
    // process.exit(1); Disable termination so Vercel can return logs instead of 502 Bad Gateway
}

export const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Supabase client initialized');
