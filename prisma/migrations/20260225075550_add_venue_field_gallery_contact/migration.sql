/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Field` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Field` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Field` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Field` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Field` table. All the data in the column will be lost.
  - The `floorType` column on the `Field` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `updatedAt` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `VendorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `VendorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Venue` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Venue` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Venue` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Venue` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `Venue` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `Venue` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Venue` table. All the data in the column will be lost.
  - You are about to drop the `Contact` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FieldSchedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Media` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `length` on table `Field` required. This step will fail if there are existing NULL values in that column.
  - Made the column `width` on table `Field` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `type` on the `Field` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_userId_fkey";

-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_venueId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "EventParticipant" DROP CONSTRAINT "EventParticipant_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventParticipant" DROP CONSTRAINT "EventParticipant_userId_fkey";

-- DropForeignKey
ALTER TABLE "Field" DROP CONSTRAINT "Field_venueId_fkey";

-- DropForeignKey
ALTER TABLE "FieldSchedule" DROP CONSTRAINT "FieldSchedule_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "Media" DROP CONSTRAINT "Media_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "Media" DROP CONSTRAINT "Media_venueId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_orderId_fkey";

-- DropForeignKey
ALTER TABLE "VendorProfile" DROP CONSTRAINT "VendorProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "Venue" DROP CONSTRAINT "Venue_vendorId_fkey";

-- DropIndex
DROP INDEX "CartItem_fieldId_date_idx";

-- DropIndex
DROP INDEX "CartItem_userId_idx";

-- DropIndex
DROP INDEX "EventParticipant_userId_idx";

-- DropIndex
DROP INDEX "Order_status_createdAt_idx";

-- DropIndex
DROP INDEX "Order_userId_idx";

-- DropIndex
DROP INDEX "OrderItem_fieldId_date_idx";

-- DropIndex
DROP INDEX "OrderItem_orderId_idx";

-- DropIndex
DROP INDEX "Payment_status_expiredAt_idx";

-- AlterTable
ALTER TABLE "Field" DROP COLUMN "createdAt",
DROP COLUMN "deletedAt",
DROP COLUMN "imageUrl",
DROP COLUMN "isDeleted",
DROP COLUMN "updatedAt",
DROP COLUMN "floorType",
ADD COLUMN     "floorType" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "length" SET NOT NULL,
ALTER COLUMN "length" SET DEFAULT 0,
ALTER COLUMN "width" SET NOT NULL,
ALTER COLUMN "width" SET DEFAULT 0,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "VendorProfile" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Venue" DROP COLUMN "createdAt",
DROP COLUMN "deletedAt",
DROP COLUMN "imageUrl",
DROP COLUMN "isDeleted",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
DROP COLUMN "updatedAt";

-- DropTable
DROP TABLE "Contact";

-- DropTable
DROP TABLE "FieldSchedule";

-- DropTable
DROP TABLE "Media";

-- DropEnum
DROP TYPE "FieldType";

-- DropEnum
DROP TYPE "FloorType";

-- CreateTable
CREATE TABLE "VenueImage" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "VenueImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldImage" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "FieldImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldContact" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "FieldContact_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VendorProfile" ADD CONSTRAINT "VendorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueImage" ADD CONSTRAINT "VenueImage_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldImage" ADD CONSTRAINT "FieldImage_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldContact" ADD CONSTRAINT "FieldContact_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
