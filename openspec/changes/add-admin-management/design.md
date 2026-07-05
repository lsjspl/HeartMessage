# 后台管理与 AI 模型配置设计

## 管理员登录

第一阶段由 D1 migration 创建默认超级管理员账号 `admin`，初始密码为 `123456`。管理员账号密码不进入 KV、`wrangler vars` 或部署 Secret。首次登录后必须立即修改默认密码。

登录成功后复用现有 HMAC token 服务签发 `role = admin` 的 token，过期时间缩短为 12 小时。后台请求通过 `Authorization: Bearer <token>` 访问。

## 鉴权边界

- `/admin/auth/login` 公开。
- `/admin/auth/me` 和其他 `/admin/*` 必须要求 `role = admin`。
- 演示请求头 `x-demo-user-id` 不得让后台接口绕过 admin 登录。

## 系统参数

系统参数保存在 D1 的 `system_settings` 表，key 为 `system-settings`。当 D1 没有值时写入并返回显式默认配置：

- 运行环境。
- CORS 白名单，允许使用 `*` 表示任意来源。
- 每日捡瓶限制。
- 每日扔瓶限制。
- AI 补位开关。
- AI 补位批量大小。
- AI 用途绑定。

保存参数时校验共享 schema，并写入操作日志。后续瓶子额度服务读取该配置，避免后台配置只是摆设。

Token 签名密钥、微信配置和 AI Key 等敏感值通过后台敏感配置接口写入 D1 的 `sensitive_configs` 表，不得继续通过 KV 或 `wrangler vars` 配置常用业务参数。日志只记录配置键和更新动作，不记录配置值。

## AI 供应商和模型

供应商和模型继续使用已有 D1 表：

- `ai_providers`：供应商名称、baseUrl、敏感配置键、启用状态。
- `ai_models`：展示名、模型名、用途、启用状态、模型参数 JSON。

后台可以新增或更新模型。业务代码不直接硬编码供应商；后续 AI 生成瓶子和聊天回复必须通过用途绑定选择模型，并通过敏感配置键读取 API Key。

## 日志

操作日志写入 `operation_logs`。日志 metadata 只记录结构化摘要，不记录 token、API key、openid、完整聊天正文或生产密钥。后台日志页展示最近日志。

## 前端

管理后台增加登录页。未登录访问后台页面时跳转登录；登录后 token 保存在 localStorage。参数页、AI 模型页和日志页都接真实 API。
