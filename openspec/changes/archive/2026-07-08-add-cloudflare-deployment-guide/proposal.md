# Cloudflare 部署配置与说明

## Purpose

项目目标要求 API 和 Web 版部署在 Cloudflare，并使用 D1、R2、Queue 等能力。当前 API 已有 Worker 配置，但 Web/H5 和管理后台缺少 Cloudflare Pages 配置和中文部署说明。需要补齐部署配置与操作清单，方便后续在获得生产确认后上线。

## What Changes

- 为用户端 H5 增加 Cloudflare Pages 配置。
- 为管理后台增加 Cloudflare Pages 配置。
- 增加中文部署说明，列出 API、D1、R2、Queues、用户端 Pages、后台 Pages 的配置步骤。
- 明确本仓库不保存真实密钥和生产资源 ID。
- 明确生产操作必须由用户确认后执行。

## Impact

- 影响 `apps/client`、`apps/admin` 配置文件。
- 新增 `docs/deployment/cloudflare.md`。
- 不执行任何生产部署、远程 migration 或远程资源操作。
