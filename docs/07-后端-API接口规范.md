# 后端：API 接口规范

## 一、通用规范

### 响应统一规范

| 响应类型 | code               | success | 说明                                     |
| -------- | ------------------ | ------- | ---------------------------------------- |
| 业务成功 | 0                  | true    | data 为成功数据，如无数据返回 null       |
| 业务失败 | 1                  | true    | data 为详细错误描述，可不返回或返回 null |
| 系统错误 | 401/403/404/500... | false   | 未授权/禁止访问/未找到/服务器错误等      |

**完整响应示例：**

业务成功：

```json
{
  "timestamp": "2026-05-22T10:00:00Z",
  "path": "/api/contents",
  "message": "请求成功",
  "code": 0,
  "data": {}, // 详细数据
  "success": true
}
```

业务失败：

```json
{
  "timestamp": "2026-05-22T10:00:00Z",
  "path": "/api/contents",
  "message": "错误描述",
  "code": 1,
  "data": {}, // 详细业务错误信息
  "success": true
}
```

系统错误：

```json
{
  "timestamp": "2026-05-22T10:00:00Z",
  "path": "/api/contents",
  "message": "错误描述",
  "code": 401,
  "success": false
}
```

通用约定：

- B 端部分生产侧写接口需要 JWT 鉴权；C 端阅读互动接口需要 JWT;
- 所有的用户都有 C 端与 B 端角色与权限，通过接口鉴权区分；后续可增加管理员角色。
- B 端创作者后台调用注册登录、Prompt、素材、草稿、AI 创作、审核、评分、改写、发布和分发中心接口。
- C 端内容前台调用内容详情、首页信息流、热点榜、爆文榜、推荐榜和阅读互动接口。
- 所有的接口都必须经过 DTO 校验，而且需要在 Swagger 中有完整的接口定义和示例。
- AI 生成、审核、评分、改写在 MVP 阶段优先同步返回；耗时增加时再切换为任务模式。

## 二、接口设计

### 1. 用户模块接口

| 方法 | 路径               | 说明     |
| ---- | ------------------ | -------- |
| POST | /api/user/register | 用户注册 |
| POST | /api/user/login    | 用户登录 |
| POST | /api/user/logout   | 用户登出 |

登录响应建议返回：

```json
{
  "token": {
    "accessToken": "jwt_token_string",
    "refreshToken": "jwt_refresh_token_string"
  },
  "user": {
    "id": "user_xxx",
    "email": "demo@example.com",
    "phone": "13800138000",
    "username": "Demo Creator",
    "avatarUrl": "https://example.com/avatar.jpg",
    "status": "active"
  }
}
```

### 2. Prompt 接口

| 方法   | 路径                 | 说明             |
| ------ | -------------------- | ---------------- |
| GET    | /api/prompts         | 获取 Prompt 列表 |
| POST   | /api/prompts         | 新建 Prompt      |
| PUT    | /api/prompts/:id     | 更新 Prompt      |
| DELETE | /api/prompts/:id     | 删除 Prompt      |
| POST   | /api/prompts/:id/use | 使用 Prompt      |

Prompt 创建请求：

```json
{
  "name": "小红书种草文案",
  "category": "content_generation",
  "template": "请面向 {{audience}} 创作一篇 {{style}} 风格内容，主题是 {{topic}}。",
  "variables": ["audience", "style", "topic"]
}
```

### 3. 素材接口

| 方法   | 路径                                    | 说明         |
| ------ | --------------------------------------- | ------------ |
| POST   | /api/assets/upload                      | 上传素材     |
| GET    | /api/assets?cursor=&limit=20&type=image | 获取素材列表 |
| POST   | /api/assets/:id/describe                | 生成素材描述 |
| DELETE | /api/assets/:id                         | 删除素材     |

素材上传约束：

- 限制 MIME、扩展名和文件大小。
- 图片写入对象存储。
- 素材元数据写入 PostgreSQL。
- 进阶挑战可调用 AI 生成素材描述。

### 4. 草稿接口

| 方法   | 路径                                 | 说明         |
| ------ | ------------------------------------ | ------------ |
| POST   | /api/drafts                          | 新建草稿     |
| GET    | /api/drafts?cursor=&limit=20&status= | 获取草稿列表 |
| GET    | /api/drafts/:id                      | 获取草稿详情 |
| PUT    | /api/drafts/:id                      | 更新草稿     |
| PUT    | /api/drafts/:id/autosave             | 自动保存草稿 |
| POST   | /api/drafts/sync                     | 同步草稿     |
| DELETE | /api/drafts/:id                      | 删除草稿     |

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

### 5. AI 创作接口

| 方法 | 路径                     | 说明            |
| ---- | ------------------------ | --------------- |
| POST | /api/ai/generate-title   | 生成标题        |
| POST | /api/ai/generate-content | 生成内容        |
| POST | /api/ai/continue-writing | 续写内容        |
| POST | /api/ai/optimize-title   | 优化标题        |
| POST | /api/ai/image-prompt     | 生成图片 Prompt |

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

### 6. 内容与审核接口

| 方法 | 路径                               | 说明           |
| ---- | ---------------------------------- | -------------- |
| POST | /api/contents/from-draft           | 从草稿生成内容 |
| GET  | /api/contents/:id                  | 获取内容详情   |
| PUT  | /api/contents/:id                  | 更新内容       |
| POST | /api/contents/:id/submit-review    | 提交审核       |
| POST | /api/contents/:id/publish          | 发布内容       |
| POST | /api/moderation/check              | 内容审核       |
| GET  | /api/moderation/records/:contentId | 获取审核记录   |
| POST | /api/quality/score                 | 内容评分       |
| GET  | /api/quality/:contentId            | 获取评分结果   |
| POST | /api/rewrite/compliance            | 合规改写       |

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

### 7. 榜单与阅读互动接口

| 方法 | 路径                                     | 说明       |
| ---- | ---------------------------------------- | ---------- |
| GET  | /api/feed?cursor=&limit=20               | 获取信息流 |
| GET  | /api/rankings/hot?cursor=&limit=20       | 获取热点榜 |
| GET  | /api/rankings/viral?cursor=&limit=20     | 获取爆文榜 |
| GET  | /api/rankings/recommend?cursor=&limit=20 | 获取推荐榜 |
| POST | /api/contents/:id/view                   | 记录阅读   |
| POST | /api/contents/:id/like                   | 点赞内容   |
| POST | /api/contents/:id/share                  | 分享内容   |

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

### 8. 任务模式预留

当 AI 任务耗时较长时，接口可以从同步响应切换为任务模式：

| 方法 | 路径           | 说明         |
| ---- | -------------- | ------------ |
| POST | /api/tasks     | 创建任务     |
| GET  | /api/tasks/:id | 查询任务状态 |

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
