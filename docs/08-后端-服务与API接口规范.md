# 后端：服务与 API 接口规范

## 通用规范

统一成功响应：

```json
{
  "success": true,
  "data": {},
  "error": null,
  "requestId": "req_xxx"
}
```

统一错误响应：

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "DRAFT_CONFLICT",
    "message": "草稿存在云端冲突",
    "details": {}
  },
  "requestId": "req_xxx"
}
```

通用约定：

- B 端生产侧写接口需要 JWT 鉴权；C 端阅读互动接口可支持 JWT 或匿名设备标识去重。
- B 端创作者后台调用注册登录、Prompt、素材、草稿、AI 创作、审核、评分、改写、发布和分发中心接口。
- C 端内容前台调用内容详情、首页信息流、热点榜、爆文榜、推荐榜和阅读互动接口。
- 所有列表接口使用 `limit + cursor` 分页。
- 所有响应返回 `requestId`，便于前端报错和后端日志排查。
- 请求体必须经过 DTO 校验。
- AI 生成、审核、评分、改写在 MVP 阶段优先同步返回；耗时增加时再切换为任务模式。

## 错误码

```text
UNAUTHORIZED              未登录或 token 无效
FORBIDDEN                 无权限访问资源
VALIDATION_ERROR          请求参数不合法
RESOURCE_NOT_FOUND        资源不存在
DRAFT_CONFLICT            草稿版本冲突
CONTENT_NOT_APPROVED      内容未审核通过，不能发布
CONTENT_REJECTED          内容已被驳回
AI_PROVIDER_TIMEOUT       AI 服务超时
AI_OUTPUT_INVALID         AI 输出结构不合法
RATE_LIMITED              请求过于频繁
UPLOAD_INVALID_TYPE       上传文件类型不合法
UPLOAD_TOO_LARGE          上传文件过大
```

## 鉴权接口

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

登录响应建议返回：

```json
{
  "accessToken": "jwt",
  "user": {
    "id": "user_xxx",
    "email": "demo@example.com",
    "username": "Demo Creator",
    "role": "creator"
  }
}
```

## Prompt 接口

```text
GET    /api/prompts
POST   /api/prompts
PUT    /api/prompts/:id
DELETE /api/prompts/:id
POST   /api/prompts/:id/use
```

Prompt 创建请求：

```json
{
  "name": "小红书种草文案",
  "category": "content_generation",
  "template": "请面向 {{audience}} 创作一篇 {{style}} 风格内容，主题是 {{topic}}。",
  "variables": ["audience", "style", "topic"]
}
```

## 素材接口

```text
POST   /api/assets/upload
GET    /api/assets?cursor=&limit=20&type=image
POST   /api/assets/:id/describe
DELETE /api/assets/:id
```

素材上传约束：

- 限制 MIME、扩展名和文件大小。
- 图片写入对象存储。
- 素材元数据写入 PostgreSQL。
- 进阶挑战可调用 AI 生成素材描述。

## 草稿接口

```text
POST   /api/drafts
GET    /api/drafts?cursor=&limit=20&status=
GET    /api/drafts/:id
PUT    /api/drafts/:id
PUT    /api/drafts/:id/autosave
POST   /api/drafts/sync
DELETE /api/drafts/:id
```

自动保存请求：

```json
{
  "title": "草稿标题",
  "content": "正文",
  "contentJson": {},
  "assets": [],
  "baseVersion": 3
}
```

自动保存响应：

```json
{
  "id": "draft_xxx",
  "version": 4,
  "updatedAt": "2026-05-22T10:00:00Z"
}
```

## AI 创作接口

```text
POST /api/ai/generate-title
POST /api/ai/generate-content
POST /api/ai/continue-writing
POST /api/ai/optimize-title
POST /api/ai/image-prompt
```

内容生成请求：

```json
{
  "topic": "AI 如何帮助内容创作者提升效率",
  "audience": "短视频和图文创作者",
  "platform": "toutiao",
  "style": "专业但易懂",
  "keywords": ["AI 创作", "内容审核", "分发"],
  "promptId": "prompt_xxx",
  "materialIds": ["asset_xxx"]
}
```

内容生成响应：

```json
{
  "titles": ["标题 1", "标题 2"],
  "summary": "摘要",
  "outline": ["开头", "正文", "结尾"],
  "content": "正文内容",
  "tags": ["AI", "创作"],
  "imageSuggestions": [
    {
      "position": "开头",
      "description": "展示创作者工作台的图片",
      "prompt": "A clean creator dashboard..."
    }
  ]
}
```

## 内容与审核接口

```text
POST /api/contents/from-draft
GET  /api/contents/:id
PUT  /api/contents/:id
POST /api/contents/:id/submit-review
POST /api/contents/:id/publish
POST /api/moderation/check
GET  /api/moderation/records/:contentId
POST /api/quality/score
GET  /api/quality/:contentId
POST /api/rewrite/compliance
```

提交审核请求：

```json
{
  "contentId": "content_xxx",
  "mode": "full_review"
}
```

发布约束：

- 必须登录。
- 当前用户必须是内容作者。
- 内容状态必须是 `approved`。
- 最新审核记录 `decision` 必须是 `pass`。
- 发布成功后初始化或更新 `content_metrics`。

## 榜单与阅读互动接口

```text
GET  /api/feed?cursor=&limit=20
GET  /api/rankings/hot?cursor=&limit=20
GET  /api/rankings/viral?cursor=&limit=20
GET  /api/rankings/recommend?cursor=&limit=20
POST /api/contents/:id/view
POST /api/contents/:id/like
POST /api/contents/:id/share
```

收藏、举报、不感兴趣属于进阶挑战，用于后续用户反馈加权排序；当前 API 不作为必做主链路。

榜单响应：

```json
{
  "items": [],
  "nextCursor": "score_or_id_cursor",
  "hasMore": true,
  "rankingType": "hot",
  "generatedAt": "2026-05-22T10:00:00Z"
}
```

## 任务模式预留

当 AI 任务耗时较长时，接口可以从同步响应切换为任务模式：

```text
POST /api/tasks
GET  /api/tasks/:id
```

任务响应：

```json
{
  "taskId": "task_xxx",
  "status": "pending"
}
```

任务查询：

```json
{
  "taskId": "task_xxx",
  "status": "success",
  "result": {}
}
```
