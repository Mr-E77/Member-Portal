-- CreateTable studio_themes
CREATE TABLE "studio_themes" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#3B82F6',
    "secondaryColor" TEXT NOT NULL DEFAULT '#8B5CF6',
    "accentColor" TEXT NOT NULL DEFAULT '#EC4899',
    "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "textColor" TEXT NOT NULL DEFAULT '#1F2937',
    "borderColor" TEXT NOT NULL DEFAULT '#E5E7EB',
    "variables" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable studio_assets
CREATE TABLE "studio_assets" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable studio_contacts
CREATE TABLE "studio_contacts" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable studio_messages
CREATE TABLE "studio_messages" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "fromContactId" TEXT NOT NULL,
    "toContactId" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "attachments" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable studio_features
CREATE TABLE "studio_features" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "dueDate" TIMESTAMP(3),
    "componentCode" TEXT,
    "generatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "studio_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable studio_timeline
CREATE TABLE "studio_timeline" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "featureId" TEXT,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "changes" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studio_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable studio_components
CREATE TABLE "studio_components" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "generatedFrom" TEXT,
    "generatedBy" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "dependencies" JSONB,
    "props" JSONB,
    "examples" JSONB,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable studio_ai_chats
CREATE TABLE "studio_ai_chats" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "title" TEXT,
    "messages" JSONB NOT NULL,
    "context" JSONB,
    "generatedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_ai_chats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "studio_themes_configId_idx" ON "studio_themes"("configId");

-- CreateIndex
CREATE INDEX "studio_assets_configId_idx" ON "studio_assets"("configId");

-- CreateIndex
CREATE INDEX "studio_assets_type_idx" ON "studio_assets"("type");

-- CreateIndex
CREATE INDEX "studio_contacts_configId_idx" ON "studio_contacts"("configId");

-- CreateIndex
CREATE INDEX "studio_contacts_email_idx" ON "studio_contacts"("email");

-- CreateIndex
CREATE INDEX "studio_messages_configId_idx" ON "studio_messages"("configId");

-- CreateIndex
CREATE INDEX "studio_messages_fromContactId_idx" ON "studio_messages"("fromContactId");

-- CreateIndex
CREATE INDEX "studio_messages_toContactId_idx" ON "studio_messages"("toContactId");

-- CreateIndex
CREATE INDEX "studio_messages_read_idx" ON "studio_messages"("read");

-- CreateIndex
CREATE INDEX "studio_features_configId_idx" ON "studio_features"("configId");

-- CreateIndex
CREATE INDEX "studio_features_status_idx" ON "studio_features"("status");

-- CreateIndex
CREATE INDEX "studio_features_priority_idx" ON "studio_features"("priority");

-- CreateIndex
CREATE INDEX "studio_timeline_configId_idx" ON "studio_timeline"("configId");

-- CreateIndex
CREATE INDEX "studio_timeline_featureId_idx" ON "studio_timeline"("featureId");

-- CreateIndex
CREATE INDEX "studio_timeline_action_idx" ON "studio_timeline"("action");

-- CreateIndex
CREATE INDEX "studio_timeline_createdAt_idx" ON "studio_timeline"("createdAt");

-- CreateIndex
CREATE INDEX "studio_components_configId_idx" ON "studio_components"("configId");

-- CreateIndex
CREATE INDEX "studio_components_category_idx" ON "studio_components"("category");

-- CreateIndex
CREATE INDEX "studio_components_featured_idx" ON "studio_components"("featured");

-- CreateIndex
CREATE INDEX "studio_ai_chats_configId_idx" ON "studio_ai_chats"("configId");

-- CreateIndex
CREATE INDEX "studio_ai_chats_createdAt_idx" ON "studio_ai_chats"("createdAt");

-- AddForeignKey
ALTER TABLE "studio_messages" ADD CONSTRAINT "studio_messages_fromContactId_fkey" FOREIGN KEY ("fromContactId") REFERENCES "studio_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_messages" ADD CONSTRAINT "studio_messages_toContactId_fkey" FOREIGN KEY ("toContactId") REFERENCES "studio_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_timeline" ADD CONSTRAINT "studio_timeline_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "studio_features"("id") ON DELETE SET NULL ON UPDATE CASCADE;
