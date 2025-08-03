import type { Database } from '#/types/database';

import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.',
  );
}

// Create Supabase client with TypeScript support
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable automatic session handling
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Use localStorage for session persistence (compatible with SSR)
    storage: globalThis?.localStorage,
  },
  // Configure real-time subscriptions
  realtime: {
    // Optional: Configure heartbeat interval
    heartbeatIntervalMs: 30_000,
    // Optional: Reconnect automatically on connection loss
    reconnectAfterMs: (retryCount: number) =>
      Math.min(retryCount * 1000, 30_000),
  },
});

// Helper function to get current user
export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
};

// Helper function to get current session
export const getCurrentSession = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  return { session, error };
};

// Export types for use in components
export type { Database } from '#/types/database';
