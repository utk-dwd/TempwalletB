// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

// Ensure that environment variables are loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Please check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true, // Automatically refreshes the session token
    persistSession: true, // Persists the session in storage (localStorage in this case)
    storage: localStorage, // Uses localStorage for session persistence
  },
});

/**
 * Sets a session token for Supabase authentication.
 * This is useful if you receive a JWT from a custom auth endpoint (like an Edge Function)
 * and need to set it for the Supabase client.
 * @param accessToken The access token (JWT) to set.
 * @param refreshToken Optional refresh token.
 */
export const setAuthToken = async (accessToken: string, refreshToken: string = '') => {
  try {
    // Supabase's setSession expects an object with access_token and refresh_token
    const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error) {
      console.error('Error setting auth token:', error.message);
      throw error;
    }
    console.log('Supabase session set successfully:', data);
    return data;
  } catch (error: any) {
    console.error('Failed to set auth token:', error.message);
    throw error;
  }
};

// Optional: Monitor auth state changes for debugging
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase Auth Event:', event, 'Session:', session);
});