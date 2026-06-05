# AGENTS.md

## 项目定位

`apps/admin` 是星流创作者中心（B 端），负责创作者的内容生产和发布工作流：

- AI 辅助创作：通过 Prompt 模板和 AI 生成候选内容，确认后写入编辑器。
- 编辑器：基于 Tiptap 的富文本编辑器，支持长文、短图文和短内容三种类型。
- 内容管理：草稿恢复、版本管理、安全审核反馈、质量评分和合规改写。
- Prompt 管理：创建和管理 AI 生成提示词模板。
- 素材管理：上传、管理和查看素材的基础合规状态。
- 发布工作流：提交审核 → 查看审核结果和评分 → 发布到 C 端或改写后重审。

当前项目处于早期核心开发阶段，优先把创作主链路做清楚，不为暂未落地的能力提前搭框架。

## 规则入口

- 本文件负责 `apps/admin/` 的项目边界和工程约定。
- 写实现代码前先参考 `docs/rules/FE-ADMIN-RULES.md`。
- 涉及项目级架构、后端边界、数据模型等，参考仓库根目录的 `AGENTS.md`。
- 如果项目约定和通用工程习惯冲突，优先遵守本项目已有约定。

## 技术栈与目录

- 构建工具：Vite 8 + TypeScript。
- UI 框架：React 19 + React Router 7 + Ant Design 6 + Tailwind CSS 4。
- 富文本编辑器：Tiptap 3（含 image、link、placeholder、text-align、character-count 等扩展）。
- 状态管理：React Query（服务端状态）、Zustand（客户端交互状态）、Dexie（IndexedDB 本地草稿）。
- 图表：`@visactor/react-vchart`。
- API 客户端：Axios + Orval 代码生成。
- 仓库：`@xingliu/config`（共享配置）、`@xingliu/shared`（共享类型）。

### apps/admin 目录结构

- `src/pages/` — 页面组件（login、home、content、prompts、assets、rankings）。
- `src/components/` — 共享组件（editor/Tiptap 编辑器、layout 布局、createModal 创建弹窗、ui 通用组件）。
- `src/api/` — API 层（ai、asset、content、prompt、ranking、user），通过 Orval 自动生成。
- `src/router/` — React Router 配置，含懒加载和鉴权守卫。
- `src/stores/` — Zustand stores（user-store、sider-store）。
- `src/configs/` — 请求配置、错误码映射、存储辅助。
- `src/lib/` — 本地草稿管理（Dexie IndexedDB）。

### 路由页面

| 路由                                   | 职责                                   |
| -------------------------------------- | -------------------------------------- |
| `/login`                               | 登录与注册                             |
| `/home`                                | 工作台：最近草稿、待处理内容、最近发布 |
| `/content/list`                        | 内容列表：状态筛选、线上版本和编辑版本 |
| `/content/create`、`/content/:id/edit` | AI 候选、编辑器、草稿状态、审核与发布  |
| `/prompts`                             | Prompt 模板 CRUD                       |
| `/assets`                              | 素材上传、管理和基础合规状态           |
| `/rankings`                            | 榜单（当前为脚手架/参考实现）          |

审核结果、质量评分、合规改写和版本记录嵌入编辑器或内容详情面板，不拆独立审核页。

## 架构边界

- 不直接访问 PostgreSQL、Prisma、MinIO 或模型供应商密钥。
- 服务端状态使用 React Query；客户端交互状态使用 Zustand；本地草稿和同步队列使用 Dexie。
- 页面通过 `api/` 或业务 hook 请求接口，不直接调用 axios。
- 接口路径和字段以 `docs/07-设计-接口设计.md` 为准；共享类型优先来自 `@xingliu/shared`。
- 不引入未安装依赖，不为单次使用过度封装组件、hook 或工具。
- 不手动修改 Orval 或其他自动生成代码。

## 核心交互流程

### AI 创作

1. 创作者选择 Prompt 和内容类型，发起 AI 生成请求。
2. AI 生成结果先进入候选区（非编辑器直接写入）。
3. 用户确认后，候选内容写入 Tiptap 编辑器。
4. 可在编辑器中继续手动调整。

### 草稿同步

1. 用户停止输入约 2 秒后保存到 IndexedDB（本地草稿）。
2. 每 30 秒或关键操作后保存云端草稿快照（`draft_snapshots`）。
3. 恢复网络后同步待处理快照。
4. 冲突时展示本地和云端内容，由用户决策，不自动合并。

### 发布工作流

1. 提交审核时创建不可变 `content_versions`，设置 `currentVersionId`。
2. 后端执行安全审核（fastscan → 阿里云 → 决策）和质量评分。
3. 审核未通过或评分缺失时，发布按钮禁用并说明原因。
4. 合规改写先展示前后对比，采纳后创建新版本并重新审核。
5. 审核通过后可发布，设置 `publishedVersionId`。

### 版本展示

内容列表和编辑器同时显示：

- 线上状态：未发布、已发布或已下线。
- 编辑版本状态：草稿、审核中、需改写、已拒绝或已通过。
- 二次编辑时明确旧版本仍在线。

## 领域概念

`apps/admin` 中涉及的领域概念：

- `PromptTemplate`：AI 生成提示词模板，创作者可 CRUD。
- `Asset`：上传素材（图片），存储于 MinIO，展示基础合规状态。
- `Content`：内容条目，管理 `currentVersionId` 和 `publishedVersionId`。
- `ContentVersion`：不可变版本，审核和评分的对象。
- `DraftSnapshot`：云端草稿快照。
- `AiTask`：AI 生成任务记录。
- `SafetyReview`：安全审核结果。
- `QualityEvaluation`：AI 质量评分。
- `RewriteRecord`：合规改写对比记录。

新增概念前先判断它是否表达新的稳定业务事实。

## UI 与代码约定

- 优先复用 Ant Design 组件，不包装无业务含义的基础组件。
- 页面与组件完整处理加载、空、错误、禁用、离线和冲突状态。
- 状态不得只靠颜色表达；按钮和图标提供可访问名称。
- 不保存或输出明文密码、令牌、密钥和审核原始响应。
- 不使用 `any` 逃避类型。

## 开发取舍

- 核心阶段只实现工作台、AI 创作、Prompt、素材和内容管理。
- 审核结果、质量评分、合规改写和版本记录集成在编辑器或内容详情中，不拆独立页面。
- 不新增推荐榜、复杂分发中心、复杂数据看板、运营后台或需求之外的创作类型。
- 内容类型仅为长文、短图文和短内容。
- 用户认证、Prompt、素材、内容壳、云端草稿、AI 候选生成、通用预检、正式版本、安全审核与质量评分模块已基本完成；其他模块不得用 mock 数据伪装已完成。

## 常见修改检查

新增内容创作能力时：

- 明确是否影响内容类型枚举（长文/短图文/短内容）。
- 检查 Tiptap 扩展是否需要新增或调整。
- 确认 AI 生成候选区交互逻辑一致。

新增内容管理能力时：

- 明确涉及 `currentVersionId` 还是 `publishedVersionId`。
- 检查版本状态变化和对应 UI 状态展示。

新增 Prompt 或素材能力时：

- 表单使用 Ant Design Form，校验规则完整。
- 素材上传遵守 `docs/07-设计-接口设计.md` 中的契约。

## 验证命令

```bash
# 开发
pnpm --filter @xingliu/admin dev

# 构建检查
pnpm --filter @xingliu/admin build
```

如果某个检查当前无法执行，要在最终说明中写明原因。
