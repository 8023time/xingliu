# FE Web AI Code Generation Rules

## 1. 产品边界

- `apps/web` 只实现已发布内容流、热点榜、爆文榜和公开内容详情。
- 核心阶段不新增推荐榜、搜索、用户中心、点赞、收藏、评论、私信、会员或个性化推荐。
- 用户反馈仅作为独立加分项，不得影响核心页面和接口设计。

## 2. 技术与数据

- 使用现有 Next.js 16 App Router、React 19、TypeScript、Tailwind CSS、Radix UI、React Query、Zustand 和 `react-virtuoso`。
- 默认使用 Server Component；仅在需要浏览器交互时使用 Client Component。
- 接口路径和字段以 `docs/07-设计-接口设计.md` 为准。
- 内容流、公开详情和榜单只展示后端返回的 `publishedVersion`。
- 榜单使用游标分页和无限滚动；页面不得依赖 Prisma 内部类型。
- 不使用硬编码 mock 数据冒充真实接口，不引入 Redis、额外状态库或 UI 框架。

## 3. UI 与性能

- 首屏优先展示内容，不使用大面积营销内容。
- 完整处理骨架、加载更多、失败重试、空状态和无更多数据。
- 图片明确尺寸或比例，避免布局抖动。
- 非首屏和重型交互按需加载；LCP 目标不高于 2.5 秒。
- 状态不能只靠颜色表达，交互按钮提供可访问名称。

## 4. 代码规则

- 页面负责数据获取和组合，复杂卡片与榜单拆到业务组件。
- 不过度拆分简单页面，不把所有状态放入 Zustand。
- 复用现有组件和共享类型，不使用 `any` 逃避类型设计。
- 不删除用户已有实现来追求风格统一，不创建需求之外的页面或占位模块。

## 5. 验证

代码修改后运行：

```bash
pnpm --filter @xingliu/web build
```
