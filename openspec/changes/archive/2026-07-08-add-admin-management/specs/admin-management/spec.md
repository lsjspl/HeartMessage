## ADDED Requirements

### Requirement: 管理员登录

系统 MUST 提供后台管理员登录能力，并返回仅允许访问后台接口的 admin token。

#### Scenario: 数据库迁移创建默认管理员

- **WHEN** 部署数据库 migration
- **THEN** 系统 MUST 创建默认超级管理员账号 `admin`
- **AND** 默认密码 MUST 为 `123456`
- **AND** 默认管理员不得依赖 KV、`wrangler vars` 或部署 Secret 创建。

#### Scenario: 管理员使用正确账号密码登录

- **WHEN** 管理员提交正确的账号和密码
- **THEN** API 返回 admin token、管理员名称和过期时间
- **AND** token 的角色 MUST 为 `admin`。

#### Scenario: 管理员提交错误密码

- **WHEN** 管理员提交错误账号或密码
- **THEN** API MUST 返回 401 错误
- **AND** 不得泄露哪个字段错误。

### Requirement: 管理员账号管理

系统 MUST 支持超级管理员维护后台管理员账号。

#### Scenario: 超级管理员创建管理员

- **WHEN** 超级管理员提交账号、名称、角色和初始密码
- **THEN** API MUST 创建管理员账号
- **AND** 密码 MUST 以不可逆哈希保存
- **AND** 写入操作日志。

#### Scenario: 超级管理员修改管理员

- **WHEN** 超级管理员修改管理员名称、角色或状态
- **THEN** API MUST 更新管理员账号
- **AND** 不得允许超级管理员删除或禁用自己的账号。

#### Scenario: 超级管理员重置密码

- **WHEN** 超级管理员为管理员设置新密码
- **THEN** API MUST 更新密码哈希
- **AND** 不得在日志中记录明文密码。

#### Scenario: 普通管理员访问管理员管理

- **WHEN** 普通管理员请求管理员账号管理接口
- **THEN** API MUST 返回 403 错误。

### Requirement: 管理员修改自己的密码

系统 MUST 允许已登录管理员修改自己的密码。

#### Scenario: 管理员提交正确旧密码

- **WHEN** 管理员提交正确旧密码和合法新密码
- **THEN** API MUST 更新该管理员密码哈希
- **AND** 后续登录 MUST 使用新密码。

#### Scenario: 管理员提交错误旧密码

- **WHEN** 管理员提交错误旧密码
- **THEN** API MUST 返回 401 错误
- **AND** 不得修改密码。

### Requirement: 后台接口鉴权

系统 MUST 保护除登录外的所有 `/admin/*` 接口，只有 admin token 可以访问。

#### Scenario: 未登录访问后台接口

- **WHEN** 请求没有携带有效 admin token
- **THEN** API MUST 返回 401 或 403 错误。

#### Scenario: 普通用户访问后台接口

- **WHEN** 普通用户 token 请求后台接口
- **THEN** API MUST 返回 403 错误。

### Requirement: 系统参数管理

系统 MUST 允许管理员查看和保存系统参数，包括运行环境、CORS 白名单、每日额度、AI 补位开关、AI 生成数量和 AI 用途绑定。

#### Scenario: 管理员查看系统参数

- **WHEN** 管理员请求系统参数
- **THEN** API 返回当前 D1 参数或显式默认参数。

#### Scenario: 管理员保存系统参数

- **WHEN** 管理员提交合法系统参数
- **THEN** API 将参数保存到 D1
- **AND** 写入操作日志。

#### Scenario: 管理员修改访问白名单

- **WHEN** 管理员在系统参数页修改 CORS 白名单
- **THEN** 后续跨域请求 MUST 使用后台保存的白名单判断
- **AND** 当后台保存 `*` 时 MUST 允许任意请求来源
- **AND** 不得继续读取 `wrangler vars` 中的 CORS 业务配置。

### Requirement: 敏感配置管理

系统 MUST 提供后台敏感配置管理能力，用于维护 Token 密钥、微信配置和 AI Key 等敏感值。

#### Scenario: 管理员查看敏感配置

- **WHEN** 管理员进入敏感配置页面
- **THEN** 页面 MUST 显示配置键、名称、来源、状态、脱敏预览和更新时间
- **AND** 不得回显完整配置值。

#### Scenario: 管理员保存敏感配置

- **WHEN** 管理员提交配置键和配置值
- **THEN** API MUST 保存到后端系统配置
- **AND** 日志 MUST 只记录配置键和更新动作，不记录配置值。

#### Scenario: 业务读取敏感配置

- **WHEN** 登录 token、微信登录或 AI 调用需要密钥
- **THEN** 后端 MUST 从敏感配置读取
- **AND** 敏感配置 MUST 存储在 D1
- **AND** 不得继续依赖 KV 或 `wrangler vars` 配置常用业务参数。

### Requirement: AI 模型管理

系统 MUST 支持管理员维护 AI 供应商和模型，且模型必须按用途配置。

#### Scenario: 管理员查看模型列表

- **WHEN** 管理员请求 AI 模型列表
- **THEN** API 返回供应商、模型名、用途、启用状态和配置摘要。

#### Scenario: 管理员保存模型

- **WHEN** 管理员提交合法模型配置
- **THEN** API 新增或更新 D1 中的供应商和模型记录
- **AND** 供应商 MUST 保存敏感配置键，真实 API Key 通过敏感配置维护。

### Requirement: AI 用途绑定

系统 MUST 支持管理员配置人格生成、瓶子生成、聊天回复和内容审核分别使用哪个模型。

#### Scenario: 管理员保存用途绑定

- **WHEN** 管理员选择每个用途对应的模型 ID 并保存
- **THEN** API 将绑定保存到系统参数
- **AND** 后续 AI 业务可按用途读取绑定。

### Requirement: 日志查询

系统 MUST 提供后台日志查询能力，用于查看管理员操作、AI 配置变更和关键业务事件。

#### Scenario: 管理员查看日志

- **WHEN** 管理员请求日志列表
- **THEN** API 返回最近日志的动作、目标、摘要和时间
- **AND** 不返回 token、API Key、完整 openid 或完整聊天正文。
