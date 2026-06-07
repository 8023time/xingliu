-- Create enums for unified file objects.
CREATE TYPE "FileCategory" AS ENUM ('image', 'video', 'audio', 'document', 'unknown');
CREATE TYPE "FileObjectPurpose" AS ENUM ('temp', 'asset', 'avatar', 'content');

-- Create table for uploaded file objects.
CREATE TABLE "file_objects" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "purpose" "FileObjectPurpose" NOT NULL DEFAULT 'temp',
  "category" "FileCategory" NOT NULL,
  "original_name" TEXT NOT NULL,
  "storage_key" TEXT NOT NULL,
  "public_storage_key" TEXT,
  "mime_type" TEXT NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "checksum" TEXT,
  "metadata" JSONB,
  "status" "CommonStatus" NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "file_objects_pkey" PRIMARY KEY ("id")
);

-- Link assets to file objects without changing existing asset rows.
ALTER TABLE "assets" ADD COLUMN "file_object_id" TEXT;

-- Indexes.
CREATE UNIQUE INDEX "file_objects_storage_key_key" ON "file_objects"("storage_key");
CREATE INDEX "file_objects_user_id_created_at_idx" ON "file_objects"("user_id", "created_at");
CREATE INDEX "file_objects_purpose_category_idx" ON "file_objects"("purpose", "category");
CREATE INDEX "file_objects_status_idx" ON "file_objects"("status");
CREATE INDEX "assets_file_object_id_idx" ON "assets"("file_object_id");

-- Foreign keys.
ALTER TABLE "file_objects"
  ADD CONSTRAINT "file_objects_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "assets"
  ADD CONSTRAINT "assets_file_object_id_fkey"
  FOREIGN KEY ("file_object_id") REFERENCES "file_objects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
