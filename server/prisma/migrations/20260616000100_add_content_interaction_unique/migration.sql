CREATE UNIQUE INDEX "content_interactions_user_content_like_key"
ON "content_interactions"("user_id", "content_id")
WHERE "action_type" = 'like' AND "user_id" IS NOT NULL;
