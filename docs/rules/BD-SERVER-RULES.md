# Server AI Code Generation Rules

## 1. 事实来源与边界

- 功能范围以 `docs/01-需求-需求文档.md` 为最高依据。
- API 与数据模型分别以 `docs/07-设计-接口设计.md`、`server/prisma/schema.prisma` 为准。
- 当前用户认证、Prompt、素材、内容壳、云端草稿、AI 候选生成与通用预检模块已完成；其他模块不得宣称已完成。具体完成范围与验证证据见 `docs/dev`。
- 核心功能与加分项必须分离，不新增推荐榜、权限后台、复杂运营能力、Redis、BullMQ、微服务或额外数据库。

## 2. 技术约束

- 使用 NestJS 11、TypeScript、Prisma 7、PostgreSQL 和 MinIO。
- 生成、评分、改写统一使用 `@langchain/openai` 的 `ChatOpenAI`，通过火山方舟模型 API 的 OpenAI 兼容接口接入。
- 内容安全固定使用 `fastscan` 与 `@alicloud/pop-core` 调用阿里云内容安全增强版。
- `OPENAI_*` 环境变量实际保存火山方舟兼容接口配置，不得误接 OpenAI 官方服务。
- 不直接使用原生 OpenAI SDK、自行发送模型 HTTP 请求或创建额外模型适配层。
- 不引入新依赖，除非现有依赖和 Node.js 标准库无法满足明确需求。

## 3. 模块与接口

- Controller 只负责路由、鉴权、参数和调用 Service。
- Service 负责业务规则、资源归属、事务和外部服务协作。
- DTO 使用 `class-validator`；模型结构化输出使用 Zod。
- 保留 `/api/user/*`；新增资源使用接口设计中的复数路径。
- 列表使用游标分页；响应只返回前端所需字段。
- 不新增空实体、空模块、通用 Repository、Manager 或无真实复用价值的抽象。

## 4. 数据与版本

- 草稿写入 `draft_snapshots`，不得覆盖正式版本。
- 提交审核时创建不可变 `content_versions`。
- `currentVersionId` 表示当前编辑版本，`publishedVersionId` 表示线上版本。
- 二次编辑不得覆盖或隐藏旧线上版本；发布成功后才切换 `publishedVersionId`。
- 公开查询和榜单只读取 `publishedVersion`。
- 审核和评分必须关联具体版本，禁止复用其他版本结果。
- 多表状态更新使用短事务，外部调用不得放入事务。
- 不手工修改生成的 Prisma Client。

## 5. AI 与安全

- 业务模块通过内部 AI/Moderation Service 调用外部能力。
- 审核顺序固定为 `fastscan → 阿里云内容安全增强版 → 标准化决策`。
- 高风险结果直接拒绝；模型输出不得覆盖阿里云高风险判断。
- 审核异常、评分失败或结构校验失败不得伪造通过，不得发布。
- 合规改写只生成候选；采纳后创建新版本并重新审核。
- 密钥、密码、令牌、完整敏感正文不得写入日志、响应或源码。

## 6. 验证

修改相关代码后至少运行：

```bash
pnpm --filter @xingliu/server exec prisma validate
pnpm --filter @xingliu/server build
```

修改 schema 时额外运行 `prisma format`、`prisma generate` 并新增迁移。
