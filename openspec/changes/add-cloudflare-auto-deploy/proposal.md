# Cloudflare Git 自动部署与初始化

## Purpose

当前 Cloudflare 部署说明要求人工执行远程 D1 migration，首次系统配置也需要由数据库 migration 创建。需要提供一条可由 Cloudflare Git 构建或 GitHub CI 调用的自动化部署链路。

## What Changes

- 增加 API 生产部署脚本，按顺序执行类型检查、远程 D1 migration 和 Worker 部署。
- 移除从 Cloudflare 构建环境变量初始化业务配置的路径，运行参数和敏感值统一由后台系统配置维护。
- 增加后端首次运行的配置自初始化：系统配置缺失时写入默认系统配置，`AUTH_TOKEN_SECRET` 缺失时生成随机密钥并写入敏感配置。
- 增加 D1 seed migration，部署数据库时创建默认超级管理员 `admin / 123456`。
- 更新 Cloudflare 部署文档，说明网页端绑定 GitHub 时的 API deploy command、Pages 构建命令和后台配置入口。
- 保持真实密钥不入仓库，生产资源操作仍需用户在 Cloudflare/GitHub 中显式配置资源绑定。

## Impact

- 影响 `apps/api/package.json`。
- 影响 `apps/api/src/services/settings.ts` 和 `apps/api/src/services/sensitive-config.ts`。
- 更新 `docs/deployment/cloudflare.md`。
- 不执行生产部署、不执行远程 D1 migration。
