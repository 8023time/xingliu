# CI/CD 自动部署

本文说明如何实现“提交到 GitHub main 分支后自动部署到服务器”。

## 部署链路

当前项目使用 GitHub Actions + SSH + Docker Compose：

1. 推送代码到 `main`。
2. GitHub Actions 安装依赖并执行构建校验。
3. 构建通过后，Actions 通过 SSH 登录服务器。
4. 服务器进入部署目录，执行 `git pull --ff-only`。
5. 服务器执行 `docker compose -f docker-compose.prod.yml up -d --build`。
6. 后端容器启动时自动执行 `prisma migrate deploy`。

workflow 文件位于 `.github/workflows/deploy.yml`。

## 服务器准备

服务器需要先安装 Docker、Docker Compose 和 Git，并准备一个固定部署目录，例如：

```bash
sudo mkdir -p /opt/xingliu
sudo chown -R $USER:$USER /opt/xingliu
git clone https://github.com/8023time/ai-creator-platform.git /opt/xingliu
cd /opt/xingliu
```

如果仓库是私有仓库，服务器也需要配置可拉取该仓库的 deploy key 或 GitHub token。

部署用户需要能执行 Docker：

```bash
sudo usermod -aG docker $USER
```

执行后重新登录服务器，让 docker 用户组生效。

## GitHub Secrets

在 GitHub 仓库中进入 `Settings -> Secrets and variables -> Actions`，新增以下 Secrets：

| 名称 | 说明 |
| --- | --- |
| `DEPLOY_HOST` | 服务器公网 IP 或域名 |
| `DEPLOY_PORT` | SSH 端口，通常是 `22` |
| `DEPLOY_USER` | SSH 登录用户 |
| `DEPLOY_SSH_PRIVATE_KEY` | GitHub Actions 使用的 SSH 私钥 |
| `PROD_ENV_FILE` | 生产 `.env` 文件完整内容 |

新增 Repository Variable：

| 名称 | 示例 | 说明 |
| --- | --- | --- |
| `DEPLOY_PATH` | `/opt/xingliu` | 服务器上的项目目录 |

`PROD_ENV_FILE` 内容应参考根目录 `.env.example`，至少包含：

```env
DB_USER=xingliu
DB_PASSWORD=replace_with_strong_password
DB_NAME=xingliu_db

JWT_SECRET=replace_with_long_random_secret
JWT_EXPIRATION=86400

MINIO_ACCESS_KEY=replace_with_minio_access_key
MINIO_SECRET_KEY=replace_with_minio_secret_key
MINIO_BUCKET_NAME=xingliu-assets
MINIO_PUBLIC_URL=https://your-public-minio-domain/xingliu-assets

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

## SSH 密钥建议

建议为 CI/CD 单独创建一把密钥，不要使用个人常用 SSH 私钥：

```bash
ssh-keygen -t ed25519 -C "xingliu-deploy" -f ~/.ssh/xingliu_deploy
```

把公钥 `~/.ssh/xingliu_deploy.pub` 加到服务器部署用户的 `~/.ssh/authorized_keys`。

把私钥 `~/.ssh/xingliu_deploy` 的完整内容填入 GitHub Secret：`DEPLOY_SSH_PRIVATE_KEY`。

## 手动触发

除了 push 到 `main`，也可以在 GitHub Actions 页面手动执行 `Build and Deploy`。

## 回滚

推荐用 Git 回滚提交后重新推送：

```bash
git revert <bad_commit_sha>
git push origin main
```

Actions 会重新部署回滚后的版本。

## 排错

如果 Actions 在构建阶段失败，先修复对应应用构建：

```bash
pnpm --filter @xingliu/server build
pnpm --filter @xingliu/creator build
pnpm --filter @xingliu/web build
```

如果部署阶段失败，登录服务器检查：

```bash
cd /opt/xingliu
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f server
```

如果 `git pull --ff-only` 失败，说明服务器部署目录存在本地提交或分支分叉。部署目录应只用于部署，不要在服务器上手写代码改动。
