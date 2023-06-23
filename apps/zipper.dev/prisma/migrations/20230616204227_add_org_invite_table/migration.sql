-- CreateTable
CREATE TABLE "organization_invitations" (
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "redirectUrl" TEXT,
    "token" TEXT NOT NULL,

    CONSTRAINT "organization_invitations_pkey" PRIMARY KEY ("organizationId","email")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_invitations_token_key" ON "organization_invitations"("token");

-- AddForeignKey
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
