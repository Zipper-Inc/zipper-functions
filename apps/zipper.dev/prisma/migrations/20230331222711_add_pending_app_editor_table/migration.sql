-- CreateTable
CREATE TABLE "pending_app_editors" (
    "appId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isOwner" BOOLEAN NOT NULL,
    "inviterUserId" TEXT NOT NULL,

    CONSTRAINT "pending_app_editors_pkey" PRIMARY KEY ("email","appId")
);

-- AddForeignKey
ALTER TABLE "pending_app_editors" ADD CONSTRAINT "pending_app_editors_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
