-- CreateEnum
CREATE TYPE "Role" AS ENUM ('citizen', 'officer', 'admin');

-- CreateEnum
CREATE TYPE "IssueCategory" AS ENUM ('GARBAGE', 'WATER_SUPPLY', 'ROAD_DAMAGE', 'STREETLIGHT', 'OTHER');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('REPORTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'citizen';

-- CreateTable
CREATE TABLE "Issue" (
    "id" SERIAL NOT NULL,
    "publicId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "IssueCategory" NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "status" "IssueStatus" NOT NULL DEFAULT 'REPORTED',
    "reportedById" INTEGER NOT NULL,
    "assignedToId" INTEGER,
    "slaDeadline" TIMESTAMP(3),
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "mediaUrls" JSONB,
    "resolutionNotes" TEXT,
    "proofUrls" JSONB,
    "satisfactionRating" INTEGER,
    "reopened" BOOLEAN NOT NULL DEFAULT false,
    "timeline" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Issue_publicId_key" ON "Issue"("publicId");

-- CreateIndex
CREATE INDEX "Issue_status_idx" ON "Issue"("status");

-- CreateIndex
CREATE INDEX "Issue_category_idx" ON "Issue"("category");

-- CreateIndex
CREATE INDEX "Issue_reportedById_idx" ON "Issue"("reportedById");

-- CreateIndex
CREATE INDEX "Issue_assignedToId_idx" ON "Issue"("assignedToId");

-- CreateIndex
CREATE INDEX "Issue_createdAt_idx" ON "Issue"("createdAt");

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
