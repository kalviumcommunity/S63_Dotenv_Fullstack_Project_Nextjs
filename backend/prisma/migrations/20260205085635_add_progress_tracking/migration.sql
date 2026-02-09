/*
  Warnings:

  - You are about to drop the `UploadedFile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UploadedFile" DROP CONSTRAINT "UploadedFile_uploaderId_fkey";

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "progressPercentage" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "UploadedFile";

-- CreateTable
CREATE TABLE "ProgressUpdate" (
    "id" SERIAL NOT NULL,
    "issueId" INTEGER NOT NULL,
    "percentage" INTEGER NOT NULL,
    "notes" TEXT,
    "updatedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgressUpdate_issueId_idx" ON "ProgressUpdate"("issueId");

-- CreateIndex
CREATE INDEX "ProgressUpdate_createdAt_idx" ON "ProgressUpdate"("createdAt");

-- CreateIndex
CREATE INDEX "ProgressUpdate_updatedById_idx" ON "ProgressUpdate"("updatedById");

-- AddForeignKey
ALTER TABLE "ProgressUpdate" ADD CONSTRAINT "ProgressUpdate_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressUpdate" ADD CONSTRAINT "ProgressUpdate_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
