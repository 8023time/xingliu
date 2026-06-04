CREATE UNIQUE INDEX "draft_snapshots_content_id_server_revision_key"
ON "draft_snapshots"("content_id", "server_revision");
