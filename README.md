<div align="center">

# 星流 - AI 创作者平台

</div>

## 一、项目架构概览

使用 Turborepo + pnpm + Monorepo 统一管理整个项目

```
xingliu/
├── .vscode/                       # VS Code 工作区配置
├── .husky/                        # Git hooks
├── docs/                          # 项目文档
├── apps/                          # 前端应用目录
│   ├── web/                       # C 端内容前台，Next.js App Router
│   │   ├── public/                # 静态资源
│   │   └── src/                   # Web 前端源码
│   │       ├── app/               # App Router 页面、布局和 API 代理
│   │       │   ├── (home)/        # 首页内容流
│   │       │   ├── content/[id]/  # 公开内容详情页
│   │       │   ├── user/          # C 端用户相关页面
│   │       │   └── api/proxy/     # 转发到后端 /api 的代理路由
│   │       ├── assets/            # 字体、图片和全局样式资源
│   │       ├── components/        # 认证、布局和通用 UI 组件
│   │       ├── features/          # content、ranking、user 等业务功能
│   │       ├── lib/               # 请求、格式化、存储等工具
│   │       ├── stores/            # Zustand 客户端状态
│   │       └── type/              # Web 侧补充类型
│   └── creator/                   # B 端创作者中心，Vite + React
│       ├── public/                # 静态资源
│       └── src/                   # Creator 前端源码
│           ├── api/               # ai、asset、content、prompt、ranking、user API 层
│           ├── assets/            # 字体、图标和图片资源
│           ├── components/        # 编辑器、布局、弹窗和通用 UI 组件
│           ├── configs/           # 请求配置、错误码和本地信息存储
│           ├── hooks/             # 业务无关的可复用 React hooks
│           ├── lib/               # 本地草稿、请求取消、消息等工具
│           ├── pages/             # login、home、content、prompts、assets、rankings 页面
│           ├── router/            # React Router 路由和守卫
│           ├── stores/            # Zustand 客户端状态
│           └── styles/            # Creator 全局样式
├── server/                        # 后端 API 服务，NestJS
│   ├── src/                       # 后端业务模块源码
│   │   ├── ai-generation/         # AI 候选内容生成
│   │   ├── asset/                 # 素材上传、存储和基础合规检查
│   │   ├── auth/                  # JWT 认证模块
│   │   ├── content/               # 内容壳、版本、发布和公开详情
│   │   ├── draft/                 # 云端草稿快照与同步
│   │   ├── moderation/            # 审核编排与通用预检
│   │   ├── prompt/                # Prompt 模板管理
│   │   ├── quality/               # AI 质量评分
│   │   ├── ranking/               # 内容流、热点榜和爆文榜
│   │   ├── rewrite/               # 合规改写候选与采纳
│   │   └── user/                  # 注册、登录和用户信息
│   ├── libs/                      # 后端内部公共库
│   │   └── common/src/            # 后端共享能力
│   │       ├── ai/                # LangChain ChatOpenAI 封装与生成、评分、改写服务
│   │       ├── auth/              # JWT 鉴权守卫
│   │       ├── file/              # MinIO 存储、文件处理和上传类型
│   │       ├── filter/            # 全局 HTTP 异常过滤器
│   │       ├── generated/         # Prisma 生成客户端代码
│   │       ├── interceptor/       # 全局 HTTP 响应拦截器
│   │       ├── moderation/        # mint-filter、阿里云内容安全和审核决策
│   │       ├── prisma/            # Prisma 数据库服务
│   │       └── response/          # 标准响应格式化
│   ├── prisma/                    # Prisma schema 与迁移文件
│   └── type/                      # Express 等运行时类型补充
├── packages/                      # 共享包目录
│   ├── config/                    # 共享配置包
│   └── shared/                    # 共享类型
├── .dockerignore                  # Docker 忽略规则
├── .editorconfig                  # 编辑器通用格式约束
├── .env.example                   # 环境变量配置示例
├── .gitattributes                 # Git 文本属性与换行处理
├── .gitignore                     # Git 忽略规则
├── .oxlintrc.json                 # Oxlint 配置
├── .prettierignore                # Prettier 忽略规则
├── .prettierrc                    # Prettier 格式化规则
├── Caddyfile                      # 本地域名反向代理配置
├── Caddyfile.docker               # Docker 环境 Caddy 配置
├── commitlint.config.cjs          # Commitlint 配置
├── docker-compose.prod.yml        # 生产环境 Docker Compose 配置
├── docker-compose.yml             # 开发环境 Docker Compose 配置
├── Dockerfile.creator             # Creator 生产镜像构建文件
├── Dockerfile.server              # Server 生产镜像构建文件
├── Dockerfile.web                 # Web 生产镜像构建文件
├── nginx.conf                     # 生产环境 Nginx 配置
├── package.json                   # 根依赖与脚本配置
├── pnpm-lock.yaml                 # pnpm 锁文件
├── pnpm-workspace.yaml            # pnpm 工作区配置
├── README.md                      # 项目说明
└── turbo.json                     # Turborepo 任务配置
```

