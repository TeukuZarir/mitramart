import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY / SUPABASE_KEY in environment variables');
}

if (supabaseKey && supabaseKey.startsWith('sb_publishable_')) {
    console.warn('⚠️  SUPABASE_KEY is a publishable key. For backend access use SUPABASE_SERVICE_KEY or a server-side key with proper permissions.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Supabase client initialized');
