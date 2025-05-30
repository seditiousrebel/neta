import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase'; // Ensure this path is correct

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Standard Supabase client for server-side or general use
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Define a function to create a Supabase client for client-side operations (browser)
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>( // Specify Database type
    supabaseUrl,
    supabaseAnonKey
  );
}
