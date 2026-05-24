-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'disabled', 'deleted');

-- CreateEnum
CREATE TYPE "UserRoleType" AS ENUM ('reader', 'creator', 'operator', 'admin');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('private', 'public', 'system');

-- CreateEnum
CREATE TYPE "CommonStatus" AS ENUM ('active', 'disabled', 'deleted');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('image', 'video', 'document', 'link', 'audio');

-- CreateEnum
CREATE TYPE "SafetyStatus" AS ENUM ('pending', 'pass', 'reject');

-- CreateEnum
CREATE TYPE "AssetSafetyDecision" AS ENUM ('pass', 'reject', 'manual_review');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('none', 'low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('article', 'image_text', 'short_post');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'reviewing', 'need_rewrite', 'rejected', 'approved', 'published', 'offline');

-- CreateEnum
CREATE TYPE "QualityLevel" AS ENUM ('S', 'A', 'B', 'C', 'D');

-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('create', 'edit', 'rewrite', 'rollback');

-- CreateEnum
CREATE TYPE "DraftSyncStatus" AS ENUM ('synced', 'pending', 'conflict');

-- CreateEnum
CREATE TYPE "DraftSavedFrom" AS ENUM ('auto', 'manual', 'offline_sync');

-- CreateEnum
CREATE TYPE "AiTaskType" AS ENUM ('generate', 'moderate', 'score', 'rewrite', 'asset_check', 'image_prompt');

-- CreateEnum
CREATE TYPE "AiTaskStatus" AS ENUM ('pending', 'running', 'success', 'failed');

-- CreateEnum
CREATE TYPE "SafetyReviewDecision" AS ENUM ('pass', 'need_rewrite', 'reject');

-- CreateEnum
CREATE TYPE "PatternType" AS ENUM ('keyword', 'regex', 'model_instruction');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('warn', 'rewrite', 'reject');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('view', 'like', 'share', 'collect', 'dislike', 'report');

-- CreateEnum
CREATE TYPE "RankingType" AS ENUM ('hot', 'quality', 'recommend', 'latest');

-- CreateEnum
CREATE TYPE "TopicSource" AS ENUM ('manual', 'api', 'crawler', 'system');

-- CreateEnum
CREATE TYPE "TopicStatus" AS ENUM ('active', 'expired', 'hidden');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('internal', 'external');

-- CreateEnum
CREATE TYPE "DistributionStatus" AS ENUM ('pending', 'success', 'failed');

-- CreateEnum
CREATE TYPE "ContentOperationType" AS ENUM ('publish', 'offline', 'rollback', 'reject', 'approve');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatar_url" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "UserRoleType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_templates" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'private',
    "current_version_id" TEXT,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "status" "CommonStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_template_versions" (
    "id" TEXT NOT NULL,
    "prompt_id" TEXT NOT NULL,
    "version_no" INTEGER NOT NULL,
    "template" TEXT NOT NULL,
    "variables_schema" JSONB NOT NULL,
    "model_config" JSONB,
    "change_summary" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompt_template_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "tags" JSONB,
    "ai_description" TEXT,
    "metadata" JSONB,
    "safety_status" "SafetyStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_safety_checks" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "decision" "AssetSafetyDecision" NOT NULL,
    "risk_level" "RiskLevel" NOT NULL,
    "categories" JSONB,
    "ai_reason" TEXT,
    "raw_ai_output" JSONB,
    "model_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_safety_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contents" (
    "id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content_type" "ContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "cover_asset_id" TEXT,
    "current_version_id" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "safety_status" "SafetyStatus" NOT NULL DEFAULT 'pending',
    "quality_level" "QualityLevel",
    "quality_score" DECIMAL(6,2),
    "safety_score" DECIMAL(6,2),
    "hot_score" DECIMAL(12,4),
    "recommend_score" DECIMAL(12,4),
    "published_at" TIMESTAMP(3),
    "offline_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_versions" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "version_no" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "body" TEXT NOT NULL,
    "body_json" JSONB,
    "asset_ids" JSONB,
    "cover_asset_id" TEXT,
    "change_type" "ChangeType" NOT NULL,
    "change_summary" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft_snapshots" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "base_version_id" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "body_json" JSONB,
    "asset_ids" JSONB,
    "client_revision" INTEGER NOT NULL DEFAULT 1,
    "server_revision" INTEGER NOT NULL DEFAULT 1,
    "sync_status" "DraftSyncStatus" NOT NULL DEFAULT 'synced',
    "saved_from" "DraftSavedFrom" NOT NULL DEFAULT 'auto',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draft_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_tasks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "content_id" TEXT,
    "asset_id" TEXT,
    "prompt_id" TEXT,
    "prompt_version_id" TEXT,
    "task_type" "AiTaskType" NOT NULL,
    "status" "AiTaskStatus" NOT NULL DEFAULT 'pending',
    "model_provider" TEXT NOT NULL,
    "model_name" TEXT,
    "input_summary" TEXT,
    "output_summary" TEXT,
    "input_hash" TEXT,
    "token_input" INTEGER,
    "token_output" INTEGER,
    "duration_ms" INTEGER,
    "error_code" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_reviews" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "content_version_id" TEXT NOT NULL,
    "ai_task_id" TEXT,
    "decision" "SafetyReviewDecision" NOT NULL,
    "risk_level" "RiskLevel" NOT NULL,
    "risk_categories" JSONB,
    "risk_spans" JSONB,
    "rule_hits" JSONB,
    "safety_score" DECIMAL(6,2) NOT NULL,
    "ai_reason" TEXT,
    "suggestions" JSONB,
    "rule_set_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "safety_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_evaluations" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "content_version_id" TEXT NOT NULL,
    "ai_task_id" TEXT,
    "total_score" DECIMAL(6,2) NOT NULL,
    "level" "QualityLevel" NOT NULL,
    "rubric_version" TEXT NOT NULL,
    "summary" TEXT,
    "improvements" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quality_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_evaluation_dimensions" (
    "id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "dimension_key" TEXT NOT NULL,
    "dimension_name" TEXT NOT NULL,
    "score" DECIMAL(6,2) NOT NULL,
    "weight" DECIMAL(6,4),
    "reason" TEXT,

    CONSTRAINT "quality_evaluation_dimensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rewrite_records" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "user_id" TEXT,
    "source_version_id" TEXT NOT NULL,
    "rewritten_version_id" TEXT,
    "ai_task_id" TEXT,
    "source_title" TEXT NOT NULL,
    "source_body" TEXT NOT NULL,
    "rewritten_title" TEXT NOT NULL,
    "rewritten_body" TEXT NOT NULL,
    "changed_spans" JSONB,
    "reason" TEXT,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rewrite_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_rule_sets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_rule_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_rules" (
    "id" TEXT NOT NULL,
    "rule_set_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "pattern_type" "PatternType" NOT NULL,
    "pattern" TEXT NOT NULL,
    "risk_level" "RiskLevel" NOT NULL,
    "action" "AuditAction" NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_rubrics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quality_rubrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_rubric_dimensions" (
    "id" TEXT NOT NULL,
    "rubric_id" TEXT NOT NULL,
    "dimension_key" TEXT NOT NULL,
    "dimension_name" TEXT NOT NULL,
    "description" TEXT,
    "weight" DECIMAL(6,4) NOT NULL,
    "max_score" DECIMAL(6,2) NOT NULL DEFAULT 100,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "quality_rubric_dimensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_metrics" (
    "content_id" TEXT NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "share_count" INTEGER NOT NULL DEFAULT 0,
    "collect_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "report_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_metrics_pkey" PRIMARY KEY ("content_id")
);

-- CreateTable
CREATE TABLE "content_interactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "content_id" TEXT NOT NULL,
    "action_type" "InteractionType" NOT NULL,
    "value" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_scores" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "ranking_type" "RankingType" NOT NULL,
    "score" DECIMAL(12,4) NOT NULL,
    "quality_score" DECIMAL(6,2),
    "hot_score" DECIMAL(12,4),
    "freshness_score" DECIMAL(12,4),
    "interaction_score" DECIMAL(12,4),
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hot_topics" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" "TopicSource" NOT NULL,
    "category" TEXT,
    "heat_score" DECIMAL(12,4) NOT NULL,
    "keywords" JSONB,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "status" "TopicStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hot_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_topic_relations" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "relation_score" DECIMAL(6,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_topic_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribution_channels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel_type" "ChannelType" NOT NULL,
    "config" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distribution_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribution_tasks" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "status" "DistributionStatus" NOT NULL DEFAULT 'pending',
    "external_content_id" TEXT,
    "error_message" TEXT,
    "distributed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distribution_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_operations" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "operator_id" TEXT,
    "operation_type" "ContentOperationType" NOT NULL,
    "from_status" "ContentStatus",
    "to_status" "ContentStatus",
    "target_version_id" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_operations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "user_roles_role_idx" ON "user_roles"("role");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_key" ON "user_roles"("user_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_templates_current_version_id_key" ON "prompt_templates"("current_version_id");

-- CreateIndex
CREATE INDEX "prompt_templates_owner_id_updated_at_idx" ON "prompt_templates"("owner_id", "updated_at");

-- CreateIndex
CREATE INDEX "prompt_templates_category_visibility_idx" ON "prompt_templates"("category", "visibility");

-- CreateIndex
CREATE INDEX "prompt_templates_status_idx" ON "prompt_templates"("status");

-- CreateIndex
CREATE INDEX "prompt_template_versions_created_at_idx" ON "prompt_template_versions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_template_versions_prompt_id_version_no_key" ON "prompt_template_versions"("prompt_id", "version_no");

-- CreateIndex
CREATE INDEX "assets_user_id_created_at_idx" ON "assets"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "assets_type_idx" ON "assets"("type");

-- CreateIndex
CREATE INDEX "assets_safety_status_idx" ON "assets"("safety_status");

-- CreateIndex
CREATE INDEX "asset_safety_checks_asset_id_created_at_idx" ON "asset_safety_checks"("asset_id", "created_at");

-- CreateIndex
CREATE INDEX "asset_safety_checks_decision_created_at_idx" ON "asset_safety_checks"("decision", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "contents_current_version_id_key" ON "contents"("current_version_id");

-- CreateIndex
CREATE INDEX "contents_author_id_updated_at_idx" ON "contents"("author_id", "updated_at");

-- CreateIndex
CREATE INDEX "contents_status_published_at_idx" ON "contents"("status", "published_at");

-- CreateIndex
CREATE INDEX "contents_status_hot_score_idx" ON "contents"("status", "hot_score");

-- CreateIndex
CREATE INDEX "contents_status_recommend_score_idx" ON "contents"("status", "recommend_score");

-- CreateIndex
CREATE INDEX "contents_quality_score_idx" ON "contents"("quality_score");

-- CreateIndex
CREATE INDEX "contents_published_at_idx" ON "contents"("published_at");

-- CreateIndex
CREATE INDEX "content_versions_content_id_created_at_idx" ON "content_versions"("content_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "content_versions_content_id_version_no_key" ON "content_versions"("content_id", "version_no");

-- CreateIndex
CREATE INDEX "draft_snapshots_content_id_created_at_idx" ON "draft_snapshots"("content_id", "created_at");

-- CreateIndex
CREATE INDEX "draft_snapshots_user_id_created_at_idx" ON "draft_snapshots"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "draft_snapshots_sync_status_idx" ON "draft_snapshots"("sync_status");

-- CreateIndex
CREATE INDEX "ai_tasks_task_type_status_idx" ON "ai_tasks"("task_type", "status");

-- CreateIndex
CREATE INDEX "ai_tasks_content_id_created_at_idx" ON "ai_tasks"("content_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_tasks_user_id_created_at_idx" ON "ai_tasks"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "safety_reviews_content_id_created_at_idx" ON "safety_reviews"("content_id", "created_at");

-- CreateIndex
CREATE INDEX "safety_reviews_content_version_id_idx" ON "safety_reviews"("content_version_id");

-- CreateIndex
CREATE INDEX "safety_reviews_decision_created_at_idx" ON "safety_reviews"("decision", "created_at");

-- CreateIndex
CREATE INDEX "safety_reviews_risk_level_created_at_idx" ON "safety_reviews"("risk_level", "created_at");

-- CreateIndex
CREATE INDEX "quality_evaluations_content_id_created_at_idx" ON "quality_evaluations"("content_id", "created_at");

-- CreateIndex
CREATE INDEX "quality_evaluations_total_score_idx" ON "quality_evaluations"("total_score");

-- CreateIndex
CREATE INDEX "quality_evaluations_level_idx" ON "quality_evaluations"("level");

-- CreateIndex
CREATE INDEX "quality_evaluation_dimensions_evaluation_id_idx" ON "quality_evaluation_dimensions"("evaluation_id");

-- CreateIndex
CREATE INDEX "quality_evaluation_dimensions_dimension_key_idx" ON "quality_evaluation_dimensions"("dimension_key");

-- CreateIndex
CREATE INDEX "rewrite_records_content_id_created_at_idx" ON "rewrite_records"("content_id", "created_at");

-- CreateIndex
CREATE INDEX "rewrite_records_accepted_idx" ON "rewrite_records"("accepted");

-- CreateIndex
CREATE INDEX "audit_rule_sets_enabled_idx" ON "audit_rule_sets"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "audit_rule_sets_name_version_key" ON "audit_rule_sets"("name", "version");

-- CreateIndex
CREATE INDEX "audit_rules_rule_set_id_idx" ON "audit_rules"("rule_set_id");

-- CreateIndex
CREATE INDEX "audit_rules_category_enabled_idx" ON "audit_rules"("category", "enabled");

-- CreateIndex
CREATE INDEX "audit_rules_risk_level_action_idx" ON "audit_rules"("risk_level", "action");

-- CreateIndex
CREATE INDEX "quality_rubrics_enabled_idx" ON "quality_rubrics"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "quality_rubrics_name_version_key" ON "quality_rubrics"("name", "version");

-- CreateIndex
CREATE INDEX "quality_rubric_dimensions_rubric_id_idx" ON "quality_rubric_dimensions"("rubric_id");

-- CreateIndex
CREATE UNIQUE INDEX "quality_rubric_dimensions_rubric_id_dimension_key_key" ON "quality_rubric_dimensions"("rubric_id", "dimension_key");

-- CreateIndex
CREATE INDEX "content_metrics_updated_at_idx" ON "content_metrics"("updated_at");

-- CreateIndex
CREATE INDEX "content_interactions_content_id_action_type_idx" ON "content_interactions"("content_id", "action_type");

-- CreateIndex
CREATE INDEX "content_interactions_user_id_created_at_idx" ON "content_interactions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "content_interactions_action_type_created_at_idx" ON "content_interactions"("action_type", "created_at");

-- CreateIndex
CREATE INDEX "ranking_scores_ranking_type_score_idx" ON "ranking_scores"("ranking_type", "score");

-- CreateIndex
CREATE INDEX "ranking_scores_content_id_calculated_at_idx" ON "ranking_scores"("content_id", "calculated_at");

-- CreateIndex
CREATE INDEX "ranking_scores_calculated_at_idx" ON "ranking_scores"("calculated_at");

-- CreateIndex
CREATE INDEX "hot_topics_status_heat_score_idx" ON "hot_topics"("status", "heat_score");

-- CreateIndex
CREATE INDEX "hot_topics_category_idx" ON "hot_topics"("category");

-- CreateIndex
CREATE INDEX "hot_topics_created_at_idx" ON "hot_topics"("created_at");

-- CreateIndex
CREATE INDEX "content_topic_relations_topic_id_relation_score_idx" ON "content_topic_relations"("topic_id", "relation_score");

-- CreateIndex
CREATE UNIQUE INDEX "content_topic_relations_content_id_topic_id_key" ON "content_topic_relations"("content_id", "topic_id");

-- CreateIndex
CREATE INDEX "distribution_channels_enabled_idx" ON "distribution_channels"("enabled");

-- CreateIndex
CREATE INDEX "distribution_tasks_content_id_idx" ON "distribution_tasks"("content_id");

-- CreateIndex
CREATE INDEX "distribution_tasks_channel_id_status_idx" ON "distribution_tasks"("channel_id", "status");

-- CreateIndex
CREATE INDEX "distribution_tasks_status_created_at_idx" ON "distribution_tasks"("status", "created_at");

-- CreateIndex
CREATE INDEX "content_operations_content_id_created_at_idx" ON "content_operations"("content_id", "created_at");

-- CreateIndex
CREATE INDEX "content_operations_operator_id_created_at_idx" ON "content_operations"("operator_id", "created_at");

-- CreateIndex
CREATE INDEX "content_operations_operation_type_created_at_idx" ON "content_operations"("operation_type", "created_at");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_templates" ADD CONSTRAINT "prompt_templates_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_templates" ADD CONSTRAINT "prompt_templates_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "prompt_template_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_template_versions" ADD CONSTRAINT "prompt_template_versions_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "prompt_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_template_versions" ADD CONSTRAINT "prompt_template_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_safety_checks" ADD CONSTRAINT "asset_safety_checks_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_cover_asset_id_fkey" FOREIGN KEY ("cover_asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "content_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_cover_asset_id_fkey" FOREIGN KEY ("cover_asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_snapshots" ADD CONSTRAINT "draft_snapshots_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_snapshots" ADD CONSTRAINT "draft_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_snapshots" ADD CONSTRAINT "draft_snapshots_base_version_id_fkey" FOREIGN KEY ("base_version_id") REFERENCES "content_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_tasks" ADD CONSTRAINT "ai_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_tasks" ADD CONSTRAINT "ai_tasks_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_tasks" ADD CONSTRAINT "ai_tasks_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_tasks" ADD CONSTRAINT "ai_tasks_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "prompt_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_tasks" ADD CONSTRAINT "ai_tasks_prompt_version_id_fkey" FOREIGN KEY ("prompt_version_id") REFERENCES "prompt_template_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_reviews" ADD CONSTRAINT "safety_reviews_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_reviews" ADD CONSTRAINT "safety_reviews_content_version_id_fkey" FOREIGN KEY ("content_version_id") REFERENCES "content_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_reviews" ADD CONSTRAINT "safety_reviews_ai_task_id_fkey" FOREIGN KEY ("ai_task_id") REFERENCES "ai_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_evaluations" ADD CONSTRAINT "quality_evaluations_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_evaluations" ADD CONSTRAINT "quality_evaluations_content_version_id_fkey" FOREIGN KEY ("content_version_id") REFERENCES "content_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_evaluations" ADD CONSTRAINT "quality_evaluations_ai_task_id_fkey" FOREIGN KEY ("ai_task_id") REFERENCES "ai_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_evaluation_dimensions" ADD CONSTRAINT "quality_evaluation_dimensions_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "quality_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewrite_records" ADD CONSTRAINT "rewrite_records_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewrite_records" ADD CONSTRAINT "rewrite_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewrite_records" ADD CONSTRAINT "rewrite_records_source_version_id_fkey" FOREIGN KEY ("source_version_id") REFERENCES "content_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewrite_records" ADD CONSTRAINT "rewrite_records_rewritten_version_id_fkey" FOREIGN KEY ("rewritten_version_id") REFERENCES "content_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewrite_records" ADD CONSTRAINT "rewrite_records_ai_task_id_fkey" FOREIGN KEY ("ai_task_id") REFERENCES "ai_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_rule_sets" ADD CONSTRAINT "audit_rule_sets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_rules" ADD CONSTRAINT "audit_rules_rule_set_id_fkey" FOREIGN KEY ("rule_set_id") REFERENCES "audit_rule_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_rubric_dimensions" ADD CONSTRAINT "quality_rubric_dimensions_rubric_id_fkey" FOREIGN KEY ("rubric_id") REFERENCES "quality_rubrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_metrics" ADD CONSTRAINT "content_metrics_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_interactions" ADD CONSTRAINT "content_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_interactions" ADD CONSTRAINT "content_interactions_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_scores" ADD CONSTRAINT "ranking_scores_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_topic_relations" ADD CONSTRAINT "content_topic_relations_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_topic_relations" ADD CONSTRAINT "content_topic_relations_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "hot_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_tasks" ADD CONSTRAINT "distribution_tasks_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_tasks" ADD CONSTRAINT "distribution_tasks_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "distribution_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_operations" ADD CONSTRAINT "content_operations_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_operations" ADD CONSTRAINT "content_operations_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_operations" ADD CONSTRAINT "content_operations_target_version_id_fkey" FOREIGN KEY ("target_version_id") REFERENCES "content_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
