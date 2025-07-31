// supabase/functions/auth/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ethers } from 'https://esm.sh/ethers@6';

const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method === 'POST') {
    try {
      const { metamask_address, signature } = await req.json();

      if (!metamask_address || !signature) {
        console.error('Missing metamask_address or signature in request body.');
        return new Response(JSON.stringify({ error: 'Missing metamask_address or signature' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Important: CONSTANT_MESSAGE must strictly match the one used in frontend walletUtils.ts
      const CONSTANT_MESSAGE = 'You are creating a new tempwallet, this will not cost you anything';

      let recoveredAddress;
      try {
        recoveredAddress = ethers.verifyMessage(CONSTANT_MESSAGE, signature);
      } catch (verifyError) {
        console.error('Signature verification failed:', verifyError);
        return new Response(JSON.stringify({ error: 'Signature verification failed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        });
      }

      if (recoveredAddress.toLowerCase() !== metamask_address.toLowerCase()) {
        console.error(`Mismatched addresses: Recovered=${recoveredAddress.toLowerCase()}, Provided=${metamask_address.toLowerCase()}`);
        return new Response(JSON.stringify({ error: 'Signature does not match provided address' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        });
      }

      const { data: user, error: upsertError } = await supabaseAdmin
        .from('users')
        .upsert(
          {
            metamask_address: metamask_address.toLowerCase(),
            last_login: new Date().toISOString(),
          },
          {
            onConflict: 'metamask_address',
            ignoreDuplicates: false,
          }
        )
        .select('id, mixpanel_id, total_wallets_created')
        .single();

      if (upsertError) {
        console.error('Error upserting user:', upsertError);
        return new Response(JSON.stringify({ error: `Failed to upsert user: ${upsertError.message}` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      if (!user) {
        console.error('User data not returned after upsert.');
        return new Response(JSON.stringify({ error: 'User data processing failed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.signInWithIdToken({
        provider: 'ethereum',
        token: signature,
        data: {
          metamask_address: metamask_address.toLowerCase(),
          user_id: user.id
        }
      });

      if (tokenError) {
        console.error('Error generating Supabase JWT:', tokenError);
        return new Response(JSON.stringify({ error: `Failed to generate auth token: ${tokenError.message}` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      if (!tokenData?.session?.access_token) {
        console.error('Access token not returned from Supabase auth.');
        return new Response(JSON.stringify({ error: 'Authentication token not generated' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      return new Response(JSON.stringify({
        token: tokenData.session.access_token,
        user_id: user.id,
        mixpanel_id: user.mixpanel_id,
        total_wallets_created: user.total_wallets_created,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } catch (error: any) {
      console.error('Unhandled error in auth endpoint:', error.message, error.stack);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
});