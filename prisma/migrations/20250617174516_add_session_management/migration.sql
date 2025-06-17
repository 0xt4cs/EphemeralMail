/*
  Warnings:

  - Added the required column `fingerprint` to the `EmailAddress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sessionId` to the `EmailAddress` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ApiUsage" ADD COLUMN "fingerprint" TEXT;
ALTER TABLE "ApiUsage" ADD COLUMN "sessionId" TEXT;

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmailAddress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "localPart" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailCount" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_EmailAddress" ("address", "createdAt", "domain", "emailCount", "id", "isActive", "lastUsed", "localPart") SELECT "address", "createdAt", "domain", "emailCount", "id", "isActive", "lastUsed", "localPart" FROM "EmailAddress";
DROP TABLE "EmailAddress";
ALTER TABLE "new_EmailAddress" RENAME TO "EmailAddress";
CREATE UNIQUE INDEX "EmailAddress_address_key" ON "EmailAddress"("address");
CREATE INDEX "EmailAddress_address_idx" ON "EmailAddress"("address");
CREATE INDEX "EmailAddress_domain_idx" ON "EmailAddress"("domain");
CREATE INDEX "EmailAddress_createdAt_idx" ON "EmailAddress"("createdAt");
CREATE INDEX "EmailAddress_sessionId_idx" ON "EmailAddress"("sessionId");
CREATE INDEX "EmailAddress_fingerprint_idx" ON "EmailAddress"("fingerprint");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_sessionId_key" ON "UserSession"("sessionId");

-- CreateIndex
CREATE INDEX "UserSession_sessionId_idx" ON "UserSession"("sessionId");

-- CreateIndex
CREATE INDEX "UserSession_fingerprint_idx" ON "UserSession"("fingerprint");

-- CreateIndex
CREATE INDEX "UserSession_createdAt_idx" ON "UserSession"("createdAt");

-- CreateIndex
CREATE INDEX "ApiUsage_sessionId_idx" ON "ApiUsage"("sessionId");
