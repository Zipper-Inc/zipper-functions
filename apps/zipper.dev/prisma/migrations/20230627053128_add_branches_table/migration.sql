-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'main',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

INSERT INTO "branches"
SELECT gen_random_uuid () as id, id as "appId", 'main' as "name" FROM "apps";