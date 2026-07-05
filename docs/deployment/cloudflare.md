# Cloudflare 部署说明

## 部署边界

本说明只记录部署准备和命令清单，不代表可以直接操作生产环境。执行生产部署、远程 D1 migration、远程 KV/R2/Queue 修改前，必须先确认目标环境、资源、命令、影响范围和回滚方式，并获得明确同意。

## Cloudflare 资源

- D1：保存用户、资料、瓶子、捡瓶记录、会话、消息、额度、AI 配置、日志。
- R2：保存头像和后续媒体附件。
- KV：保存系统参数、AI 用途绑定等配置。
- Queues：预留 AI 生成和日志异步任务。
- Workers：运行 `apps/api`。
- Pages：运行用户端 H5 和管理后台。

## API Worker

配置文件：`apps/api/wrangler.jsonc`

生产前需要替换或配置：

- `d1_databases[0].database_id`
- `kv_namespaces[0].id`
- `r2_buckets[0].bucket_name`
- `queues.producers`
- `CORS_ORIGINS`
- `AUTH_TOKEN_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`
- 各 AI 供应商使用的密钥环境变量，例如 `OPENAI_API_KEY`、`DEEPSEEK_API_KEY`

本地验证命令：

```bash
pnpm --filter @heart-message/api db:migrate:local
pnpm --filter @heart-message/api build
pnpm --filter @heart-message/api dev
```

生产操作命令模板：

```bash
pnpm --filter @heart-message/api exec wrangler d1 migrations apply heart-message-db --remote
pnpm --filter @heart-message/api exec wrangler deploy
```

不要在未确认时执行以上生产命令。

## 用户端 H5 Pages

配置文件：`apps/client/wrangler.jsonc`

构建输出目录：`apps/client/dist/build/h5`

生产前需要配置：

- Pages 项目名：`heart-message-client` 或实际项目名。
- `VITE_API_BASE_URL`：API Worker 的生产域名。
- `VITE_WECHAT_APP_ID`：微信公众号网页授权 AppID。
- `VITE_WECHAT_REDIRECT_URI`：微信网页授权回调地址，必须在微信后台配置为可信域名。

本地验证命令：

```bash
pnpm --filter @heart-message/client build:h5
```

生产部署命令模板：

```bash
pnpm --filter @heart-message/client exec wrangler pages deploy dist/build/h5 --project-name heart-message-client
```

不要在未确认时执行以上生产命令。

## 管理后台 Pages

配置文件：`apps/admin/wrangler.jsonc`

构建输出目录：`apps/admin/dist`

生产前需要配置：

- Pages 项目名：`heart-message-admin` 或实际项目名。
- `VITE_API_BASE_URL`：API Worker 的生产域名。

本地验证命令：

```bash
pnpm --filter @heart-message/admin build
```

生产部署命令模板：

```bash
pnpm --filter @heart-message/admin exec wrangler pages deploy dist --project-name heart-message-admin
```

不要在未确认时执行以上生产命令。

## 上线前检查

- `pnpm spec:validate`
- `pnpm typecheck`
- `pnpm --filter @heart-message/client build:h5`
- `pnpm --filter @heart-message/admin build`
- `pnpm --filter @heart-message/api build`
- 确认生产 CORS 只包含真实前端和后台域名。
- 确认 `.env`、真实密钥和 Cloudflare token 没有写入仓库。
- 确认远程 D1 migration 已经评估影响范围和回滚方案。
