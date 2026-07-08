# auth-profile Specification

## Purpose
TBD - created by archiving change add-wechat-login-and-profile. Update Purpose after archive.
## Requirements
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

#### Scenario: 生产环境缺少 token secret

- **WHEN** 生产环境没有在后台敏感配置中配置 `AUTH_TOKEN_SECRET`
- **THEN** API MUST 拒绝签发或校验 token
- **AND** 不得使用本地开发 fallback secret。

### Requirement: 头像文件上传到 R2

系统 MUST 支持登录用户把头像图片上传到 Cloudflare R2，并返回可保存到资料中的公开访问地址。

#### Scenario: 用户上传合法头像

- **WHEN** 登录用户申请头像上传并提交合法图片文件
- **THEN** API MUST 将文件写入 R2 的用户头像前缀
- **AND** 返回对象 key 和公开访问地址。

#### Scenario: 用户上传非法头像

- **WHEN** 用户上传非图片类型、超出大小限制或不属于自己前缀的对象 key
- **THEN** API MUST 拒绝请求并返回结构化错误。

### Requirement: 头像公开读取

系统 MUST 提供头像媒体读取路由，用于展示 R2 中的头像。

#### Scenario: 客户端读取已上传头像

- **WHEN** 客户端请求头像公开访问地址
- **THEN** API MUST 从 R2 读取对象
- **AND** 返回正确内容类型。

### Requirement: 资料页选择头像和性别

用户端资料页 MUST 支持选择头像和性别，并在保存资料时提交头像地址、昵称、介绍、年龄和性别。

#### Scenario: 用户完善资料

- **WHEN** 用户选择头像、填写资料并选择性别
- **THEN** 客户端 MUST 先成功上传头像
- **AND** 保存资料时提交 `avatarUrl` 和 `gender`。

### Requirement: 用户默认头像库

用户端资料完善页 MUST 提供内置默认头像库，让用户不用上传本地图片也能选择头像并保存资料。

#### Scenario: 用户选择默认头像

- **WHEN** 用户在资料完善页点击任一默认头像
- **THEN** 客户端 MUST 将该头像地址设置为当前资料头像
- **AND** 保存资料时通过 `avatarUrl` 提交该头像地址。

#### Scenario: 默认头像按类别展示

- **WHEN** 用户查看资料完善页头像区域
- **THEN** 客户端 MUST 展示共 50 个默认头像
- **AND** 默认头像 MUST 覆盖男生、女生、中性风格和动物动漫类别
- **AND** 当前选择的头像 MUST 有明确选中态。

#### Scenario: 默认头像资产归档

- **WHEN** 项目保存默认头像资产
- **THEN** 原始 PNG MUST 保存到 `docs/img/avatars/originals`
- **AND** 用户端引用的压缩头像 MUST 保存到 `apps/client/src/static/avatars/defaults`
- **AND** 压缩头像单张目标大小 MUST 不超过 200KB。

#### Scenario: 用户上传自定义头像

- **WHEN** 用户通过上传按钮成功上传自定义头像
- **THEN** 客户端 MUST 使用上传后的公开地址覆盖当前头像选择
- **AND** 默认头像库仍然可继续选择。

### Requirement: 展示第三方认证身份资料

系统 MUST 在登录会话和当前用户接口中返回第三方认证身份资料，用于用户端预填资料。

#### Scenario: Google 登录返回身份资料

- **WHEN** 用户使用 Google OAuth 登录成功
- **THEN** API MUST 返回 Google 邮箱、显示名称和头像地址
- **AND** 用户端资料页 MUST 使用显示名称和头像预填资料
- **AND** 用户端资料页 MUST 展示邮箱作为只读参考信息。

#### Scenario: 用户刷新资料页

- **WHEN** 已登录用户刷新资料完善页
- **THEN** 客户端 MUST 能通过当前用户接口重新获取认证身份资料
- **AND** 在用户资料未完善时继续预填认证名称和头像。

