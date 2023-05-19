-- CreateTable
CREATE TABLE "zipper_auth_code" (
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" BIGINT NOT NULL,

    CONSTRAINT "zipper_auth_code_pkey" PRIMARY KEY ("code")
);
