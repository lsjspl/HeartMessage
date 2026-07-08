# Web Google 登录设计

## 用户端

- 登录页改成多登录方式布局：
  - Google 登录作为按钮入口，点击后跳转 Google OAuth 授权页。
  - 微信登录保留扫码二维码区域。
  - 配置缺失时显示明确错误，本地 API 允许开发登录时显示对应开发登录按钮。
- 登录页加载时同时请求微信和 Google 登录配置。
- Google 授权回调与微信共用登录页，根据本地保存的 state 判断 provider。
- Google 登录发起时生成随机 state，保存到本地存储，并把 state 带到 Google 授权 URL。
- Google 回调时必须校验 state 一致，再调用 `POST /v1/auth/google`。

## API

- `GET /v1/auth/google/config` 返回：
  - 是否配置完成。
  - 公开的 Client ID。
  - 是否允许本地开发登录。
- `POST /v1/auth/google` 接收 `code` 和 `redirectUri`：
  - 本地开发登录使用 `dev-` code 生成稳定 Google 开发身份。
  - 正式登录使用后台敏感配置中的 `GOOGLE_OAUTH_CLIENT_ID` 和 `GOOGLE_OAUTH_CLIENT_SECRET`。
  - API 调用 Google token endpoint 换取 access token，再调用 userinfo endpoint 获取 `sub`。
  - 缺少配置或 Google 返回错误时返回结构化错误。
- 微信和 Google 都通过通用登录身份表查找或创建用户。

## 数据库

- `users.wechat_open_id` 改为可空，保留唯一索引以兼容旧微信查询。
- 新增 `user_auth_identities`：
  - `id`
  - `user_id`
  - `provider`
  - `provider_user_id`
  - `email`
  - `display_name`
  - `avatar_url`
  - `created_at`
  - `updated_at`
- 对 `(provider, provider_user_id)` 建唯一索引。
- migration 为已有微信用户补写 `wechat` 身份记录。

## 配置

- 后台敏感配置新增：
  - `GOOGLE_OAUTH_CLIENT_ID`
  - `GOOGLE_OAUTH_CLIENT_SECRET`
- 前端不写入真实 Client Secret，也不通过 Pages 变量维护 Google 登录参数。
