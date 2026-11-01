import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import {PROJECT_URL,PUBLISHABLE_KEY} from './config.js';
// One auth client per browser context; all OS surfaces share the same session lifecycle.
export const client=createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
