/*
  Warnings:

  - Added the required column `netPay` to the `PayrollInvoice` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PayrollInvoice" DROP CONSTRAINT "PayrollInvoice_driverId_fkey";

-- AlterTable
ALTER TABLE "CashAdvance" ADD COLUMN     "helperId" TEXT,
ALTER COLUMN "driverId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PayrollInvoice" ADD COLUMN     "advanceDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "helperId" TEXT,
ADD COLUMN     "netPay" DECIMAL(12,2),
ALTER COLUMN "driverId" DROP NOT NULL;

-- Backfill netPay for existing rows (no deduction concept existed before
-- this migration, so net pay equals the gross total already recorded).
UPDATE "PayrollInvoice" SET "netPay" = "totalEarnings" WHERE "netPay" IS NULL;

ALTER TABLE "PayrollInvoice" ALTER COLUMN "netPay" SET NOT NULL;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "helperFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "helperId" TEXT;

-- CreateTable
CREATE TABLE "Helper" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Helper_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CashAdvance_helperId_idx" ON "CashAdvance"("helperId");

-- CreateIndex
CREATE INDEX "PayrollInvoice_driverId_idx" ON "PayrollInvoice"("driverId");

-- CreateIndex
CREATE INDEX "PayrollInvoice_helperId_idx" ON "PayrollInvoice"("helperId");

-- CreateIndex
CREATE INDEX "Trip_helperId_idx" ON "Trip"("helperId");

-- AddForeignKey
ALTER TABLE "CashAdvance" ADD CONSTRAINT "CashAdvance_helperId_fkey" FOREIGN KEY ("helperId") REFERENCES "Helper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_helperId_fkey" FOREIGN KEY ("helperId") REFERENCES "Helper"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollInvoice" ADD CONSTRAINT "PayrollInvoice_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollInvoice" ADD CONSTRAINT "PayrollInvoice_helperId_fkey" FOREIGN KEY ("helperId") REFERENCES "Helper"("id") ON DELETE SET NULL ON UPDATE CASCADE;
