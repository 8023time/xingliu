-- Keep the live public version independent from the version currently being edited or reviewed.
ALTER TABLE "contents"
ADD COLUMN "published_version_id" TEXT;

UPDATE "contents"
SET "published_version_id" = "current_version_id"
WHERE "status" = 'published' AND "current_version_id" IS NOT NULL;

CREATE UNIQUE INDEX "contents_published_version_id_key"
ON "contents"("published_version_id");

ALTER TABLE "contents"
ADD CONSTRAINT "contents_published_version_id_fkey"
FOREIGN KEY ("published_version_id")
REFERENCES "content_versions"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
