# 微信 OAuth 生产登录设计

## 用户端

- 登录页加载时，如果 URL query 中存在 `code`，直接调用 `POST /v1/auth/wechat`。
- 点击微信登录时：
  - 如果配置了 `VITE_WECHAT_APP_ID`，构造 `https://open.weixin.qq.com/connect/oauth2/authorize` 跳转。
  - `redirect_uri` 默认使用当前页面地址，也允许通过 `VITE_WECHAT_REDIRECT_URI` 显式配置。
  - `scope` 使用 `snsapi_base`，后续需要昵称头像授权时再调整。
  - 如果未配置 AppID 且是开发环境，使用 `dev-h5-code`。
  - 如果未配置 AppID 且不是开发环境，提示配置错误。

## API

- `dev-*` code 只允许在 `ENVIRONMENT = local | development | test` 时使用。
- 生产环境必须配置 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET`。
- 微信接口失败时返回结构化错误，不泄露 secret。
- 生产环境必须配置 `AUTH_TOKEN_SECRET`，本地环境才允许使用开发 fallback。

## 安全

- 仓库只保存占位 AppID 和占位 redirect URI，不保存真实微信 secret。
- 不在日志中记录完整 openid、token 或微信 secret。
