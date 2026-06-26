import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xuetoabqznzqpkgipbfk.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_4izfwy39fTMJrSR5cdUfdQ_GO9YZqVh';

export const supabase = createClient(supabaseUrl, supabaseKey);
