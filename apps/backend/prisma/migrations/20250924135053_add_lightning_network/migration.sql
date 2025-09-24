-- CreateEnum
CREATE TYPE "ChannelStatus" AS ENUM ('PENDING', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PAYMENT', 'REFILL', 'REQUEST_ACCEPTED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "lightning_channels" (
    "id" TEXT NOT NULL,
    "channelNumber" TEXT NOT NULL,
    "user1Address" TEXT NOT NULL,
    "user2Address" TEXT NOT NULL,
    "user1MarginLeft" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "user2MarginLeft" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "ChannelStatus" NOT NULL DEFAULT 'PENDING',
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lightning_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lightning_transactions" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "fromUser" TEXT NOT NULL,
    "toUser" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransactionType" NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lightning_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_requests" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "fromUser" TEXT NOT NULL,
    "toUser" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "payment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lightning_channels_channelNumber_key" ON "lightning_channels"("channelNumber");

-- AddForeignKey
ALTER TABLE "lightning_transactions" ADD CONSTRAINT "lightning_transactions_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "lightning_channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "lightning_channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
