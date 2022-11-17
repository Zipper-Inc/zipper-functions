-- CreateTable
CREATE TABLE "app_editors" (
    "userId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "isOwner" BOOLEAN NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "app_editors_userId_appId_key" ON "app_editors"("userId", "appId");

-- AddForeignKey
ALTER TABLE "app_editors" ADD CONSTRAINT "app_editors_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
