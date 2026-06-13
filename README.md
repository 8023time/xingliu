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
│   └── admin/                     # B 端创作者后台，Vite + React
│       ├── public/                # 静态资源
│       └── src/                   # Admin 前端源码
│           ├── api/               # ai、asset、content、prompt、ranking、user API 层
│           ├── assets/            # 字体、图标和图片资源
│           ├── components/        # 编辑器、布局、弹窗和通用 UI 组件
│           ├── configs/           # 请求配置、错误码和本地信息存储
│           ├── hooks/             # 业务无关的可复用 React hooks
│           ├── lib/               # 本地草稿、请求取消、消息等工具
│           ├── pages/             # login、home、content、prompts、assets、rankings 页面
│           ├── router/            # React Router 路由和守卫
│           ├── stores/            # Zustand 客户端状态
│           └── styles/            # Admin 全局样式
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
├── Dockerfile.admin               # Admin 生产镜像构建文件
├── Dockerfile.server              # Server 生产镜像构建文件
├── Dockerfile.web                 # Web 生产镜像构建文件
├── nginx.conf                     # 生产环境 Nginx 配置
├── package.json                   # 根依赖与脚本配置
├── pnpm-lock.yaml                 # pnpm 锁文件
├── pnpm-workspace.yaml            # pnpm 工作区配置
├── README.md                      # 项目说明
└── turbo.json                     # Turborepo 任务配置
```

## 二、配置hosts

```
127.0.0.1 creator.8023time.com
127.0.0.1 web.8023time.com
127.0.0.1 api.8023time.com
```

## 三、环境变量配置

项目根目录提供 `.env.example`，后端目录也提供 `server/.env.example`。本地开发时先复制示例文件，再按自己的环境填写真实值：

```bash
cp .env.example .env
cp server/.env.example server/.env
```

主要配置项如下：

| 配置类别 | 关键变量 | 说明 |
| --- | --- | --- |
| PostgreSQL | `DB_USER`、`DB_PASSWORD`、`DB_NAME`、`DATABASE_URL` | 数据库账号、密码、库名和 Prisma 连接串。Docker 环境会使用这些变量初始化数据库。 |
| JWT | `JWT_SECRET`、`JWT_EXPIRATION` | 双 Token 认证的签名密钥和 Access Token 有效期。生产环境必须使用足够长的随机密钥。 |
| MinIO | `MINIO_ENDPOINT`、`MINIO_PORT`、`MINIO_USE_SSL`、`MINIO_ACCESS_KEY`、`MINIO_SECRET_KEY`、`MINIO_BUCKET_NAME`、`MINIO_PUBLIC_URL` | 素材文件对象存储配置。`MINIO_PUBLIC_URL` 需要是后端和阿里云内容安全可访问的公开地址。 |
| 火山方舟模型或者openai模型 | `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL` | 项目通过 `@langchain/openai` 的 OpenAI 接入火山方舟。你也可以接入 OpenAI 官方服务。 |
| 阿里云内容安全 | `ALIYUN_ACCESS_KEY_ID`、`ALIYUN_ACCESS_KEY_SECRET`、`ALIYUN_GREEN_ENDPOINT`、`ALIYUN_GREEN_REGION_ID`、`ALIYUN_GREEN_TEXT_SERVICE`、`ALIYUN_GREEN_IMAGE_SERVICE` | 用于文本和图片内容安全审核。AccessKey 只放在 `.env`，不要提交到仓库。 |
| 前端运行时 | `NEXT_PUBLIC_API_URL` | Docker 或部署环境中 Web 前台访问 API 的地址。 |

注意：

- 真实 `.env`、`server/.env` 不要提交到 Git。
- 本地如果只用 Docker 启动 PostgreSQL 和 MinIO，优先修改根目录 `.env`。
- 单独运行后端时，确保 `server/.env` 中的 `DATABASE_URL`、MinIO、火山方舟和阿里云配置可用。
- 阿里云图片审核依赖图片公网可下载，部署时需要确认 `MINIO_PUBLIC_URL` 能被阿里云服务访问。

## 四、技术栈版本

当前项目使用的技术栈版本：

- Node.js: v24.11.1
- pnpm: 10.25.0
- nest: 11.0.14

注意：

- 如果使用的需要只用其他pnpm版本，请先修改根目录下的 package.json 中的 "packageManager" 字段为对应版本，否则使用 turbo 会报错。



## 五、安装

1.  安装 Caddy
2.  复制并填写环境变量：`cp .env.example .env`、`cp server/.env.example server/.env`
3.  安装项目依赖 `pnpm install`

## 六、启动

1. 启动 Caddy 反向代理（前提）：

```bash
pnpm run dev:proxy
```

2. 启动后端 API 服务：

```bash
pnpm run dev:server
```

3. 启动前端应用：

```bash
pnpm run dev:web
pnpm run dev:admin
```

## 七、项目文档

[00-索引-文档导航.md](./docs//00-索引-文档导航.md)
