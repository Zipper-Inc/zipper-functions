-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
