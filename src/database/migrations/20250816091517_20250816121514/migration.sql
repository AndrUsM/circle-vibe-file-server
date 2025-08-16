-- CreateEnum
CREATE TYPE "public"."FileEntityType" AS ENUM ('IMAGE', 'VIDEO', 'FILE', 'AUDIO', 'MS_DOCUMENT', 'PDF_DOCUMENT', 'JSON_DOCUMENT', 'DOCUMENT', 'ARCHIVE', 'CODE');

-- CreateEnum
CREATE TYPE "public"."Permissions" AS ENUM ('READ', 'WRITE', 'DELETE');

-- CreateTable
CREATE TABLE "public"."File" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "optimizedUrl" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "entityType" "public"."FileEntityType" NOT NULL DEFAULT 'FILE',
    "uploadedAt" TIMESTAMP(3) NOT NULL,
    "bucketId" INTEGER NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."App" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" "public"."Permissions"[] DEFAULT ARRAY['READ', 'WRITE']::"public"."Permissions"[],
    "createdAt" TIMESTAMP(3) NOT NULL,
    "bucketId" INTEGER NOT NULL,

    CONSTRAINT "App_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Bucket" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "folder" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isUpdated" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bucket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "App_bucketId_key" ON "public"."App"("bucketId");

-- AddForeignKey
ALTER TABLE "public"."File" ADD CONSTRAINT "File_bucketId_fkey" FOREIGN KEY ("bucketId") REFERENCES "public"."Bucket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."App" ADD CONSTRAINT "App_bucketId_fkey" FOREIGN KEY ("bucketId") REFERENCES "public"."Bucket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
