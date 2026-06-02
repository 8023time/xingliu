# Docker 部署指南

这份指南介绍如何通过 Docker 部署 AI Creator Platform 项目。

## 项目结构

- **Server**: NestJS 后端服务（端口 3000）
- **Web**: Next.js 前端应用（端口 8080）
- **Admin**: React + Vite 管理后台（端口 8081）
- **Database**: PostgreSQL 数据库（端口 5432）
- **Proxy**: Caddy 反向代理（端口 80/443）

## 前置要求

- Docker >= 20.10
- Docker Compose >= 2.0
- 至少 4GB 内存
- 至少 10GB 磁盘空间

## 快速开始（开发环境）

### 1. 准备环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，设置必要的环境变量
# 特别注意：修改 DB_PASSWORD 和 JWT_SECRET
```

### 2. 构建并启动容器

```bash
# 构建所有镜像
docker-compose build

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 3. 初始化数据库

```bash
# 运行 Prisma 迁移
docker-compose exec server pnpm prisma migrate deploy

# 可选：生成 Prisma Client
docker-compose exec server pnpm prisma generate
```

### 4. 访问应用

- **Web 应用**: http://localhost:8080
- **Admin 应用**: http://localhost:8081
- **API**: http://localhost:3000
- **API 文档**: http://localhost:3000/api

## 生产环境部署

### 1. 准备生产环境

```bash
# 复制生产环境变量
cp .env.example .env.prod

# 编辑 .env.prod，设置安全的凭证
nano .env.prod
```

### 2. 启动生产环境

```bash
# 使用生产配置启动
docker-compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps
```

### 3. 初始化生产数据库

```bash
# 运行数据库迁移
docker-compose -f docker-compose.prod.yml exec server pnpm prisma migrate deploy

# 验证数据库连接
docker-compose -f docker-compose.prod.yml exec postgres psql -U xingliu -d xingliu_db -c "SELECT version();"
```

## 常用命令

### 查看服务日志

```bash
# 所有服务
docker-compose logs -f

# 特定服务
docker-compose logs -f server
docker-compose logs -f web
docker-compose logs -f admin
docker-compose logs -f postgres
```

### 进入容器

```bash
# 进入后端容器
docker-compose exec server sh

# 进入数据库容器
docker-compose exec postgres psql -U xingliu -d xingliu_db

# 进入 web 容器
docker-compose exec web sh
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart server
docker-compose restart web
```

### 停止和删除容器

```bash
# 停止容器
docker-compose down

# 停止并删除数据卷
docker-compose down -v

# 完全清理（包括镜像）
docker-compose down -v --rmi all
```

### 数据库操作

```bash
# 进入数据库
docker-compose exec postgres psql -U xingliu -d xingliu_db

# 导出数据库
docker-compose exec postgres pg_dump -U xingliu xingliu_db > backup.sql

# 导入数据库
docker-compose exec -T postgres psql -U xingliu xingliu_db < backup.sql
```

### 查看资源使用

```bash
docker stats
```

## 镜像构建

### 手动构建镜像

```bash
# 构建后端镜像
docker build -f Dockerfile.server -t xingliu:server .

# 构建 web 镜像
docker build -f Dockerfile.web -t xingliu:web .

# 构建 admin 镜像
docker build -f Dockerfile.admin -t xingliu:admin .
```

### 推送到镜像仓库

```bash
# 登录到 Docker Hub
docker login

# 标记镜像
docker tag xingliu:server your_username/xingliu:server
docker tag xingliu:web your_username/xingliu:web
docker tag xingliu:admin your_username/xingliu:admin

# 推送镜像
docker push your_username/xingliu:server
docker push your_username/xingliu:web
docker push your_username/xingliu:admin
```

## 网络配置

### Caddy 反向代理配置

编辑 `Caddyfile` 配置反向代理规则：

```caddyfile
http://creator.xingliou.8023time.com {
  reverse_proxy admin:8081
}

http://xingliou.8023time.com {
  reverse_proxy web:8080
}

http://api.xingliou.8023time.com {
  reverse_proxy server:3000
}
```

### HTTPS 配置

自动 HTTPS（需要有效的域名）：

```caddyfile
creator.xingliou.8023time.com {
  reverse_proxy admin:8081
}

xingliou.8023time.com {
  reverse_proxy web:8080
}

api.xingliou.8023time.com {
  reverse_proxy server:3000
}
```

## 故障排查

### 容器无法启动

```bash
# 查看详细错误
docker-compose logs server

# 重建镜像
docker-compose build --no-cache server
docker-compose up server
```

### 数据库连接失败

```bash
# 检查 PostgreSQL 容器状态
docker-compose ps postgres

# 检查数据库日志
docker-compose logs postgres

# 验证连接字符串
docker-compose exec server env | grep DATABASE_URL
```

### 应用无法访问

```bash
# 检查网络
docker-compose exec server ping web
docker-compose exec web ping server

# 检查端口绑定
docker-compose ps

# 检查防火墙规则
netstat -tulpn | grep LISTEN
```

### 性能问题

```bash
# 监控资源使用
docker stats

# 查看容器大小
docker ps --size

# 清理无用镜像和容器
docker system prune -a
```

## 安全建议

1. **更改默认密码**：修改 `.env` 中的 `DB_PASSWORD` 和 `JWT_SECRET`
2. **使用 HTTPS**：在生产环境配置 SSL 证书
3. **定期备份**：定期备份数据库
4. **限制访问**：使用防火墙限制服务访问
5. **更新镜像**：定期更新基础镜像
6. **监控日志**：定期查看应用和系统日志

## 持久化存储

项目定义了以下命名卷：

- `postgres_data`: PostgreSQL 数据
- `caddy_data`: Caddy 证书数据
- `caddy_config`: Caddy 配置数据

数据将持久化在 `/var/lib/docker/volumes/` 中。

## 扩展和优化

### 使用 Docker Swarm 部署

```bash
# 初始化 Swarm
docker swarm init

# 部署服务
docker stack deploy -c docker-compose.prod.yml xingliu
```

### 使用 Kubernetes 部署

需要将 docker-compose 文件转换为 Kubernetes manifests。

### 性能优化

- 使用多阶段构建减小镜像大小
- 启用 BuildKit 加快构建速度
- 合理配置容器资源限制
- 使用卷挂载进行本地开发

## 更新和升级

### 更新应用

```bash
# 拉取最新代码
git pull origin main

# 重建镜像
docker-compose build

# 重新启动服务
docker-compose up -d
```

### 数据库迁移

```bash
# 备份数据库
docker-compose exec postgres pg_dump -U xingliu xingliu_db > backup_$(date +%Y%m%d).sql

# 运行迁移
docker-compose exec server pnpm prisma migrate deploy

# 如果出错，可以恢复备份
docker-compose exec -T postgres psql -U xingliu xingliu_db < backup_*.sql
```

## 支持

遇到问题？

1. 检查日志：`docker-compose logs`
2. 查看文档：查看项目文档目录
3. 提交 Issue：在 GitHub 上提交 Issue

## 许可证

ISC
