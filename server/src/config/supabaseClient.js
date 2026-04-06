//supabase client initialization
import {createClient} from '@supabase/supabase-js'

const supabaseURL = process.env.SUPABASE_URL;
const supabaseAnonkey = process.env.SUPABASE_ANON_KEY;

if (!supabaseURL || !supabaseAnonkey){
    throw new Error("Missing Supabase_URL or SUPABASE_ANON_KEY in environment variables");
}
const supabase = createClient(supabaseURL, supabaseAnonkey);

module.exports = {supabase};