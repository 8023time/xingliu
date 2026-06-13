# AGENTS.md

## 项目定位

`server` 是星流平台的 NestJS 11 模块化单体后端 API，负责全部业务流程：

- 用户认证与双令牌管理。
- Prompt 模板 CRUD。
- 素材上传、存储和基础合规检查。
- 内容版本管理、草稿快照、审核编排、质量评分和合规改写。
- AI 内容生成（通过 LangChain ChatOpenAI + 火山方舟兼容接口）。
- 内容安全审核（mint-filter 本地词典 + 阿里云内容安全增强版）。
- 内容发布、内容流、热点榜和爆文榜查询。

当前项目处于早期核心开发阶段，用户认证、Prompt、素材、内容壳、云端草稿、AI 候选生成、通用预检、正式版本、安全审核、质量评分、发布下线与公开消费链路已完成；其他模块仍为待实现或脚手架状态。

## 规则入口

- 本文件负责 `server/` 的项目边界和工程约定。
- 写实现代码前先参考 `docs/rules/BD-SERVER-RULES.md`。
- 涉及项目级架构、前端边界等，参考仓库根目录的 `AGENTS.md`。
- 如果项目约定和通用工程习惯冲突，优先遵守本项目已有约定。

## 技术栈与目录

- 框架：NestJS 11 + TypeScript。
- ORM：Prisma 7 + `@prisma/adapter-pg`。
- 数据库：PostgreSQL。
- 文件存储：MinIO。
- AI：`@langchain/core` + `@langchain/openai`（ChatOpenAI，通过火山方舟 OpenAI 兼容接口）。
- 内容安全：`mint-filter` + `@alicloud/green20220302`（阿里云内容安全增强版）。
- 验证：`class-validator` + `class-transformer` + Zod。
- 认证：`@nestjs/jwt`。
- API 文档：`@nestjs/swagger` + `@scalar/nestjs-api-reference`。
- 仓库：`@xingliu/config`（共享配置）、`@xingliu/shared`（共享类型）。

### server 目录结构

- `src/` — 业务模块入口（app.module.ts、main.ts）和各业务模块。
- `src/user/` — 用户注册、登录、双令牌管理。
- `src/auth/` — JWT 认证。
- `src/prompt/` — Prompt 模板 CRUD。
- `src/asset/` — 素材上传、MinIO 存储、基础合规检查。
- `src/content/` — 内容壳管理、版本管理、发布与下线。
- `src/draft/` — 云端草稿快照、同步和冲突处理。
- `src/ai-generation/` — AI 内容生成（ChatOpenAI 调用）。
- `src/moderation/` — 安全审核编排（mint-filter → 阿里云 → 决策）。
- `src/quality/` — AI 质量评分。
- `src/rewrite/` — 合规改写（生成候选 + 采纳后创建新版本）。
- `src/ranking/` — 内容流、热点榜和爆文榜查询。
- `libs/common/src/` — 内部共享模块：
  - `prisma/` — Prisma 数据库服务。
  - `generated/prisma/` — 自动生成的 Prisma 客户端。
  - `file/` — MinIO 文件存储、文件处理和上传类型。
  - `ai/` — LangChain ChatOpenAI 封装服务。
  - `auth/` — JWT 鉴权守卫。
  - `moderation/` — 内容安全服务（mint-filter + 阿里云）。
  - `filter/` — 全局 HTTP 异常过滤器。
  - `interceptor/` — 全局 HTTP 响应拦截器。
  - `response/` — 标准化响应格式。
- `prisma/` — Prisma schema、迁移文件和 `prisma.config.ts`。

## 架构边界

- NestJS API 是前端访问业务能力的唯一边界。
- Controller 只负责路由、鉴权、参数校验和调用 Service。
- Service 负责业务规则、资源归属、事务和外部服务协作。
- DTO 使用 `class-validator`；模型结构化输出使用 Zod。
- AI 调用统一通过内部 AI Service（`libs/common/src/ai/`），业务模块不直接创建 ChatOpenAI 实例。
- 内容安全统一通过内部 Moderation Service（`libs/common/src/moderation/`），业务模块不直接创建 mint-filter 或阿里云客户端。
- `OPENAI_*` 环境变量实际保存火山方舟兼容接口配置，不得误接 OpenAI 官方服务。
- 不使用原生 OpenAI SDK、自行发送模型 HTTP 请求或创建额外模型适配层。
- 不引入新依赖，除非现有依赖和 Node.js 标准库无法满足明确需求。

## 模块职责

| 模块            | 状态   | 核心职责                     |
| --------------- | ------ | ---------------------------- |
| `user`、`auth`  | 已完成 | 用户注册、登录和双令牌认证   |
| `prompt`        | 已完成 | Prompt 模板 CRUD             |
| `asset`         | 已完成 | 素材上传、存储和基础合规检查 |
| `content`       | 已完成 | 内容壳、版本创建、发布和下线 |
| `draft`         | 已完成 | 云端快照保存、同步和冲突处理 |
| `ai-generation` | 已完成 | AI 候选生成                  |
| `moderation`    | 已完成 | 通用预检与正式版本安全审核   |
| `quality`       | 已完成 | 当前正式版本质量评分与重试   |
| `rewrite`       | 脚手架 | 合规改写                     |
| `ranking`       | 脚手架 | 内容流和榜单查询             |

