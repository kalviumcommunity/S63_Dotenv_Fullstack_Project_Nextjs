-- Ensure password column exists on User table for auth flows
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "password" TEXT;

