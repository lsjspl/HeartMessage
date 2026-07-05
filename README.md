# HeartMessage

漂流瓶社交程序，先交付 Web/H5，后续扩展微信小程序和 App。后端与 Web 版部署在 Cloudflare，使用 Workers、D1、R2、KV、Queues 等能力。

## 项目结构

```txt
apps/
  client/        # uni-app 用户端：H5 / 小程序 / App
  admin/         # Vue 3 管理后台
  api/           # Cloudflare Workers API
packages/
  shared/        # 共享类型、Zod schema、常量
  db/            # D1 / Drizzle schema
  ai/            # 多模型 AI 供应商适配层
openspec/
  specs/         # 已确认的产品/技术规格
  changes/       # 每次需求变更的 proposal / design / tasks / spec delta
docs/
  design/        # 设计稿和产品图
```

## 本地环境准备

需要先安装 Node.js。本项目使用 `pnpm@11.9.0`。

```powershell
node -v
npm -v
```

### Windows 普通 PowerShell 推荐方式

普通 PowerShell 执行 `corepack enable` 时，可能因为没有权限写入 `C:\Program Files\nodejs` 而失败。优先把 pnpm 安装到当前用户目录：

```powershell
npm config set prefix "$env:APPDATA\npm"
npm install -g pnpm@11.9.0
$env:Path = "$env:APPDATA\npm;$env:Path"
pnpm -v
```

如果重新打开 PowerShell 后仍然提示 `pnpm` 不是可识别命令，把用户 npm 目录写入当前用户的 Path，然后再重新打开 PowerShell：

```powershell
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$userNpm = "$env:APPDATA\npm"
if (-not (($userPath -split ";") -contains $userNpm)) {
  [Environment]::SetEnvironmentVariable("Path", (($userPath, $userNpm) -join ";").Trim(";"), "User")
}
```

如果暂时不想处理 Path，也可以直接把命令里的 `pnpm` 换成 `corepack pnpm`：

```powershell
corepack prepare pnpm@11.9.0 --activate
corepack pnpm install
corepack pnpm --filter @heart-message/api db:migrate:local
```

只有在明确以管理员身份打开 PowerShell 时，才建议执行 `corepack enable`。

## 开发命令

```bash
pnpm install
pnpm dev:client
pnpm dev:admin
pnpm dev:api
```

## 本地测试

### 1. 初始化本地数据库

```bash
pnpm --filter @heart-message/api db:migrate:local
```

### 2. 启动三个本地服务

分别开三个终端：

```bash
pnpm dev:api
pnpm dev:client
pnpm dev:admin
```

默认地址：

- 用户端 Web/H5：http://localhost:5173
- 管理后台：http://localhost:5174
- API：http://127.0.0.1:8787

本地管理员账号在 `apps/api/wrangler.jsonc`：

- 用户名：`local-admin`
- 密码：`local-admin-password-change-before-production`

### 3. 用户端手动测试路径

1. 打开 http://localhost:5173。
2. 点击微信登录。本地开发环境未配置微信 AppID 时，会自动使用开发登录 code。
3. 完善资料：头像、昵称、年龄、个人介绍、性别。
4. 扔瓶子：每天最多 3 个。
5. 换一个浏览器或清理本地 token 后，再登录另一个开发用户。
6. 捡瓶子：每天最多 20 个。
7. 捡到瓶子后回复，进入聊天。
8. 删除捡到的瓶子或会话，再尝试发送消息，应被拒绝。

### 4. 管理后台手动测试路径

1. 打开 http://localhost:5174。
2. 使用本地管理员账号登录。
3. 在「系统参数」里调整每日额度和 AI 补位开关。
4. 在「AI 模型管理」里维护供应商、模型和用途绑定。
5. 在「用户管理」里禁用/恢复用户。
6. 在「瓶子管理」里封禁、删除或过期瓶子。
7. 在「日志中心」查看后台操作和 AI 事件日志。

### 5. AI 补位测试

如果要测试“无瓶可捞时由 AI 生成瓶子并陪聊”，需要先配置一个模型供应商。

可接真实 OpenAI-compatible 模型，也可以本地启动一个假模型服务用于联调：

