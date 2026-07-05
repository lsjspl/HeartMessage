# Cloudflare 网页端绑定 GitHub 部署说明

## 部署边界

本说明记录 Cloudflare Dashboard 绑定 GitHub 的部署方式。执行生产部署、远程 D1 migration、远程 KV/R2/Queue 修改前，必须确认目标环境、资源、命令、影响范围和回滚方式，并由项目负责人明确同意。

## 项目拆分

本仓库是 monorepo，Cloudflare 中需要创建三个项目：

- `heart-message-api`：Worker API，目录 `apps/api`。
- `heart-message-admin`：管理后台 Pages，目录 `apps/admin`。
- `heart-message-client`：用户端 H5 Pages，目录 `apps/client`。

## Cloudflare 资源

先在 Cloudflare Dashboard 创建并绑定以下资源：

- D1：`heart-message-db`。
- KV：用于 `CONFIG_KV`，保存系统参数和敏感配置。
- R2：`heart-message-media`。
- Queue：`heart-message-ai`、`heart-message-logs`。

`apps/api/wrangler.jsonc` 只保存 Worker 入口、兼容性、定时任务和 Cloudflare 绑定声明。运行环境、CORS 白名单、Token 密钥、微信配置和 AI Key 都必须走后台系统配置或敏感配置。默认超级管理员由 D1 migration 创建，初始账号密码是 `admin / 123456`，首次登录后必须立即修改密码。

## API Worker 自动部署

配置文件：`apps/api/wrangler.jsonc`

推荐使用 Cloudflare 网页端绑定 GitHub 自动部署。这个方式不需要在本机执行 `wrangler whoami`，也不需要在本机登录 Cloudflare。

Cloudflare Dashboard 操作：

1. 进入 `Workers & Pages`。
2. 创建或选择 Worker：`heart-message-api`。
3. 在 `Settings` -> `Builds` 中连接 GitHub 仓库。
4. Root directory 选择 `apps/api`。
5. Install command 填：

```bash
pnpm install --frozen-lockfile
```

6. Deploy command 填：

```bash
pnpm deploy:ci
```

`pnpm deploy:ci` 会按顺序执行：

1. `pnpm build`
2. `pnpm db:migrate:remote`
3. `pnpm seed:cloudflare-config`
4. `wrangler deploy`

也就是说，推送到 GitHub 后会自动执行远程 D1 migration、初始化缺失 KV 配置并部署 Worker。不要再手动去 D1 Console 粘贴 SQL。

## API 构建 Secret

API 自动部署需要在 Cloudflare Worker 的构建环境中配置以下变量。它们是构建 Secret，不是应用运行时 `wrangler vars`。

必填：

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `PRODUCTION_CORS_ORIGINS`：逗号分隔，例如 `https://admin.example.com,https://app.example.com`
- `AUTH_TOKEN_SECRET`

可选：

- `CONFIG_KV_NAMESPACE_ID`：不填时会读取 `apps/api/wrangler.jsonc` 中 `CONFIG_KV` 的 id。
- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`
- `LOCAL_TEST_MODEL_API_KEY`
- `EXTRA_SENSITIVE_CONFIG_JSON`：JSON object，用来一次性写入额外 AI Key，例如 `{"DEEPSEEK_API_KEY":"replace-with-real-secret"}`
- `OVERWRITE_CLOUDFLARE_CONFIG`：默认不填。只有需要覆盖已有 KV 配置时才填 `true`。

初始化脚本默认不会覆盖已经存在的 `system-settings` 和 `system-sensitive-config`，避免后台已经改过的生产配置被每次部署重置。

## 本地直接部署方式

只有在明确需要从本机直接部署，并且已经确认允许操作生产环境时，才使用本节命令。不要在用户目录、编辑器目录或任意非项目目录运行 `pnpm --filter ...`。

错误示例：

```powershell
PS C:\Users\lsj> pnpm --filter @heart-message/api exec wrangler login
```

上面的命令是在用户目录执行，pnpm 可能会扫描或操作到其他工具目录，例如 Windsurf 的资源目录，出现无关依赖移动、安装、网络重试等混乱输出。

正确方式一：先进入项目根目录，再登录 Cloudflare。

```powershell
cd C:\Users\lsj\Desktop\IDEAProject\HeartMessage
pnpm --filter @heart-message/api exec wrangler login
```

登录成功后，可以用 `whoami` 检查当前账号：

```powershell
pnpm --filter @heart-message/api exec wrangler whoami
```

正确方式二：不切目录，显式指定项目目录登录。

```powershell
pnpm --dir C:\Users\lsj\Desktop\IDEAProject\HeartMessage --filter @heart-message/api exec wrangler login
```

同样可以用下面命令检查登录状态：

```powershell
pnpm --dir C:\Users\lsj\Desktop\IDEAProject\HeartMessage --filter @heart-message/api exec wrangler whoami
```

本地直接部署 API 的命令也必须在项目根目录执行：

```powershell
cd C:\Users\lsj\Desktop\IDEAProject\HeartMessage
pnpm --filter @heart-message/api deploy:ci
```

`deploy:ci` 会执行远程 D1 migration、KV 初始化和 Worker 部署。未获得生产操作确认时，不得执行。

## 管理后台 Pages

Cloudflare Pages 绑定 GitHub：

- Project name：`heart-message-admin`
- Root directory：`apps/admin`
- Install command：

```bash
pnpm install --frozen-lockfile
```

- Build command：

```bash
pnpm build
```

- Build output directory：

```text
dist
```

Pages 环境变量：

- `VITE_API_BASE_URL`：API Worker 的生产域名。

## 用户端 H5 Pages

Cloudflare Pages 绑定 GitHub：

- Project name：`heart-message-client`
- Root directory：`apps/client`
- Install command：

```bash
pnpm install --frozen-lockfile
```

- Build command：

```bash
pnpm build:h5
```

- Build output directory：

```text
dist/build/h5
```

Pages 环境变量：

- `VITE_API_BASE_URL`：API Worker 的生产域名。
- `VITE_WECHAT_APP_ID`：微信公众号网页授权 AppID。
- `VITE_WECHAT_REDIRECT_URI`：微信网页授权回调地址。

`VITE_WECHAT_APP_ID` 是公开 AppID，不是 secret。`WECHAT_APP_SECRET` 必须放在后台敏感配置，不能写进 Pages 变量或仓库。

## 首次上线后检查

1. 打开 API `/health`，确认返回 `ok: true`。
2. 打开后台 Pages，用默认账号 `admin` 和默认密码 `123456` 登录。
3. 登录后立刻修改超级管理员密码。
4. 进入系统参数，确认运行环境为 `production`，CORS 白名单只包含正式后台和用户端域名。
5. 进入敏感配置，补齐微信和 AI Key。
6. 进入 AI 配置，添加供应商、模型和用途绑定。

## 本地验证

部署前至少运行：

```bash
pnpm spec:validate
pnpm typecheck
pnpm --filter @heart-message/api build
pnpm --filter @heart-message/admin build
pnpm --filter @heart-message/client build:h5
```

不要把 `dist`、`.wrangler`、真实密钥、Cloudflare token 或本地日志提交到仓库。
