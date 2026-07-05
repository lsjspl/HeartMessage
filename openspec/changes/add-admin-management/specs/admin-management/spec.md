## ADDED Requirements

### Requirement: 管理员登录

系统 MUST 提供后台管理员登录能力，并返回仅允许访问后台接口的 admin token。

#### Scenario: 管理员使用正确账号密码登录

- **WHEN** 管理员提交正确的账号和密码
- **THEN** API 返回 admin token、管理员名称和过期时间
- **AND** token 的角色 MUST 为 `admin`。

#### Scenario: 管理员提交错误密码

- **WHEN** 管理员提交错误账号或密码
- **THEN** API MUST 返回 401 错误
- **AND** 不得泄露哪个字段错误。

### Requirement: 后台接口鉴权

系统 MUST 保护除登录外的所有 `/admin/*` 接口，只有 admin token 可以访问。

#### Scenario: 未登录访问后台接口

- **WHEN** 请求没有携带有效 admin token
- **THEN** API MUST 返回 401 或 403 错误。

#### Scenario: 普通用户访问后台接口

- **WHEN** 普通用户 token 请求后台接口
- **THEN** API MUST 返回 403 错误。

### Requirement: 系统参数管理

系统 MUST 允许管理员查看和保存系统参数，包括每日额度、AI 补位开关、AI 生成数量和 AI 用途绑定。

#### Scenario: 管理员查看系统参数

- **WHEN** 管理员请求系统参数
- **THEN** API 返回当前 KV 参数或显式默认参数。

#### Scenario: 管理员保存系统参数

- **WHEN** 管理员提交合法系统参数
- **THEN** API 将参数保存到 KV
- **AND** 写入操作日志。

### Requirement: AI 模型管理

系统 MUST 支持管理员维护 AI 供应商和模型，且模型必须按用途配置。

#### Scenario: 管理员查看模型列表

- **WHEN** 管理员请求 AI 模型列表
- **THEN** API 返回供应商、模型名、用途、启用状态和配置摘要。

#### Scenario: 管理员保存模型

- **WHEN** 管理员提交合法模型配置
- **THEN** API 新增或更新 D1 中的供应商和模型记录
- **AND** 不得保存真实 API Key，只保存密钥环境变量名。

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