`topic`、`distribution` 与互动能力属于独立加分项，不进入核心模块。

## 版本与发布语义

- 创建内容时先创建内容壳，不要求立即创建正式版本。
- 草稿只写入 `draft_snapshots`，不得覆盖正式版本。
- 提交审核时创建不可变 `content_versions`，并设置 `currentVersionId`。
- `currentVersionId` 表示创作者当前编辑/审核版本。
- `publishedVersionId` 表示 C 端线上版本。
- 二次编辑时旧线上版本继续公开；新版本发布成功后才切换 `publishedVersionId`。
- 下线时清空 `publishedVersionId`。
- 公开查询、内容流和榜单只读取 `publishedVersion`。
- 审核和评分必须关联具体版本，禁止复用其他版本结果。

## 事务边界

以下操作必须使用短 Prisma 事务：

- 提交草稿并创建正式版本。
- 保存审核结果并更新版本状态。
- 保存评分并更新汇总分数。
- 采纳改写并创建新版本。
- 发布并切换 `publishedVersionId`、初始化指标。
- 下线并清空 `publishedVersionId`。

外部 AI、阿里云和 MinIO 调用不得放入数据库事务。先完成外部调用，再用短事务保存结果。

## AI 与安全审核

### 模型调用

- 生成、评分、改写统一通过内部 AI Service（`@langchain/openai` 的 `ChatOpenAI`）。
- 通过火山方舟提供的 OpenAI 兼容接口调用模型。
- 不直接使用原生 OpenAI SDK、不自行发送 HTTP 请求、不额外封装模型适配层。

### 内容安全

- 统一通过内部 Moderation Service 调用外部审核能力。
- 审核顺序固定为：`mint-filter → 阿里云内容安全增强版 → 标准化决策`。
- 高风险结果直接拒绝；模型输出不得覆盖阿里云高风险判断。
- 审核异常、评分失败或结构校验失败不得伪造通过，不得允许发布。

### 合规改写

- 改写只生成候选，不直接替换线上内容。
- 采纳后创建新内容版本，重新走审核流程。

## 请求与响应规范

- 全局 API 前缀：`/api`。
- 保留已完成的 `/api/user/*`；新增资源使用复数路径（如 `/api/contents`）。
- 写接口默认使用 JWT，并通过 Auth Guard 校验资源归属。
- 列表统一使用游标分页：`cursor`、`limit`、`nextCursor`、`hasMore`。
- 响应只返回前端所需字段，使用全局响应拦截器统一格式化。
- 使用全局异常过滤器处理错误，不把系统错误伪装成成功。

## 榜单计算

核心热点榜和爆文榜根据以下数据实时计算，不保存排名快照：

```text
质量分 + 阅读热度 + 发布时间
```

公开查询必须筛选存在 `publishedVersionId` 且未删除、未下线的内容。用户反馈仅作为进阶智能排序因子。

## 数据与配置约定

- 数据库结构以 `server/prisma/schema.prisma` 和迁移为实现落点。
- 修改 schema 时必须运行 `prisma format`、`prisma generate` 并新增迁移文件。
- 不手动修改生成的 Prisma Client 代码。
- 敏感配置只从环境变量读取；密钥、密码、令牌和完整敏感正文不得写入日志、响应或源码。
- 多表状态更新使用短事务；外部服务调用不得放入事务。

## 开发取舍

- 核心阶段只实现创作-审核-评分-发布-内容流和榜单查询这条主链路。
- 不新增推荐榜、权限后台、复杂运营能力、Redis、BullMQ、微服务或额外数据库。
- 不新增空实体、空模块、通用 Repository、Manager 或无真实复用价值的抽象。
- 少量重复可以接受；只有稳定复用、隔离外部复杂度或保护业务边界时才增加抽象。
- 修改范围聚焦当前需求，避免顺手改动无关模块。

## 常见修改检查

新增 API 端点时：

- Controller 只负责路由、鉴权、参数和调用 Service。
- DTO 使用 `class-validator` 声明校验规则。
- 列表接口使用游标分页参数。
- 写接口通过 Auth Guard 校验资源归属。
- 资源路径使用复数形式。

新增数据库操作时：

- 多表状态更新使用短 Prisma 事务包围。
- 外部 AI、阿里云和 MinIO 调用不得放入事务。
- 审核和评分必须关联具体版本，不能跨版本复用。

新增 AI 或审核调用时：

- 通过内部 AI/Moderation Service 调用，不直接创建外部客户端。
- 审核顺序固定：mint-filter → 阿里云 → 决策。
- 高风险结果直接拒绝。

## 验证命令

```bash
# Schema 校验
pnpm --filter @xingliu/server exec prisma validate

# 构建检查
pnpm --filter @xingliu/server build

# Schema 变更后额外执行
pnpm --filter @xingliu/server exec prisma format
pnpm --filter @xingliu/server exec prisma generate
```

如果某个检查当前无法执行，要在最终说明中写明原因。