性能：
![alt text](https://i.ibb.co/r2gGBVpt/image.png)

## 二、开发配置

### 1. 配置 hosts

本地开发默认通过 Caddy 代理到 Web、Creator 和 Server。请先在系统 hosts 文件中添加以下域名映射：

```text
127.0.0.1 creator.xingliu-test.8023time.com
127.0.0.1 xingliu-test.8023time.com
127.0.0.1 api.xingliu-test.8023time.com
```

### 2. 配置环境变量

项目根目录提供 `.env.example`，后端目录提供 `server/.env.example`。本地开发主要配置 `server/.env`；根目录 `.env` 主要用于 Docker 编排、部署环境和 GitHub 等代码托管平台的环境变量配置参考。

```bash
cp server/.env.example server/.env
```

如果需要使用 Docker Compose 启动完整部署环境，再复制根目录环境变量示例：

```bash
cp .env.example .env
```

主要配置项如下：

| 配置类别       | 关键变量                                                                                                                                                         | 说明                                                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| PostgreSQL     | `DB_USER`、`DB_PASSWORD`、`DB_NAME`、`DATABASE_URL`                                                                                                              | 数据库账号、密码、库名和 Prisma 连接串。开发后端主要读取 `server/.env` 中的 `DATABASE_URL`；Docker 环境会使用根目录 `.env` 初始化数据库。 |
| JWT            | `JWT_SECRET`、`JWT_EXPIRATION`                                                                                                                                   | 双 Token 认证的签名密钥和 Access Token 有效期。生产环境必须使用足够长的随机密钥。                                                         |
| MinIO          | `MINIO_ENDPOINT`、`MINIO_PORT`、`MINIO_USE_SSL`、`MINIO_ACCESS_KEY`、`MINIO_SECRET_KEY`、`MINIO_BUCKET_NAME`、`MINIO_PUBLIC_URL`                                 | 素材文件对象存储配置。`MINIO_PUBLIC_URL` 需要是后端和阿里云内容安全可访问的公开地址。                                                     |
| 火山方舟模型   | `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL`                                                                                                              | 项目通过 `@langchain/openai` 的 OpenAI 兼容接口接入火山方舟。                                                                             |
| 阿里云内容安全 | `ALIYUN_ACCESS_KEY_ID`、`ALIYUN_ACCESS_KEY_SECRET`、`ALIYUN_GREEN_ENDPOINT`、`ALIYUN_GREEN_REGION_ID`、`ALIYUN_GREEN_TEXT_SERVICE`、`ALIYUN_GREEN_IMAGE_SERVICE` | 用于文本和图片内容安全审核。AccessKey 只放在 `.env`，不要提交到仓库。                                                                     |
| 前端运行时     | `NEXT_PUBLIC_API_URL`                                                                                                                                            | Docker 或部署环境中 Web 前台访问 API 的地址。                                                                                             |

注意事项：

- 真实 `.env`、`server/.env` 不要提交到 Git。
- 本地开发后端时，优先修改 `server/.env`。
- 根目录 `.env` 不作为日常开发的主要配置文件，主要给 Docker Compose、部署环境和 GitHub 等代码托管平台配置环境变量时参考。
- 运行后端时，确保 `server/.env` 中的 `DATABASE_URL`、MinIO、火山方舟和阿里云配置可用。
- 阿里云图片审核依赖公网可下载的图片地址，部署时需要确认 `MINIO_PUBLIC_URL` 能被阿里云服务访问。

### 3. 技术栈版本

当前项目使用的主要版本：

- Node.js: v24.11.1
- pnpm: 10.25.0
- NestJS: 11.0.14

注意事项：

- 根目录 `package.json` 已通过 `packageManager` 固定 pnpm 版本。
- 如果必须使用其他 pnpm 版本，请同步修改 `package.json` 中的 `packageManager` 字段，否则 Turborepo 可能会因为包管理器版本不一致而报错。

## 五、安装

1. 安装 Node.js、pnpm、Docker 和 Caddy。
2. 复制并填写后端开发环境变量：

   ```bash
   cp server/.env.example server/.env
   ```

   如需使用 Docker Compose 启动完整部署环境，再复制根目录 `.env.example`：

   ```bash
   cp .env.example .env
   ```

3. 安装项目依赖：

   ```bash
   pnpm install
   ```

## 六、启动

### 本地开发

1. 启动 PostgreSQL 和 MinIO：

   ```bash
   自己配置,可以使用下载并安装 PostgreSQL 和 MinIO 的本地版本，或者使用 Docker Compose 启动它们：
   ```

2. 启动 Web、Creator、Server 和本地域名代理：

   ```bash
   pnpm dev
   ```

3. 访问本地服务：
   - Web 前台：`http://xingliu-test.8023time.com`
   - Creator 中心：`http://creator.xingliu-test.8023time.com`
   - Server API：`http://api.xingliu-test.8023time.com`

## 七、项目文档

[00-索引-文档导航.md](./docs//00-索引-文档导航.md)
