## MODIFIED Requirements

### Requirement: 微信登录注册

系统 MUST 支持用户使用微信网页授权 code 登录或注册，并在本地开发环境支持占位 code 登录。

#### Scenario: 新微信用户首次登录

- **WHEN** 用户提交一个有效的微信授权 code
- **THEN** API 创建或查找对应用户
- **AND** 返回访问 token、用户 ID 和是否需要完善资料。

#### Scenario: 本地开发占位登录

- **WHEN** 开发环境提交 `dev-` 开头的 code
- **THEN** API 使用该 code 生成稳定的开发 openid
- **AND** 返回与真实微信登录一致的响应结构。

#### Scenario: 生产环境提交开发 code

- **WHEN** 生产环境提交 `dev-` 开头的 code
- **THEN** API MUST 拒绝请求
- **AND** 不得创建开发 openid 用户。

#### Scenario: 生产环境缺少微信配置

- **WHEN** 生产环境没有配置微信 AppID 或 AppSecret
- **THEN** API MUST 返回明确配置错误
- **AND** 不得进入开发占位登录。

### Requirement: 登录保护

系统 MUST 保护当前用户和上传相关接口，未登录用户不能访问。

#### Scenario: 未登录用户访问个人资料接口

- **WHEN** 请求缺少有效 token
- **THEN** API 返回 401 错误。

#### Scenario: 生产环境缺少 token secret

- **WHEN** 生产环境没有在后台敏感配置中配置 `AUTH_TOKEN_SECRET`
- **THEN** API MUST 拒绝签发或校验 token
- **AND** 不得使用本地开发 fallback secret。
