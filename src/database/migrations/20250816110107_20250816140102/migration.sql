/*
  Warnings:

  - The values [MS_DOCUMENT,PDF_DOCUMENT,JSON_DOCUMENT,DOCUMENT,ARCHIVE,CODE] on the enum `FileEntityType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Bucket` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."FileEntityType_new" AS ENUM ('IMAGE', 'VIDEO', 'FILE', 'AUDIO');
ALTER TABLE "public"."File" ALTER COLUMN "entityType" DROP DEFAULT;
ALTER TABLE "public"."File" ALTER COLUMN "entityType" TYPE "public"."FileEntityType_new" USING ("entityType"::text::"public"."FileEntityType_new");
ALTER TYPE "public"."FileEntityType" RENAME TO "FileEntityType_old";
ALTER TYPE "public"."FileEntityType_new" RENAME TO "FileEntityType";
DROP TYPE "public"."FileEntityType_old";
ALTER TABLE "public"."File" ALTER COLUMN "entityType" SET DEFAULT 'FILE';
COMMIT;

-- CreateIndex
CREATE UNIQUE INDEX "Bucket_name_key" ON "public"."Bucket"("name");
