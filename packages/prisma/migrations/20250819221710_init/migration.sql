/*
  Warnings:

  - A unique constraint covering the columns `[temp_wallet_id,token_address]` on the table `Balance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Balance_temp_wallet_id_token_address_key" ON "public"."Balance"("temp_wallet_id", "token_address");
