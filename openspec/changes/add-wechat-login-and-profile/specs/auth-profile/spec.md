## ADDED Requirements

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

### Requirement: 当前用户查询

系统 MUST 提供当前登录用户查询能力，用于客户端恢复登录态和判断资料是否完整。

#### Scenario: 用户携带有效 token 查询自己

- **WHEN** 客户端请求 `GET /v1/me` 并携带有效 token
- **THEN** API 返回用户基础信息、角色、状态和资料信息
- **AND** 返回 `needsProfile` 标记。

### Requirement: 个人资料完善

系统 MUST 允许登录用户创建或更新昵称、头像、个人介绍、年龄和性别。

#### Scenario: 用户保存合法资料

- **WHEN** 用户提交合法的个人资料
- **THEN** API 保存资料到 D1
- **AND** 返回更新后的资料。

#### Scenario: 用户提交非法资料

- **WHEN** 用户提交空昵称、超长介绍或非法年龄
- **THEN** API 拒绝请求并返回校验错误。

### Requirement: 头像上传入口

系统 MUST 提供头像上传申请接口，为 R2 存储生成受控对象 key。

#### Scenario: 用户申请头像上传

- **WHEN** 登录用户提交头像文件名和内容类型
- **THEN** API 返回头像对象 key 和后续上传入口信息。

### Requirement: 登录保护

系统 MUST 保护当前用户和上传相关接口，未登录用户不能访问。

#### Scenario: 未登录用户访问个人资料接口

- **WHEN** 请求缺少有效 token
- **THEN** API 返回 401 错误。
