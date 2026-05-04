-- AlterEnum
ALTER TYPE "EventStatus" ADD VALUE 'DRAFT';

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
