# Docker 部署配置

## 1. 服务

| 服务 | 端口 | 说明 |
| --- | --- | --- |
| `server` | 3000 | NestJS API |
| `web` | 8080 | Next.js C 端 |
| `admin` | 8081 | Vite B 端 |
| `postgres` | 5432 | PostgreSQL |
| `caddy` | 80、443 | 反向代理 |

项目不部署 Redis、BullMQ 或额外数据库。MinIO 当前不在 Compose 中定义，使用外部 MinIO 服务时通过环境变量接入。

## 2. 必要环境变量

从 `.env.example` 创建本地或生产环境配置。生产环境不得使用示例密钥。

```env
DB_USER=
DB_PASSWORD=
DB_NAME=
JWT_SECRET=
JWT_EXPIRATION=

OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=

NEXT_PUBLIC_API_URL=
ADMIN_API_URL=
```

Compose 启动 `server` 时必须传入火山方舟 OpenAI 兼容接口使用的 `OPENAI_*` 环境变量，否则 AI 与审核能力不可用。

## 3. 启动与迁移

```bash
docker compose up -d --build
docker compose exec server pnpm exec prisma migrate deploy
```

生产环境：

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec server pnpm exec prisma migrate deploy
```

执行包含结构删除的迁移前必须备份数据库。

## 4. 访问地址

- Web：`http://localhost:8080`
- Admin：`http://localhost:8081`
- API：`http://localhost:3000/api`
- Swagger：`http://localhost:3000/api-docs`
- Scalar：`http://localhost:3000/docs`

## 5. 验证

```bash
docker compose ps
docker compose logs server
docker compose exec server pnpm exec prisma validate
```

部署验证至少覆盖数据库连接、用户认证、API 文档、阿里云审核凭证和模型服务配置。密钥不得写入镜像、日志或代码仓库。
