-- CreateTable
CREATE TABLE "organization_slugs" (
    "slug" TEXT NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "organization_slugs_pkey" PRIMARY KEY ("slug")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_slugs_slug_key" ON "organization_slugs"("slug");
