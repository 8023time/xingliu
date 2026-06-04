/*
  Simplify the schema to the 14 tables required by the product design.
  This migration intentionally removes unused configuration and snapshot tables.
*/

-- Merge the current prompt version into prompt_templates before removing version history.
ALTER TABLE "prompt_templates"
ADD COLUMN "template" TEXT,
ADD COLUMN "variables_schema" JSONB,
ADD COLUMN "model_config" JSONB;

UPDATE "prompt_templates" AS prompt
SET
  "template" = version."template",
  "variables_schema" = version."variables_schema",
  "model_config" = version."model_config"
FROM "prompt_template_versions" AS version
WHERE prompt."current_version_id" = version."id";

UPDATE "prompt_templates" SET "template" = '' WHERE "template" IS NULL;
ALTER TABLE "prompt_templates" ALTER COLUMN "template" SET NOT NULL;

-- Keep the latest asset moderation result directly on assets.
ALTER TABLE "assets"
ADD COLUMN "safety_risk_level" "RiskLevel",
ADD COLUMN "safety_labels" JSONB,
ADD COLUMN "safety_reason" TEXT,
ADD COLUMN "safety_raw_output" JSONB,
ADD COLUMN "safety_checked_at" TIMESTAMP(3);

UPDATE "assets" AS asset
SET
  "safety_risk_level" = latest."risk_level",
  "safety_labels" = latest."categories",
  "safety_reason" = latest."ai_reason",
  "safety_raw_output" = latest."raw_ai_output",
  "safety_checked_at" = latest."created_at"
FROM (
  SELECT DISTINCT ON ("asset_id")
    "asset_id", "risk_level", "categories", "ai_reason", "raw_ai_output", "created_at"
  FROM "asset_safety_checks"
  ORDER BY "asset_id", "created_at" DESC
) AS latest
WHERE asset."id" = latest."asset_id";

-- Store quality dimensions as one structured result.
ALTER TABLE "quality_evaluations"
ADD COLUMN "standard_version" TEXT,
ADD COLUMN "dimensions" JSONB;

UPDATE "quality_evaluations"
SET "standard_version" = "rubric_version";

UPDATE "quality_evaluations" AS evaluation
SET "dimensions" = dimensions."items"
FROM (
  SELECT
    "evaluation_id",
    jsonb_agg(
      jsonb_build_object(
        'key', "dimension_key",
        'name', "dimension_name",
        'score', "score",
        'weight', "weight",
        'reason', "reason"
      )
    ) AS "items"
  FROM "quality_evaluation_dimensions"
  GROUP BY "evaluation_id"
) AS dimensions
WHERE evaluation."id" = dimensions."evaluation_id";

UPDATE "quality_evaluations" SET "dimensions" = '[]'::jsonb WHERE "dimensions" IS NULL;
ALTER TABLE "quality_evaluations"
ALTER COLUMN "standard_version" SET NOT NULL,
ALTER COLUMN "dimensions" SET NOT NULL;

-- Preserve external distribution details without a separate channel table.
ALTER TABLE "distribution_tasks"
ADD COLUMN "platform" TEXT,
ADD COLUMN "request_payload" JSONB,
ADD COLUMN "response_payload" JSONB;

UPDATE "distribution_tasks" AS task
SET
  "platform" = channel."name",
  "request_payload" = channel."config"
FROM "distribution_channels" AS channel
WHERE task."channel_id" = channel."id";

UPDATE "distribution_tasks" SET "platform" = 'unknown' WHERE "platform" IS NULL;
ALTER TABLE "distribution_tasks" ALTER COLUMN "platform" SET NOT NULL;

-- Add fields needed when importing external hot topics.
ALTER TABLE "hot_topics"
ADD COLUMN "external_id" TEXT,
ADD COLUMN "source_name" TEXT,
ADD COLUMN "url" TEXT,
ADD COLUMN "metadata" JSONB;

CREATE UNIQUE INDEX "hot_topics_source_name_external_id_key"
ON "hot_topics"("source_name", "external_id");

