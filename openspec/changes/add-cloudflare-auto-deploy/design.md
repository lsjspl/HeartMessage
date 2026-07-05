# Cloudflare Git 自动部署设计

## 自动部署边界

API 自动部署只负责生产发布链路中可重复、安全的步骤：

1. `pnpm build` 做 API 类型检查。
2. `wrangler d1 migrations apply heart-message-db --remote` 应用未执行过的 D1 migration。
3. `node ../../scripts/seed-cloudflare-config.mjs` 初始化 KV 中缺失的 `system-settings` 和 `system-sensitive-config`。
4. `wrangler deploy` 部署 Worker。

脚本只在构建环境中执行，不在仓库中保存真实密钥。Cloudflare API Token、账号 ID 和 Token 签名密钥必须作为构建 Secret 配置。

默认超级管理员由 D1 migration 创建，账号为 `admin`，初始密码为 `123456`。管理员初始化不进入 KV，也不通过构建 Secret 配置。上线后必须立即修改默认密码。

## KV 初始化策略

KV 初始化脚本使用 Cloudflare REST API 写入：

- `system-settings`：生产运行环境、CORS 白名单、额度默认值、AI 默认策略。
- `system-sensitive-config`：`AUTH_TOKEN_SECRET`，以及可选的微信和 AI Key。

默认策略是不覆盖已有 KV 配置，避免后台修改过的生产参数被每次部署重置。只有显式设置 `OVERWRITE_CLOUDFLARE_CONFIG=true` 时才覆盖。

## 网页端 Git 绑定

Cloudflare Worker Git 集成中，API 项目的 Root directory 使用 `apps/api`，Deploy command 使用 `pnpm deploy:ci`。Pages 项目仍然由 Cloudflare Pages 绑定 GitHub 部署，分别指向 `apps/admin` 和 `apps/client`。

## 安全

- 日志只输出配置键名和动作，不输出敏感值。
- 如果缺少必需 Secret，脚本必须失败，不能写入半初始化配置。
- 不在部署脚本里创建生产资源；D1、KV、R2、Queue 仍由 Cloudflare 控制台创建并绑定。