```bash
node -e "const http=require('http');http.createServer((req,res)=>{let b='';req.on('data',c=>b+=c);req.on('end',()=>{const t=b.includes('人格生成器')?JSON.stringify({displayName:'林潮',bio:'喜欢夜里散步，也愿意接住别人的小心事。',age:27,gender:'unknown',systemPrompt:'你叫林潮，说话温和，擅长延续聊天。'}):b.includes('内容生成器')?JSON.stringify({content:'今晚风很轻，我想问问捡到这个瓶子的人：你最近有没有一个不太敢说出口的小愿望？'}):'我收到啦。你愿意把这件事告诉我，已经很不容易了。';res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({choices:[{message:{content:t}}]}));});}).listen(8799,'127.0.0.1',()=>console.log('fake ai: http://127.0.0.1:8799/v1'));"
```

后台 AI 供应商填写：

- 适配器：`openai_compatible`
- Base URL：`http://127.0.0.1:8799/v1`
- 密钥变量：`LOCAL_TEST_MODEL_API_KEY`

然后分别创建并绑定三个用途模型：

- `persona_generation`
- `bottle_generation`
- `chat_reply`

清空或过期本地漂浮瓶后，再用新用户捡瓶子，就会触发 AI 补位。

### 6. 提交前验证

```bash
pnpm spec:validate
pnpm typecheck
pnpm --filter @heart-message/client build:h5
pnpm --filter @heart-message/admin build
pnpm --filter @heart-message/api build
```

当前已知构建警告：

- uni/Sass legacy JS API 警告。
- Element Plus 依赖在 Rolldown 下的 pure annotation 警告。
- 管理后台 chunk 偏大警告。

这些警告不影响当前构建退出码。

## Cloudflare 部署

Cloudflare 详细部署准备、资源清单和生产操作注意事项见 `docs/deployment/cloudflare.md`。

生产操作前必须确认目标环境、资源、命令、影响范围和回滚方式。不要在未确认时执行生产部署、远程 D1 migration 或远程资源修改。

### 1. 准备 Cloudflare 资源

需要准备：

- D1 数据库
- KV namespace
- R2 bucket
- Queues
- API Worker
- 用户端 Pages 项目
- 管理后台 Pages 项目

把实际资源 ID 填入 `apps/api/wrangler.jsonc`，不要把真实密钥写入仓库。

### 2. 配置生产环境变量

API Worker 需要配置：

- `ENVIRONMENT=production`
- `CORS_ORIGINS`
- `AUTH_TOKEN_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`
- 各 AI 供应商密钥，例如 `OPENAI_API_KEY`、`DEEPSEEK_API_KEY`

用户端 Pages 需要配置：

- `VITE_API_BASE_URL`
- `VITE_WECHAT_APP_ID`
- `VITE_WECHAT_REDIRECT_URI`

管理后台 Pages 需要配置：

- `VITE_API_BASE_URL`

### 3. 部署 API Worker

生产命令模板：

```bash
pnpm --filter @heart-message/api exec wrangler d1 migrations apply heart-message-db --remote
pnpm --filter @heart-message/api exec wrangler deploy
```

### 4. 部署用户端 Web/H5

```bash
pnpm --filter @heart-message/client build:h5
pnpm --filter @heart-message/client exec wrangler pages deploy dist/build/h5 --project-name heart-message-client
```

### 5. 部署管理后台

```bash
pnpm --filter @heart-message/admin build
pnpm --filter @heart-message/admin exec wrangler pages deploy dist --project-name heart-message-admin
```

部署后检查：

- 用户端域名可以打开。
- 管理后台域名可以打开。
- API `/health` 正常。
- 微信 OAuth 回调域名已在微信后台配置。
- 生产 CORS 只允许用户端和管理后台域名。
- R2 头像上传和 `/media/*` 读取正常。

## OpenSpec 工作流

1. 新功能先在 `openspec/changes/<change-id>/` 写 `proposal.md`、`design.md`、`tasks.md`。
2. 规格变更写到 `openspec/changes/<change-id>/specs/<capability>/spec.md`。
3. 通过评审后再实现代码。
4. 实现完成后，把稳定规格合并到 `openspec/specs/`。
