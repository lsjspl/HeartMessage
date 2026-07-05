# 微信 OAuth 生产登录收口

## Purpose

当前用户端登录页固定使用本地开发 code，API 在缺少微信配置时也会生成开发 openid。这样方便本地开发，但不满足生产环境微信登录注册要求，也违反“生产环境不能依赖 dev code 登录”的安全边界。需要补齐 H5 微信 OAuth 跳转入口，并限制开发占位登录只能在本地环境使用。

## What Changes

- 用户端登录页支持读取微信 OAuth 回调 `code` 并完成登录。
- 用户端在配置微信 AppID 时跳转微信网页授权地址。
- 用户端仅在开发环境缺少 AppID 时使用 `dev-*` code。
- API 仅允许本地环境使用 `dev-*` code 或缺配置占位登录。
- 生产环境缺少微信配置时返回明确错误。
- Token secret 仅允许本地环境使用开发 fallback，生产环境必须配置 `AUTH_TOKEN_SECRET`。

## Impact

- 影响用户端登录页和 Pages 配置。
- 影响 API 微信 code 换 openid 服务和 token 服务。
- 不执行生产环境操作，不写入真实微信密钥。
