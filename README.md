# AI 创作者辅助⽣产与分发平台

## 一、项目架构概览

```
ai-creator-platform/
├── .vscode/                       # VS Code 工作区配置
├── .husky/                        # Git hooks
├── docs/                          # 项目文档
├── apps/                          # 前端应用目录
│   ├── web/                       # C 端内容前台，Next.js
│   |   ├── src/                   # 前端源码目录
|   |
│   └── admin/                     # B 端创作者后台，Vite + React
│       ├── src/                   # 前端源码目录
|
├── server/                        # 后端 API 服务，NestJS
│   ├── src/                       # 后端源码目录
│   ├── libs/                      # 后端公共库
|
├── packages/                      # 共享包目录
│   ├── config/                    # 共享配置包
│   └── shared/                    # 共享类型
|
├── prisma/                        # Prisma 数据库目录
|
├── .editorconfig                  # 编辑器通用格式约束
├── .gitattributes                 # Git 文本属性与换行处理
├── .gitignore                     # Git 忽略规则
├── .prettierignore                # Prettier 忽略规则
├── .prettierrc                    # Prettier 格式化规则
├── Caddyfile                      # 本地域名反向代理配置
├── commitlint.config.cjs          # Commitlint 配置
├── eslint.config.js               # 根 ESLint 配置
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

- Node.js: v24.11.1
- pnpm: 10.25.0
- nest: 11.0.14

## 三、安装

- 安装 Caddy
- 安装项目依赖

## 四、启动

待定

## 五、项目文档

[00-索引-文档导航.md](./docs//00-索引-文档导航.md)
