## MODIFIED Requirements

### Requirement: 微信登录注册

系统 MUST 支持 Web 用户通过微信扫码或 Google OAuth 登录或注册，并在本地开发环境支持占位 code 登录。

#### Scenario: Web 用户选择登录方式

- **WHEN** Web 用户在电脑浏览器打开登录页
- **THEN** 页面 MUST 展示 Google 登录入口和微信扫码登录入口
- **AND** 缺少任一登录配置时 MUST 明确展示该方式不可用。

#### Scenario: Google 用户首次登录

- **WHEN** 用户提交一个有效的 Google 授权 code
- **THEN** API MUST 使用 Google token endpoint 和 userinfo endpoint 获取稳定用户标识
- **AND** 创建或查找对应用户
- **AND** 返回访问 token、用户 ID、登录 provider 和是否需要完善资料。

#### Scenario: Google 登录配置公开查询

- **WHEN** 用户端请求 Google 登录配置
- **THEN** API MUST 只返回公开 Client ID、是否配置完成和是否允许本地开发登录
- **AND** 不得返回 Client Secret、token 或其他敏感值。

#### Scenario: Google 回调 state 不一致

- **WHEN** 登录页收到 Google 回调 code 但 state 与本地保存值不一致
- **THEN** 用户端 MUST 拒绝登录
- **AND** 显示明确错误。

#### Scenario: 生产环境缺少 Google 配置

- **WHEN** 生产环境没有配置 `GOOGLE_OAUTH_CLIENT_ID` 或 `GOOGLE_OAUTH_CLIENT_SECRET`
- **THEN** API MUST 返回明确配置错误
- **AND** 不得进入开发占位登录。

#### Scenario: 既有微信用户迁移身份映射

- **WHEN** 数据库执行 Google 登录迁移
- **THEN** 系统 MUST 为已有微信用户创建 `wechat` 登录身份记录
- **AND** 不得改变用户 ID、资料、瓶子、聊天和后台管理关系。
