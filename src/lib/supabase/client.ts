import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase'; // Ensure this path is correct

// Define a function to create a Supabase client for client-side operations
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>( // Specify Database type
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
