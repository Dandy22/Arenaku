-- DropIndex
DROP INDEX "EventTicket_eventId_userId_key";

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "ticketPrice" INTEGER DEFAULT 0,
ADD COLUMN     "ticketTierId" TEXT;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "allowMultiplePurchases" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "snapToken" TEXT;

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "closeHour" INTEGER NOT NULL DEFAULT 22,
ADD COLUMN     "isOpen" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "openHour" INTEGER NOT NULL DEFAULT 8;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_ticketTierId_fkey" FOREIGN KEY ("ticketTierId") REFERENCES "EventTicketTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