-- Persist normalized and provider-specific moderation output.
ALTER TABLE "safety_reviews"
RENAME COLUMN "ai_reason" TO "reason";

ALTER TABLE "safety_reviews"
ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'aliyun_green',
ADD COLUMN "provider_request_id" TEXT,
ADD COLUMN "raw_provider_output" JSONB;

-- Remove obsolete foreign keys before dropping columns and tables.
ALTER TABLE "prompt_templates" DROP CONSTRAINT IF EXISTS "prompt_templates_current_version_id_fkey";
ALTER TABLE "ai_tasks" DROP CONSTRAINT IF EXISTS "ai_tasks_prompt_version_id_fkey";
ALTER TABLE "distribution_tasks" DROP CONSTRAINT IF EXISTS "distribution_tasks_channel_id_fkey";

DROP TABLE "user_roles";
DROP TABLE "prompt_template_versions";
DROP TABLE "asset_safety_checks";
DROP TABLE "quality_evaluation_dimensions";
DROP TABLE "audit_rules";
DROP TABLE "audit_rule_sets";
DROP TABLE "quality_rubric_dimensions";
DROP TABLE "quality_rubrics";
DROP TABLE "ranking_scores";
DROP TABLE "content_topic_relations";
DROP TABLE "distribution_channels";
DROP TABLE "content_operations";

ALTER TABLE "prompt_templates" DROP COLUMN "current_version_id";
ALTER TABLE "ai_tasks" DROP COLUMN "prompt_version_id";
ALTER TABLE "contents" DROP COLUMN "hot_score", DROP COLUMN "recommend_score";
ALTER TABLE "quality_evaluations" DROP COLUMN "rubric_version";
ALTER TABLE "rewrite_records" DROP COLUMN "source_title", DROP COLUMN "source_body";
ALTER TABLE "content_metrics" DROP COLUMN "comment_count";
ALTER TABLE "safety_reviews" DROP COLUMN "rule_set_version";
ALTER TABLE "distribution_tasks" DROP COLUMN "channel_id";

DROP INDEX IF EXISTS "contents_status_hot_score_idx";
DROP INDEX IF EXISTS "contents_status_recommend_score_idx";
DROP INDEX IF EXISTS "contents_published_at_idx";
DROP INDEX IF EXISTS "draft_snapshots_sync_status_idx";
DROP INDEX IF EXISTS "quality_evaluations_level_idx";
DROP INDEX IF EXISTS "rewrite_records_accepted_idx";
DROP INDEX IF EXISTS "content_metrics_updated_at_idx";
DROP INDEX IF EXISTS "content_interactions_action_type_created_at_idx";
DROP INDEX IF EXISTS "hot_topics_category_idx";
DROP INDEX IF EXISTS "hot_topics_created_at_idx";
DROP INDEX IF EXISTS "distribution_tasks_content_id_idx";
DROP INDEX IF EXISTS "distribution_tasks_channel_id_status_idx";
DROP INDEX IF EXISTS "distribution_tasks_status_created_at_idx";
DROP INDEX IF EXISTS "safety_reviews_risk_level_created_at_idx";

CREATE INDEX "distribution_tasks_content_id_created_at_idx"
ON "distribution_tasks"("content_id", "created_at");

CREATE INDEX "distribution_tasks_platform_status_idx"
ON "distribution_tasks"("platform", "status");

ALTER TYPE "TopicSource" RENAME TO "TopicSource_old";
CREATE TYPE "TopicSource" AS ENUM ('manual', 'api');
ALTER TABLE "hot_topics"
ALTER COLUMN "source" TYPE "TopicSource"
USING (
  CASE
    WHEN "source"::text = 'manual' THEN 'manual'
    ELSE 'api'
  END
)::"TopicSource";
DROP TYPE "TopicSource_old";

DROP TYPE "UserRoleType";
DROP TYPE "AssetSafetyDecision";
DROP TYPE "PatternType";
DROP TYPE "AuditAction";
DROP TYPE "RankingType";
DROP TYPE "ChannelType";
DROP TYPE "ContentOperationType";
