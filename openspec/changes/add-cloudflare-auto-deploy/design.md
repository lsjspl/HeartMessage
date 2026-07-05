# Cloudflare Git 自动部署设计

## 自动部署边界

API 自动部署只负责生产发布链路中可重复、安全的步骤：

1. `pnpm build` 做 API 类型检查。
2. `wrangler d1 migrations apply heart-message-db --remote` 应用未执行过的 D1 migration。
3. `wrangler deploy` 部署 Worker。

脚本只在构建环境中执行，不在仓库中保存真实密钥，也不从 Cloudflare 构建环境变量读取运行环境、CORS 白名单、Token 签名密钥、微信配置或 AI Key。

默认超级管理员由 D1 migration 创建，账号为 `admin`，初始密码为 `123456`。管理员初始化不进入 KV，也不通过构建 Secret 配置。上线后必须立即修改默认密码。

## 后台配置初始化策略

系统配置和敏感配置都通过后端服务读写 `CONFIG_KV`：

- 当 `system-settings` 缺失时，后端首次读取系统配置时写入默认系统配置。
- 当 `AUTH_TOKEN_SECRET` 缺失且需要签发 Token 时，后端生成随机密钥并写入 `system-sensitive-config`。
- 微信 App Secret、AI Key 等其他敏感值必须由管理员在后台敏感配置页面补齐。

部署脚本不得覆盖后台已经修改过的系统参数或敏感配置。

## 网页端 Git 绑定

Cloudflare Worker Git 集成中，API 项目的 Root directory 留空，Deploy command 使用 `pnpm --filter @heart-message/api deploy:ci`。Pages 项目仍然由 Cloudflare Pages 绑定 GitHub 部署，分别指向 `apps/admin` 和 `apps/client`。

## 安全

- 日志不能输出敏感值。
- 部署脚本不得依赖 `PRODUCTION_CORS_ORIGINS`、`AUTH_TOKEN_SECRET` 等业务配置环境变量。
- 不在部署脚本里创建生产资源；D1、KV、R2、Queue 仍由 Cloudflare 控制台创建并绑定。
