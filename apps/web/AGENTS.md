# AGENTS.md

## 项目定位

星流（Xingliu）是一个 AI 创作者辅助生产与分发平台。`apps/web` 是面向公众的 C 端网站，负责已发布内容的展示和消费：

- 内容探索流：展示创作者发布的公开内容。
- 热点榜：展示当前热门内容排行。
- 爆文榜：展示高互动爆文内容。
- 内容详情：展示单篇已发布内容的完整信息。

当前项目处于早期核心开发阶段，优先把已发布内容流和榜单主链路做清楚，不为暂未落地的能力提前搭框架。

## 规则入口

- 本文件负责 `apps/web/` 的项目边界和工程约定。
- 写实现代码前先参考 `docs/rules/FE-WEB-RULES.md`。
- 涉及项目级架构、后端边界、数据模型等，参考仓库根目录的 `AGENTS.md`。
- 如果项目约定和通用工程习惯冲突，优先遵守本项目已有约定。

## 技术栈与目录

- 仓库使用 pnpm workspace + Turborepo。
- `apps/web/` 是 Next.js 16 App Router 应用，负责页面渲染、交互状态和调用后端 API。
- `apps/creator/` 是创作者中心（React 19 + Vite 8 + React Router 7 + Ant Design 6），负责 AI 创作、Prompt、素材和内容管理。
- `server/` 是 NestJS 11 后端，负责业务流程、AI 调用、数据库写入和文件存储。
- `packages/config/` 存放 `@xingliu/config` 共享配置（host/port 等）。
- `packages/shared/` 存放 `@xingliu/shared` 共享 TypeScript 类型定义。
- `server/prisma/` 存放 Prisma schema 与迁移相关文件。Prisma 只属于后端，前端不能直接依赖数据库模型。

### apps/web 目录结构

- `src/app/` — Next.js App Router 页面（layout.tsx、page.tsx 及路由分组）。
- `src/app/(main)/explore/` — 内容探索流页面。
- `src/app/(main)/rankings/` — 热点榜和爆文榜页面。
- `src/app/(main)/content/[id]/` — 内容详情页面。
- `src/app/(main)/user/` — 用户相关页面。
- `src/components/content/` — 内容相关业务组件（content-card、explore-feed）。
- `src/components/layout/` — 布局组件（app-layout、auth-dialog）。
- `src/components/ranking/` — 榜单业务组件（ranking-board）。
- `src/components/ui/` — 通用 UI 组件（button、dialog、skeleton、avatar 等）。
- `src/lib/` — 工具函数和数据获取逻辑。
- `src/stores/` — Zustand 客户端状态（如 auth-dialog-store）。
- `src/style/` — 全局样式（Tailwind CSS）。

## 架构边界

- 前端不直接访问 PostgreSQL、Prisma、MinIO 或模型供应商密钥。
- NestJS API（`/api/*`）是前端访问业务能力的唯一边界；页面层不得复制后端业务规则。
- 使用 Next.js Server Component 做数据获取，Client Component 只用于需要浏览器交互的部分。
- 公开查询和榜单只读取 `publishedVersion`，不直连草稿或审核中的版本。
- 共享类型优先来自 `@xingliu/shared`，不手写重复的类型定义。
- 不使用硬编码 mock 数据冒充真实接口。

## 领域概念

`apps/web` 中涉及的核心概念：

- `Content`：已发布的内容条目（长文、短图文、短内容），通过 `publishedVersion` 对外展示。
- `Ranking` / `HotTopic`：热点榜与爆文榜，后端计算后通过游标分页返回。
- `ContentMetric`：内容指标数据（阅读、点赞、分享等），由后端聚合后返回前端展示。

新增概念前先判断它是否表达新的稳定业务事实。不要把一次性的接口入参、页面展示结构或临时处理状态升级成长期领域模型。

## 数据与配置约定

- 接口路径和字段以 `docs/07-设计-接口设计.md` 为准。
- 榜单使用游标分页和无限滚动。
- 配置差异放在环境变量，不要写进源码。
- `.env.local` 不提交到 Git。
- Next.js 配置位于 `next.config.ts`，通过 `@xingliu/config` 获取共享配置。
- 图片明确尺寸或比例，使用 Next.js Image 组件并通过 `images.remotePatterns` 声明外部图片源。

## 开发取舍

- 核心阶段只实现已发布内容流、热点榜、爆文榜和公开内容详情。
- 不新增推荐榜、搜索、用户中心、点赞、收藏、评论、私信、会员或个性化推荐。
- 用户反馈仅作为独立加分项，不得影响核心页面和接口设计。
- 默认使用 Server Component；仅在需要浏览器交互时使用 Client Component。
- 页面负责数据获取和组合，复杂卡片与榜单拆到业务组件。
- 不过度拆分简单页面，不把所有状态放入 Zustand。
- 少量重复可以接受；只有稳定复用、隔离外部复杂度或保护业务边界时才增加抽象。
- 修改范围聚焦当前需求，避免顺手改动无关模块、生成文件或目录布局。

## UI 与性能

- 首屏优先展示内容，不使用大面积营销内容。
- 完整处理骨架屏、加载更多、失败重试、空状态和无更多数据。
- 图片明确尺寸或比例，避免 CLS 布局抖动。
- 非首屏和重型交互按需加载。
- 交互按钮提供可访问名称，状态不能只靠颜色表达。
- 复用现有 Radix UI 组件和 Tailwind CSS 样式体系。

## 常见修改检查

新增榜单或内容展示页面时：

- 明确数据来自后端哪个接口，确认接口字段和响应格式。
- 区分游标分页请求、加载更多、空状态和错误状态。
- 榜单使用 `react-virtuoso` 做虚拟列表无限滚动。

新增内容详情页时：

- 明确展示的是 `publishedVersion` 数据，区分元数据和正文内容。
- 处理内容不存在、非公开等边界状态。

新增交互功能时：

- 明确哪些交互是纯客户端行为，哪些需要后端状态变更。
- 认证状态检查通过 API 而非本地 mock。

## 验证命令

```bash
# 开发
pnpm --filter @xingliu/web dev

# 构建检查
pnpm --filter @xingliu/web build
```

如果某个检查当前无法执行，要在最终说明中写明原因。
