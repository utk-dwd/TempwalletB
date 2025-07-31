-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metamask_address TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  total_wallets_created INTEGER DEFAULT 0,
  mixpanel_id TEXT
);

-- Create temp_wallets table
CREATE TABLE IF NOT EXISTS temp_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  wallet_number INTEGER NOT NULL,
  external_account_number INTEGER NOT NULL,
  index INTEGER NOT NULL,
  network_key TEXT NOT NULL CHECK (network_key IN ('Avalanche', 'Ethereum', 'Base', 'Arbitrum')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  parent_metamask_address TEXT NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create unique index for active wallets to prevent duplicate active wallets
CREATE UNIQUE INDEX idx_active_temp_wallets ON temp_wallets (address, network_key) WHERE deleted_at IS NULL;

-- Create balances table
CREATE TABLE IF NOT EXISTS balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temp_wallet_id UUID REFERENCES temp_wallets(id) ON DELETE CASCADE,
  token_address TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  amount TEXT NOT NULL,  -- Store as string for BigInt precision
  decimals INTEGER NOT NULL,
  formatted_amount TEXT NOT NULL,
  symbol TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Add a unique constraint for balance entries for a given wallet and token
  UNIQUE (temp_wallet_id, token_address, chain_id)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temp_wallet_id UUID REFERENCES temp_wallets(id) ON DELETE CASCADE,
  tx_hash TEXT NOT NULL UNIQUE, -- tx_hash should be unique
  state TEXT NOT NULL CHECK (state IN ('idle', 'pending', 'success', 'error')),
  message TEXT,
  token_symbol TEXT,
  amount TEXT,
  to_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE temp_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users table policies
CREATE POLICY "Allow individual read access to users" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow individual update access to users" ON users
  FOR UPDATE USING (auth.uid() = id);

-- This policy will allow users to create their own user entry upon first login
CREATE POLICY "Allow users to create their own record" ON users
  FOR INSERT WITH CHECK (true); 


-- RLS Policy for `users` table (Adjust if your `users.id` is not `auth.uid()`)
CREATE POLICY "Enable read access for authenticated users" ON users
  FOR SELECT USING (auth.role() = 'authenticated'); -- This allows any authenticated user to read all users.
                                                 -- If you want specific user to read only their data,
                                                 -- you need to link `users.id` with `auth.uid()`.
                                                 -- For this example, let's refine it:
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (id = auth.uid()); -- This assumes 'users.id' column stores the 'auth.uid()'.

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- temp_wallets table policies
CREATE POLICY "Enable read access for wallets belonging to authenticated user" ON temp_wallets
  FOR SELECT USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Enable insert for wallets belonging to authenticated user" ON temp_wallets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable update for wallets belonging to authenticated user" ON temp_wallets
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable delete for wallets belonging to authenticated user" ON temp_wallets
  FOR DELETE USING (user_id = auth.uid());

-- balances table policies
CREATE POLICY "Enable read access for balances belonging to authenticated user's wallets" ON balances
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM temp_wallets WHERE id = temp_wallet_id AND user_id = auth.uid() AND deleted_at IS NULL)
  );

CREATE POLICY "Enable insert for balances belonging to authenticated user's wallets" ON balances
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM temp_wallets WHERE id = temp_wallet_id AND user_id = auth.uid() AND deleted_at IS NULL)
  );

CREATE POLICY "Enable update for balances belonging to authenticated user's wallets" ON balances
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM temp_wallets WHERE id = temp_wallet_id AND user_id = auth.uid() AND deleted_at IS NULL)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM temp_wallets WHERE id = temp_wallet_id AND user_id = auth.uid() AND deleted_at IS NULL)
  );

CREATE POLICY "Enable delete for balances belonging to authenticated user's wallets" ON balances
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM temp_wallets WHERE id = temp_wallet_id AND user_id = auth.uid() AND deleted_at IS NULL)
  );

-- transactions table policies
CREATE POLICY "Enable read access for transactions belonging to authenticated user's wallets" ON transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM temp_wallets WHERE id = temp_wallet_id AND user_id = auth.uid() AND deleted_at IS NULL)
  );

CREATE POLICY "Enable insert for transactions belonging to authenticated user's wallets" ON transactions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM temp_wallets WHERE id = temp_wallet_id AND user_id = auth.uid() AND deleted_at IS NULL)
  );

CREATE POLICY "Enable update for transactions belonging to authenticated user's wallets" ON transactions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM temp_wallets WHERE id = temp_wallet_id AND user_id = auth.uid() AND deleted_at IS NULL)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM temp_wallets WHERE id = temp_wallet_id AND user_id = auth.uid() AND deleted_at IS NULL)
  );

-- Trigger to update last_login
CREATE OR REPLACE FUNCTION update_last_login_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_login = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_update_last_login
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_last_login_timestamp();