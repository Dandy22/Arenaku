-- AlterTable
ALTER TABLE "Field" ADD COLUMN     "thumbnailUrl" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "VenueImage" ADD COLUMN     "title" TEXT;
