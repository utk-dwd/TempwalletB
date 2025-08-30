import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ethers } from 'https://esm.sh/ethers@6.7.0';

// --- NEW: Configuration for Fixed Price Presale ---
const TOKEN_PRICE_USDT = 0.001;
const TOTAL_SUPPLY = 100000000;

const USDT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

const BLOCK_RANGE_LIMIT = 499;

// --- Main Handler ---
Deno.serve(async (req) => {
  const allowedOrigins = ['https://tempwallets.com', 'https://www.tempwallets.com', 'http://localhost:5173'];
  const origin = req.headers.get('origin') || '';
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('PROJECT_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!
    );
    const provider = new ethers.JsonRpcProvider(Deno.env.get('ETHEREUM_NODE_URL')!);
    const presaleWalletAddress = Deno.env.get('VITE_DONATION_WALLET_ADDRESS')!;
    const usdtContractAddress = Deno.env.get('VITE_USDT_CONTRACT_ADDRESS')!;
    const usdtContract = new ethers.Contract(usdtContractAddress, USDT_ABI, provider);

    // --- FETCH BOTH STATE VALUES ---
    const { data: stateData, error: stateError } = await supabaseClient
      .from('system_state')
      .select('key, value');

    if (stateError) throw stateError;

    const lastScannedBlock = parseInt(stateData.find(s => s.key === 'last_scanned_block')?.value || '0', 10);
    let totalTokensSold = parseFloat(stateData.find(s => s.key === 'total_tokens_sold')?.value || '0');

    const fromBlock = lastScannedBlock + 1;
    const toBlock = await provider.getBlockNumber();

    if (fromBlock > toBlock) {
      return new Response(JSON.stringify({ message: 'No new blocks to scan.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let totalEventsFound = 0;
    for (let currentBlock = fromBlock; currentBlock <= toBlock; currentBlock += (BLOCK_RANGE_LIMIT + 1)) {
      const endChunkBlock = Math.min(currentBlock + BLOCK_RANGE_LIMIT, toBlock);
      const filter = usdtContract.filters.Transfer(null, presaleWalletAddress);
      const events = await usdtContract.queryFilter(filter, currentBlock, endChunkBlock);
      
      if (events.length > 0) {
        totalEventsFound += events.length;
        for (const event of events) {
          // --- Check if presale is already sold out before processing ---
          if (totalTokensSold >= TOTAL_SUPPLY) {
            console.log("Presale is sold out. Skipping further transactions.");
            break; // Exit the loop over events
          }

          const { from, value } = event.args;
          const txHash = event.transactionHash;
          const usdtAmount = parseFloat(ethers.formatUnits(value, 6));

          // --- CALCULATE TOKENS WITH FIXED PRICE ---
          let tempTokensAssigned = usdtAmount / TOKEN_PRICE_USDT;
          
          // --- CHECK AGAINST TOTAL SUPPLY ---
          const remainingSupply = TOTAL_SUPPLY - totalTokensSold;
          if (tempTokensAssigned > remainingSupply) {
            console.warn(`Transaction ${txHash} exceeds remaining supply. Assigning only what's left.`);
            tempTokensAssigned = remainingSupply;
          }

          const newParticipation = {
            participant_address: from,
            transaction_hash: txHash,
            usdt_amount: usdtAmount,
            temp_tokens_assigned: tempTokensAssigned,
          };

          const { error: insertError } = await supabaseClient
            .from('presale_participations')
            .insert(newParticipation)
            .select()
            .maybeSingle();

          if (insertError && insertError.code !== '23505') {
            console.error(`Failed to insert participation ${txHash}:`, insertError.message);
          } else if (!insertError) {
            // --- UPDATE TOTAL TOKENS SOLD ---
            totalTokensSold += tempTokensAssigned;
          }
        }
      }
       if (totalTokensSold >= TOTAL_SUPPLY) break; // Exit the loop over blocks
    }

    // --- UPDATE BOTH STATE VALUES IN THE DATABASE ---
    await Promise.all([
      supabaseClient.from('system_state').update({ value: toBlock.toString() }).eq('key', 'last_scanned_block'),
      supabaseClient.from('system_state').update({ value: totalTokensSold.toString() }).eq('key', 'total_tokens_sold')
    ]);

    return new Response(JSON.stringify({ message: `Successfully scanned up to block ${toBlock}. Found ${totalEventsFound} new participations.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('An unhandled error occurred in the function:', err);
    return new Response(JSON.stringify({ error: err.message, details: err.toString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});