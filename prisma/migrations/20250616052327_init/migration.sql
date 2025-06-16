-- CreateTable
CREATE TABLE "Email" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT,
    "to" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "subject" TEXT,
    "textBody" TEXT,
    "htmlBody" TEXT,
    "attachments" TEXT,
    "headers" TEXT,
    "size" INTEGER NOT NULL DEFAULT 0,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmailAddress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "localPart" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailCount" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "BlacklistedDomain" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domain" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ApiUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ip" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "userAgent" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Email_messageId_key" ON "Email"("messageId");

-- CreateIndex
CREATE INDEX "Email_to_idx" ON "Email"("to");

-- CreateIndex
CREATE INDEX "Email_createdAt_idx" ON "Email"("createdAt");

-- CreateIndex
CREATE INDEX "Email_messageId_idx" ON "Email"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailAddress_address_key" ON "EmailAddress"("address");

-- CreateIndex
CREATE INDEX "EmailAddress_address_idx" ON "EmailAddress"("address");

-- CreateIndex
CREATE INDEX "EmailAddress_domain_idx" ON "EmailAddress"("domain");

-- CreateIndex
CREATE INDEX "EmailAddress_createdAt_idx" ON "EmailAddress"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BlacklistedDomain_domain_key" ON "BlacklistedDomain"("domain");

-- CreateIndex
CREATE INDEX "BlacklistedDomain_domain_idx" ON "BlacklistedDomain"("domain");

-- CreateIndex
CREATE INDEX "ApiUsage_ip_idx" ON "ApiUsage"("ip");

-- CreateIndex
CREATE INDEX "ApiUsage_timestamp_idx" ON "ApiUsage"("timestamp");
