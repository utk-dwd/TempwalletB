DROP TABLE IF EXISTS public.donations CASCADE;
DROP TABLE IF EXISTS public.presale_participations CASCADE;
DROP TABLE IF EXISTS public.system_state CASCADE;

-- Create the table for presale participations with the correct names
CREATE TABLE public.presale_participations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  participant_address text NOT NULL,
  transaction_hash text NOT NULL,
  usdt_amount numeric NOT NULL,
  temp_tokens_assigned numeric NOT NULL,
  CONSTRAINT presale_participations_pkey PRIMARY KEY (id),
  CONSTRAINT presale_participations_transaction_hash_key UNIQUE (transaction_hash)
);

-- Add comments to explain each column for clarity
COMMENT ON TABLE public.presale_participations IS 'Stores every presale participation transaction.';
COMMENT ON COLUMN public.presale_participations.id IS 'Unique identifier for each participation record.';
COMMENT ON COLUMN public.presale_participations.created_at IS 'Timestamp of when the participation was recorded.';
COMMENT ON COLUMN public.presale_participations.participant_address IS 'The wallet address of the presale participant.';
COMMENT ON COLUMN public.presale_participations.transaction_hash IS 'The unique hash of the blockchain transaction.';
COMMENT ON COLUMN public.presale_participations.usdt_amount IS 'The amount of USDT contributed.';
COMMENT ON COLUMN public.presale_participations.temp_tokens_assigned IS 'The calculated amount of $Temp tokens awarded.';


-- Create the table to keep track of the wallet watcher's state
CREATE TABLE public.system_state (
  key text NOT NULL,
  value text NULL,
  CONSTRAINT system_state_pkey PRIMARY KEY (key)
);

-- Add a comment to explain the table's purpose
COMMENT ON TABLE public.system_state IS 'Stores system-level state, like the last scanned block number.';

-- Insert the initial record for our block scanner
-- This tells our function where to start scanning from.
INSERT INTO public.system_state (key, value) VALUES ('last_scanned_block', '0');
