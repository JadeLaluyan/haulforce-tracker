-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "helperIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
