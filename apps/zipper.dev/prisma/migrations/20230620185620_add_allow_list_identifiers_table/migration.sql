-- CreateTable
CREATE TABLE "allow_list_identifiers" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" TEXT NOT NULL,
    "defaultOrganizationId" TEXT,
    "inviterName" TEXT,

    CONSTRAINT "allow_list_identifiers_pkey" PRIMARY KEY ("id")
);
