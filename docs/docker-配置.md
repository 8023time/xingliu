# Docker 部署配置

本文说明星流项目的 Docker 部署方式。当前部署保持单体边界：PostgreSQL、MinIO、NestJS API、Next.js Web、React Creator、Caddy 反向代理，不引入 Redis、BullMQ、微服务或额外数据库。

## 服务组成

| 服务 | 容器端口 | 说明 |
| --- | --- | --- |
| `postgres` | 5432 | PostgreSQL 业务数据库 |
| `minio` | 9000 | 素材对象存储 |
| `server` | 3000 | NestJS API，统一 `/api` 前缀 |
| `web` | 8080 | Next.js C 端内容前台 |
| `creator` | 8081 | React + Vite 创作者中心 |
| `caddy` | 80 / 443 | 对外反向代理 |

本机开发调试使用 `docker-compose.yml`，生产部署使用 `docker-compose.prod.yml`。两个 compose 都挂载 `Caddyfile.docker`，容器内反代通过 Docker 服务名访问：`server:3000`、`web:8080`、`creator:8081`。

## 环境变量

从根目录 `.env.example` 创建实际 `.env`，生产环境必须替换所有密钥和密码。

```env
DB_USER=xingliu
DB_PASSWORD=replace_with_strong_password
DB_NAME=xingliu_db

JWT_SECRET=replace_with_long_random_secret
JWT_EXPIRATION=86400

MINIO_ACCESS_KEY=replace_with_minio_access_key
MINIO_SECRET_KEY=replace_with_minio_secret_key
MINIO_BUCKET_NAME=xingliu-assets
MINIO_PUBLIC_URL=https://api.xingliu.8023time.com/xingliu-assets

OPENAI_API_KEY=your_volcengine_ark_api_key
OPENAI_BASE_URL=https://your-volcengine-ark-openai-compatible-endpoint
OPENAI_MODEL=your_volcengine_ark_endpoint_or_model_id

ALIYUN_ACCESS_KEY_ID=your_aliyun_access_key_id
ALIYUN_ACCESS_KEY_SECRET=your_aliyun_access_key_secret
ALIYUN_GREEN_ENDPOINT=green-cip.cn-shanghai.aliyuncs.com
ALIYUN_GREEN_REGION_ID=cn-shanghai
ALIYUN_GREEN_TEXT_SERVICE=ai_art_detection
ALIYUN_GREEN_IMAGE_SERVICE=baselineCheck

NEXT_PUBLIC_API_URL=http://server:3000
```

注意：

- `OPENAI_*` 保存的是火山方舟 OpenAI 兼容接口配置，不是 OpenAI 官方服务配置。
- 阿里云内容安全代码读取的是 `ALIYUN_ACCESS_KEY_ID` 和 `ALIYUN_ACCESS_KEY_SECRET`。
- `MINIO_PUBLIC_URL` 必须是阿里云内容安全服务可公网访问的地址，否则图片审核会失败；当前 Docker Caddy 已将 `https://api.xingliu.8023time.com/<bucket>/*` 转发到 MinIO。
- `NEXT_PUBLIC_API_URL` 在 Docker 内建议保持 `http://server:3000`，供 Next.js 服务端代理调用后端。

## 本机 Docker 启动

```bash
docker compose up -d --build
```

本机访问地址：

- Web: `http://localhost:8080`
- Creator: `http://localhost:8081`
- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/api-docs`
- Scalar: `http://localhost:3000/docs`
- MinIO Console: `http://localhost:9001`

后端容器启动时会先执行：

```bash
pnpm --filter=@xingliu/server exec prisma migrate deploy
```

如果只想手动执行迁移，可以进入容器运行同一命令。

## 生产部署

1. 在服务器安装 Docker 和 Docker Compose。
2. 将域名解析到服务器：`xingliu.8023time.com`、`creator.xingliu.8023time.com`、`api.xingliu.8023time.com`。
3. 准备根目录 `.env`，填入生产数据库密码、JWT 密钥、MinIO、火山方舟和阿里云内容安全配置。
4. 启动生产 compose：

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

生产 compose 默认只对外暴露 Caddy 的 `80/443`，内部服务通过 Docker 网络通信。

## 验证

```bash
docker compose ps
docker compose logs -f server
docker compose exec server pnpm --filter=@xingliu/server exec prisma validate
```

重点检查：

- `server` 日志中没有 Prisma 迁移失败。
- `http://api.xingliu.8023time.com/api-docs` 能打开。
- Creator 登录、注册接口能通过 `creator` 域名的 `/api/*` 转到后端。
- Web 内容流请求能通过 Next.js `/api/proxy/*` 正常代理。
- 上传素材后返回的 URL 与 `MINIO_PUBLIC_URL` 一致，并且公网可访问。

## 常见问题

如果 Caddy 返回 502，先检查目标容器是否健康：

```bash
docker compose ps
docker compose logs web
docker compose logs creator
docker compose logs server
```

如果图片审核失败，优先检查 `MINIO_PUBLIC_URL` 是否公网可下载，以及阿里云变量名是否为 `ALIYUN_ACCESS_KEY_ID`、`ALIYUN_ACCESS_KEY_SECRET`。

如果迁移失败，先备份数据库，再查看具体 migration SQL。不要在生产环境直接删除 volume 来规避迁移问题。
