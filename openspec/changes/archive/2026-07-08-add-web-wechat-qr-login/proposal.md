# Web 微信扫码登录

## Purpose

当前用户端登录页沿用 H5 微信网页授权入口，适合微信内网页，不适合电脑浏览器访问 Web 版。Web 版需要在登录页展示微信扫码登录二维码，让用户用手机微信确认后回到同一登录页，并复用现有用户创建、Token 会话和资料完善流程。

## What Changes

- 用户端登录页改为 Web 扫码登录入口，使用微信开放平台网站应用二维码登录。
- 用户端扫码回调拿到 `code` 后调用现有登录接口，并标记登录模式为 Web 扫码。
- API 按 Web 扫码登录模式使用网站应用 AppID 和 AppSecret 换取微信身份。
- 后台敏感配置列表增加网站应用 AppID 和 AppSecret 配置项。
- 本地开发环境缺少微信配置时仍允许开发 code 登录，生产环境缺少配置时返回明确错误。

## Impact

- 影响 `apps/client` 登录页、认证服务和会话 store。
- 影响 `apps/api` 微信 code 换身份服务、认证路由和敏感配置定义。
- 影响 `packages/shared` 认证 DTO。
- 不执行生产环境操作，不写入真实 AppID、AppSecret 或 token。
