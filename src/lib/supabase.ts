import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nmirpozhgcoabcjwgvqk.supabase.co';
const supabaseAnonKey = 'sb_publishable_5MIGD4RB9j_vBZylu7SsOw_mVzfFcP_';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
