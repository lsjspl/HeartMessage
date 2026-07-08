# Web 微信扫码登录设计

## 用户端

- 登录页进入时先读取 URL query：
  - 如果存在 `code`，校验 `state` 后调用 `POST /v1/auth/wechat`。
  - 请求体传入 `mode = "web_qr"`，用于 API 选择网站应用配置。
- 登录页加载时请求 `GET /v1/auth/wechat/web-config`：
  - 已配置网站应用 AppID 时，加载微信官方二维码脚本并渲染扫码区域。
  - 未配置且 API 返回允许本地开发登录时，显示开发登录按钮并提交 `dev-web-code`。
  - 未配置且不是开发环境时，明确提示微信扫码登录配置未完成。
- 扫码二维码使用当前登录页作为回调地址，去掉旧的 `code`、`state`、`appid` 等登录回调参数，避免重复登录。
- `state` 保存在本地存储中，回调时必须一致；不一致则拒绝登录。

## API

- `WechatLoginSchema` 增加登录模式字段，当前 Web 版使用 `web_qr`。
- `GET /v1/auth/wechat/web-config` 返回公开的 Web 微信 AppID 配置状态，不返回 AppSecret。
- `POST /v1/auth/wechat` 根据 `mode` 选择微信配置：
  - `web_qr` 使用后台敏感配置中的 `WECHAT_WEB_APP_ID` 和 `WECHAT_WEB_APP_SECRET`。
  - 后台系统参数为本地环境，或 API 请求明确来自 `localhost`、`127.0.0.1`、`::1` 时，允许 `dev-*` code 走稳定开发 openid。
  - 生产环境缺少网站应用配置时返回结构化错误。

## 配置

- 后台敏感配置新增：
  - `WECHAT_WEB_APP_ID`：微信开放平台网站应用 AppID。
  - `WECHAT_WEB_APP_SECRET`：微信开放平台网站应用 AppSecret。
- 前端不新增真实业务密钥，也不把 AppSecret 写进 Pages 配置。
