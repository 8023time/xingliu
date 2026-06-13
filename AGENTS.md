# AGENTS.md

## 项目定位

星流（Xingliu）是一个 AI 创作者辅助生产与分发平台，围绕这条基础闭环开发：

- 创作者通过 AI 辅助生成内容，经过安全审核和质量评分后发布到平台。
- 读者通过 C 端网站浏览已发布内容、热点榜和爆文榜。
- 平台提供 Prompt 管理、素材管理、云端草稿同步、合规改写等创作辅助能力。

当前项目处于早期核心开发阶段，优先把创作-审核-发布-消费这条主链路做清楚，不为暂未落地的能力提前搭框架。

## 规则入口

- 本文件负责项目级边界和工程约定。
- 各子项目有独立的 `AGENTS.md`：`apps/web/AGENTS.md`、`apps/admin/AGENTS.md`、`server/AGENTS.md`，写子项目代码前先阅读对应文件。
- 后端实现参考规则 `docs/rules/BD-SERVER-RULES.md`。
- Admin 前端实现参考规则 `docs/rules/FE-ADMIN-RULES.md`。
- Web 前端实现参考规则 `docs/rules/FE-WEB-RULES.md`。
- 事实来源以 `docs/00-索引-文档导航.md` 指定的优先级为准：需求文档 > 接口设计 > 数据库设计 > 架构文档。
- 如果项目约定和通用工程习惯冲突，优先遵守本项目已有约定。

## 技术栈与目录

- 仓库使用 pnpm workspace + Turborepo 管理。
- `apps/web/` — Next.js 16 App Router（C 端内容前台），负责已发布内容流、榜单和内容详情。
- `apps/admin/` — React 19 + Vite 8 + React Router 7 + Ant Design 6 + Tiptap（B 端创作者中心），负责 AI 创作、Prompt、素材和内容管理。
- `server/` — NestJS 11 模块化单体 API，负责业务流程、AI 调用、审核、数据库写入和文件存储。
- `server/prisma/` — Prisma schema 与迁移文件。Prisma 只属于后端，前端不能直接依赖数据库模型。
- `server/libs/common/` — 后端内部共享模块（Prisma、MinIO、AI Service、Auth Guard、Moderation Service、响应格式化）。
- `packages/config/` — `@xingliu/config` 共享环境配置（host/port）。
- `packages/shared/` — `@xingliu/shared` 共享 TypeScript 类型定义。
- `docs/` — 需求文档、流程、架构、接口设计、数据库设计、UI 设计和 AI 编码规则。
- `docs/dev/` — 日常开发记录，记录已完成模块和验证证据。

## 架构边界

- 前端不直接访问 PostgreSQL、Prisma、MinIO 或模型供应商密钥。
- NestJS API（`/api/*`）是前端访问业务能力的唯一边界；页面层不得复制后端业务规则。
- PostgreSQL 是业务数据和文件元数据的持久化落点；MinIO 保存上传素材。
- AI 调用统一使用 `@langchain/openai` 的 `ChatOpenAI`，通过火山方舟提供的 OpenAI 兼容接口接入模型。`OPENAI_*` 环境变量实际保存火山方舟配置，不得误接 OpenAI 官方服务。
- 内容安全统一通过 `mint-filter` 本地词典 + 阿里云内容安全增强版链路审查。
- 不使用 Redis、BullMQ、微服务或额外数据库。

## 领域概念

核心领域概念及其归属：

| 概念                | 说明                                                    | 归属                 |
| ------------------- | ------------------------------------------------------- | -------------------- |
| `User`              | 创作者/用户，双令牌认证                                 | server               |
| `PromptTemplate`    | AI 生成提示词模板                                       | server + admin       |
| `Asset`             | 上传素材（图片等），存储于 MinIO                        | server + admin       |
| `Content`           | 内容条目，有 `currentVersionId` 和 `publishedVersionId` | server + admin + web |
| `ContentVersion`    | 不可变内容版本，审核和评分的对象                        | server + admin       |
| `DraftSnapshot`     | 云端草稿快照，30 秒自动保存                             | server + admin       |
| `AiTask`            | AI 生成任务记录                                         | server + admin       |
| `SafetyReview`      | 安全审核结果（mint-filter → 阿里云 → 决策）             | server + admin       |
| `QualityEvaluation` | AI 质量评分结果                                         | server + admin       |
| `RewriteRecord`     | 合规改写前后对比记录                                    | server + admin       |
| `ContentMetric`     | 内容指标（阅读、点赞、分享等）                          | server + web         |
| `HotTopic`          | 热点话题与爆文榜                                        | server + web         |

新增概念前先判断它是否表达新的稳定业务事实。不要把一次性的接口入参、页面展示结构或临时处理状态升级成长期领域模型。

## 数据与配置约定

- 数据库结构以 `server/prisma/schema.prisma` 和迁移为实现落点。
- API 密钥、数据库连接串和部署差异放在环境变量，不要写进源码。
- `.env.example` 提供本地配置示例值，真实 `.env` 不提交。
- 共享配置通过 `@xingliu/config` 包统一管理。
- 版本控制：`currentVersionId` 表示编辑版本，`publishedVersionId` 表示线上版本；二次编辑不覆盖旧线上版本。

## 开发取舍

- 先完成创作-审核-评分-发布-消费这条主链路。
- 核心阶段不建设推荐榜、复杂分发中心、搜索、用户中心、评论、收藏、私信或个性化推荐。
- 用户反馈、外部热点导入、外部平台分发仅作为独立加分项，不得增加核心流程复杂度。
- 少量重复可以接受；只有稳定复用、隔离外部复杂度或保护业务边界时才增加抽象。
- 避免在内部契约清楚的地方叠加宽松 fallback 和隐式兼容逻辑。输入语义不清时先修正契约。
- 修改范围聚焦当前需求，避免顺手改动无关模块、生成文件或目录布局。

## 常见修改检查

新增业务模块时：

- 明确模块属于 server、admin 还是 web 的职责范围。
- 检查是否需要新增 Prisma 模型；如需新增，同步更新 schema、迁移和接口设计文档。
- 检查是否需要新增 API 端点；如需新增，同步更新接口设计文档。

新增 AI 能力时：

- 统一通过内部 AI Service 调用，不直接创建模型客户端。
- `OPENAI_*` 环境变量实际指向火山方舟接口，不要擅自改为 OpenAI 官方配置。

新增审核能力时：

- 统一通过内部 Moderation Service 调用，审核顺序固定为 `mint-filter → 阿里云 → 决策`。
- 高风险结果直接拒绝；模型输出不得覆盖阿里云高风险判断。

## 验证命令

按改动范围选择验证命令。

```bash
# Admin 前端
pnpm --filter @xingliu/admin build

# Web 前端
pnpm --filter @xingliu/web build

# 后端
pnpm --filter @xingliu/server exec prisma validate
pnpm --filter @xingliu/server build

# 全部构建
pnpm build
```

如果某个检查当前无法执行，要在最终说明中写明原因。
