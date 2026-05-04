/*
  Warnings:

  - You are about to drop the column `category` on the `EventTicketTier` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EventTicketTier" DROP COLUMN "category";

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "thumbnailUrl" TEXT NOT NULL DEFAULT '';
