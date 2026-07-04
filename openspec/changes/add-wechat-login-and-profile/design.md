# 微信登录与资料完善设计

## 登录流程

H5 在微信环境中应通过微信 OAuth 获取 `code`，再调用 `POST /v1/auth/wechat`。本地开发阶段允许使用 `dev-*` code 走占位登录，生成稳定的开发 openid，避免没有公众号配置时无法开发。

服务端收到 code 后：

1. 如果配置了 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET`，调用微信网页授权接口换取 openid/unionid。
2. 如果没有微信配置或 code 以 `dev-` 开头，进入本地开发模式，生成 `dev-openid-*`。
3. 根据 openid 查找用户，不存在则创建用户。
4. 查询用户资料，判断是否需要完善资料。
5. 使用 `AUTH_TOKEN_SECRET` 签发 HMAC token。

## Token

第一阶段使用 Worker 原生 Web Crypto 签发轻量 HMAC token，payload 包含：

- `sub`：用户 ID。
- `role`：用户角色。
- `exp`：过期时间。

后续如需要多端踢下线、设备管理或刷新 token，可以增加 `sessions` 表。

## 资料

用户资料字段包括头像、昵称、个人介绍、年龄和性别。资料保存接口必须使用 `packages/shared` 的 Zod schema 校验。

## 头像上传

第一阶段 `POST /v1/uploads/avatar` 先返回 R2 对象 key 和上传路径占位。后续做真实上传时，可以改成：

- Worker 接收文件流并写入 R2。
- 或生成受控上传 URL。

## 安全边界

- 所有 `/v1/me` 和 `/v1/uploads/avatar` 接口都必须要求登录。
- Token secret 必须通过 Cloudflare 环境变量配置，开发环境允许 fallback。
- 生产环境不能依赖 `dev-*` code 登录。
