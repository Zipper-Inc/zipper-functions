-- CreateTable
CREATE TABLE "apps" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "datastore" JSONB,

    CONSTRAINT "apps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secrets" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "encryptedValue" TEXT NOT NULL,
    "appId" TEXT NOT NULL,

    CONSTRAINT "secrets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scripts" (
    "hash" TEXT NOT NULL,
    "parentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "order" INTEGER DEFAULT 0,
    "appId" TEXT NOT NULL,
    "inputSchema" JSONB,
    "outputSchema" JSONB,

    CONSTRAINT "scripts_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "resoure_instances" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resoure_instances_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "secrets" ADD CONSTRAINT "secrets_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scripts" ADD CONSTRAINT "scripts_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
