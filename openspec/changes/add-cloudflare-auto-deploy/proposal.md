# Cloudflare Git 自动部署与初始化

## Purpose

当前 Cloudflare 部署说明要求人工执行远程 D1 migration，并手动向 KV 写入首次系统配置。这个流程容易漏步骤，也不符合网页端绑定 GitHub 后自动部署的使用方式。需要提供一条可由 Cloudflare Git 构建或 GitHub CI 调用的自动化部署链路。

## What Changes

- 增加 API 生产部署脚本，按顺序执行类型检查、远程 D1 migration、KV 首次配置初始化和 Worker 部署。
- 增加 Cloudflare KV 初始化脚本，从构建环境变量读取 Token 密钥、CORS 白名单等敏感或运行配置。
- 增加 D1 seed migration，部署数据库时创建默认超级管理员 `admin / 123456`。
- 更新 Cloudflare 部署文档，说明网页端绑定 GitHub 时的 API deploy command、Pages 构建命令和必需构建 Secret。
- 保持真实密钥不入仓库，生产资源操作仍需用户在 Cloudflare/GitHub 中显式配置 token 和资源。

## Impact

- 影响 `apps/api/package.json`。
- 新增 `scripts/seed-cloudflare-config.mjs`。
- 更新 `docs/deployment/cloudflare.md`。
- 不执行生产部署、不执行远程 D1 migration、不修改远程 KV。
