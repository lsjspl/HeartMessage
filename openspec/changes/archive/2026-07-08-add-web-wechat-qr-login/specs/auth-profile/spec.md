## MODIFIED Requirements

### Requirement: 微信登录注册

系统 MUST 支持 Web 用户使用微信扫码登录或注册，并在本地开发环境支持占位 code 登录。

#### Scenario: Web 用户扫码登录

- **WHEN** Web 用户在电脑浏览器打开登录页
- **THEN** 页面 MUST 展示微信扫码登录二维码
- **AND** 扫码确认回调后 MUST 使用 `web_qr` 模式提交微信授权 code。

#### Scenario: 新微信用户首次扫码登录

- **WHEN** 用户提交一个有效的 Web 扫码微信授权 code
- **THEN** API 创建或查找对应用户
- **AND** 返回访问 token、用户 ID 和是否需要完善资料。

#### Scenario: Web 扫码配置公开查询

- **WHEN** 用户端请求 Web 微信登录配置
- **THEN** API MUST 只返回公开 AppID、是否配置完成和是否允许本地开发登录
- **AND** 不得返回 AppSecret、token 或其他敏感值。

#### Scenario: 本地 API 允许开发登录

- **WHEN** 用户端通过本地 API 地址请求登录配置
- **THEN** API MUST 返回允许开发登录
- **AND** 用户端可以提交 `dev-` 开头的 code。

#### Scenario: Web 扫码回调 state 不一致

- **WHEN** 登录页收到微信回调 code 但 state 与本地保存值不一致
- **THEN** 用户端 MUST 拒绝登录
- **AND** 显示明确错误。

#### Scenario: 生产环境缺少 Web 微信配置

- **WHEN** 生产环境没有配置 `WECHAT_WEB_APP_ID` 或 `WECHAT_WEB_APP_SECRET`
- **THEN** API MUST 返回明确配置错误
- **AND** 不得进入开发占位登录。
