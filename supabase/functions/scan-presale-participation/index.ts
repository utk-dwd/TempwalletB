import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ethers } from 'https://esm.sh/ethers@6.7.0';

// --- Configuration ---
const PRICE_TIERS = [
  { minAmount: 0, maxAmount: 50, pricePerToken: 0.1 },
  { minAmount: 50, maxAmount: 100, pricePerToken: 0.08 },
  { minAmount: 100, maxAmount: 500, pricePerToken: 0.05 },
  { minAmount: 500, maxAmount: 1000, pricePerToken: 0.04 },
  { minAmount: 1000, maxAmount: 5000, pricePerToken: 0.02 },
  { minAmount: 5000, maxAmount: Infinity, pricePerToken: 0.01 }
];

const USDT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];
const allowedOrigins = ['https://tempwallets.com', 'https://www.tempwallets.com'];
const origin = req.headers.get('origin');

const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

const corsHeaders = {
  'Access-Control-Allow-Origin': corsOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BLOCK_RANGE_LIMIT = 499;

// --- Main Handler ---
Deno.serve(async (req) => {

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("Function started. Initializing clients...");
    
    const supabaseClient = createClient(
      Deno.env.get('PROJECT_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!
    );
    const provider = new ethers.JsonRpcProvider(Deno.env.get('ETHEREUM_NODE_URL')!);
    const presaleWalletAddress = Deno.env.get('VITE_DONATION_WALLET_ADDRESS')!;
    const usdtContractAddress = Deno.env.get('VITE_USDT_CONTRACT_ADDRESS')!;
    const usdtContract = new ethers.Contract(usdtContractAddress, USDT_ABI, provider);

    const { data: stateData } = await supabaseClient
      .from('system_state')
      .select('value')
      .eq('key', 'last_scanned_block')
      .single();

    const fromBlock = parseInt(stateData!.value, 10) + 1;
    const toBlock = await provider.getBlockNumber();

    if (fromBlock > toBlock) {
      return new Response(JSON.stringify({ message: 'No new blocks to scan.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    let totalEventsFound = 0;
    for (let currentBlock = fromBlock; currentBlock <= toBlock; currentBlock += (BLOCK_RANGE_LIMIT + 1)) {
      const endChunkBlock = Math.min(currentBlock + BLOCK_RANGE_LIMIT, toBlock);
      const filter = usdtContract.filters.Transfer(null, presaleWalletAddress);
      const events = await usdtContract.queryFilter(filter, currentBlock, endChunkBlock);
      
      if (events.length > 0) {
        totalEventsFound += events.length;
        for (const event of events) {
          const { from, value } = event.args;
          const txHash = event.transactionHash;
          const usdtAmount = parseFloat(ethers.formatUnits(value, 6));
          const tier = PRICE_TIERS.find(t => usdtAmount >= t.minAmount && usdtAmount < t.maxAmount);
          const tempTokensAssigned = tier ? usdtAmount / tier.pricePerToken : 0;

          const newParticipation = {
            participant_address: from,
            transaction_hash: txHash,
            usdt_amount: usdtAmount,
            temp_tokens_assigned: tempTokensAssigned,
          };

          const { data: existingTx } = await supabaseClient
            .from('presale_participations')
            .select('transaction_hash')
            .eq('transaction_hash', txHash)
            .single();

          if (!existingTx) {
            await supabaseClient
              .from('presale_participations')
              .insert(newParticipation);
          }
        }
      }
    }

    await supabaseClient
      .from('system_state')
      .update({ value: toBlock.toString() })
      .eq('key', 'last_scanned_block');

    return new Response(JSON.stringify({ message: `Successfully scanned up to block ${toBlock}. Found ${totalEventsFound} new participations in total.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, details: err.toString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
