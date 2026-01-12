-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_renewalDate_idx" ON "Subscription"("renewalDate");

-- CreateIndex
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");

-- CreateIndex
CREATE INDEX "User_membershipTier_idx" ON "User"("membershipTier");

-- CreateIndex
CREATE INDEX "User_stripeCustomerId_idx" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "api_tokens_userId_expiresAt_idx" ON "api_tokens"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "api_tokens_lastUsedAt_idx" ON "api_tokens"("lastUsedAt");
