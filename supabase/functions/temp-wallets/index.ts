// supabase/functions/temp-wallets/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Supabase client for authenticated access (will use RLS)
// The JWT from the 'auth' function will allow this client to operate under RLS policies.
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);

// Define the CORS headers for your allowed origins
const allowedOrigins = [
  'https://tempwallets.com',
  'https://www.tempwallets.com',
  'http://localhost:5173'
];

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS', // Add allowed methods
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Ensure user is authenticated
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('Unauthorized access attempt: No Bearer token.');
    return new Response(JSON.stringify({ error: 'Unauthorized: No access token provided.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) {
    console.error('Authentication error:', userError?.message || 'User not found.');
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or expired token.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    });
  }

  const user_id = user.id; // This is the user ID from auth.users (and your 'users' table)

  // --- POST: Create a new temp_wallet ---
  if (req.method === 'POST') {
    try {
      const { address, wallet_number, external_account_number, index, network_key, parent_metamask_address } = await req.json();

      if (!address || typeof wallet_number === 'undefined' || typeof external_account_number === 'undefined' || typeof index === 'undefined' || !network_key || !parent_metamask_address) {
        console.warn('Bad request: Missing required fields for temp wallet creation.');
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Validate network_key against allowed values
      const allowedNetworkKeys = ['Avalanche', 'Ethereum', 'Base', 'Arbitrum'];
      if (!allowedNetworkKeys.includes(network_key)) {
        console.warn('Bad request: Invalid network_key provided.');
        return new Response(JSON.stringify({ error: 'Invalid network_key' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      const { data, error } = await supabase
        .from('temp_wallets')
        .insert({
          user_id: user_id, // Link to the authenticated user
          address: address.toLowerCase(),
          wallet_number,
          external_account_number,
          index,
          network_key,
          parent_metamask_address: parent_metamask_address.toLowerCase(),
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation error code
          console.warn(`Attempted to create duplicate wallet: ${address} on ${network_key}`);
          return new Response(JSON.stringify({ error: 'Wallet already exists for this user on this network.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409, // Conflict
          });
        }
        console.error('Error inserting temp wallet:', error.message);
        return new Response(JSON.stringify({ error: `Failed to create temp wallet: ${error.message}` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      // Update total_wallets_created in the users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ total_wallets_created: (user.user_metadata.total_wallets_created || 0) + 1 }) // Assuming total_wallets_created is in user_metadata or similar
        .eq('id', user_id);

      if (updateError) {
        console.error('Failed to update total_wallets_created:', updateError.message);
        // This error doesn't block wallet creation, just logs it.
      }


      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201, // Created
      });

    } catch (error: any) {
      console.error('Unhandled error in POST /temp-wallets:', error.message, error.stack);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
  }

  // --- GET: Retrieve temp_wallets for the authenticated user ---
  else if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('temp_wallets')
        .select('*')
        .eq('user_id', user_id)
        .is('deleted_at', null); // Only fetch non-deleted wallets

      if (error) {
        console.error('Error fetching temp wallets:', error.message);
        return new Response(JSON.stringify({ error: `Failed to fetch temp wallets: ${error.message}` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } catch (error: any) {
      console.error('Unhandled error in GET /temp-wallets:', error.message, error.stack);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
  }

  // --- DELETE: Soft delete a temp_wallet ---
  else if (req.method === 'DELETE') {
    try {
      // Extract wallet ID from path (e.g., /temp-wallets/<wallet_id>)
      const url = new URL(req.url);
      const parts = url.pathname.split('/');
      const wallet_id = parts[parts.length - 1]; // Last part should be the ID

      if (!wallet_id) {
        console.warn('Bad request: Missing wallet_id for deletion.');
        return new Response(JSON.stringify({ error: 'Missing wallet ID' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Perform a soft delete by setting deleted_at timestamp
      const { data, error } = await supabase
        .from('temp_wallets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', wallet_id)
        .eq('user_id', user_id) // Ensure only the owner can delete
        .is('deleted_at', null) // Ensure it's not already deleted
        .select()
        .single();

      if (error) {
        console.error(`Error soft deleting temp wallet ${wallet_id}:`, error.message);
        return new Response(JSON.stringify({ error: `Failed to delete temp wallet: ${error.message}` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      if (!data) {
        console.warn(`Wallet ${wallet_id} not found or not owned by user ${user_id}, or already deleted.`);
        return new Response(JSON.stringify({ error: 'Wallet not found, not owned, or already deleted.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404, // Not Found or Forbidden
        });
      }

      return new Response(JSON.stringify({ message: 'Wallet soft-deleted successfully', wallet_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } catch (error: any) {
      console.error('Unhandled error in DELETE /temp-wallets:', error.message, error.stack);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
  }

  // --- Default: Method Not Allowed ---
  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
});