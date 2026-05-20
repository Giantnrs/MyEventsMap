-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "flagged" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "banned" BOOLEAN NOT NULL DEFAULT false;
