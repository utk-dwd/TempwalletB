-- CreateEnum
CREATE TYPE "public"."SupportedNetwork" AS ENUM ('Avalanche', 'Ethereum', 'Base', 'Arbitrum');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "metamask_address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(3) NOT NULL,
    "total_wallets_created" INTEGER NOT NULL DEFAULT 0,
    "mixpanel_id" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TempWallet" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "wallet_number" INTEGER NOT NULL,
    "external_account_number" INTEGER NOT NULL,
    "index" INTEGER NOT NULL,
    "network_key" "public"."SupportedNetwork" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated" TIMESTAMP(3) NOT NULL,
    "parent_metamask_address" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "TempWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Balance" (
    "id" TEXT NOT NULL,
    "temp_wallet_id" TEXT NOT NULL,
    "token_address" TEXT NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "amount" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "formatted_amount" TEXT NOT NULL,
    "symbol" TEXT,
    "icon_url" TEXT,
    "last_updated" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" TEXT NOT NULL,
    "temp_wallet_id" TEXT NOT NULL,
    "tx_hash" TEXT,
    "state" TEXT NOT NULL,
    "message" TEXT,
    "token_symbol" TEXT,
    "amount" TEXT,
    "to_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_metamask_address_key" ON "public"."User"("metamask_address");

-- CreateIndex
CREATE INDEX "TempWallet_last_updated_idx" ON "public"."TempWallet"("last_updated");

-- CreateIndex
CREATE UNIQUE INDEX "TempWallet_address_network_key_key" ON "public"."TempWallet"("address", "network_key");

-- AddForeignKey
ALTER TABLE "public"."TempWallet" ADD CONSTRAINT "TempWallet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Balance" ADD CONSTRAINT "Balance_temp_wallet_id_fkey" FOREIGN KEY ("temp_wallet_id") REFERENCES "public"."TempWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_temp_wallet_id_fkey" FOREIGN KEY ("temp_wallet_id") REFERENCES "public"."TempWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
