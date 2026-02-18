/*
  Warnings:

  - You are about to drop the column `communityId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the `Community` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `creatorId` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Community" DROP CONSTRAINT "Community_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_communityId_fkey";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "communityId",
ADD COLUMN     "creatorId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Community";

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
