import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = "https://vlcrqrmqghskrdhhsgqt.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsY3Jxcm1xZ2hza3JkaGhzZ3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2ODU2NTcsImV4cCI6MjA0ODI2MTY1N30.DDpFswiG9PgZqeQZIA5KSS_k8sIzRKg4A3Wj-n7xkIU";

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
});