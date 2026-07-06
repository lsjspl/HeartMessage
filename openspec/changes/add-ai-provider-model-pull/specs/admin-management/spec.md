## ADDED Requirements

### Requirement: AI 供应商模型拉取

系统 MUST 支持管理员在 AI 模型表单中按供应商拉取可用模型列表并选择模型名。

#### Scenario: 管理员拉取供应商模型

- **WHEN** 管理员在 AI 模型表单中选择供应商并触发模型拉取
- **THEN** API MUST 使用该供应商的适配器和敏感配置中的 API Key 请求供应商模型列表
- **AND** 响应 MUST 只包含模型标识和非敏感摘要
- **AND** 响应 MUST NOT 包含 API Key 或敏感配置值。

#### Scenario: 管理员保存供应商 API Key

- **WHEN** 管理员在供应商表单中填写 API Key 并保存
- **THEN** 系统 MUST 将 API Key 写入敏感配置
- **AND** 供应商列表、编辑表单、操作日志和错误响应 MUST NOT 回显 API Key 明文或片段。

#### Scenario: 管理员选择敏感配置键

- **WHEN** 管理员在供应商表单中选择 API Key 配置
- **THEN** 管理后台 MUST 通过分组下拉展示可选敏感配置键
- **AND** 管理员 MUST NOT 通过普通文本输入框手动录入敏感配置键。

#### Scenario: 管理员维护敏感配置分组

- **WHEN** 管理员新增或编辑敏感配置
- **THEN** 系统 MUST 支持维护配置名称和分组
- **AND** 需要选择敏感配置键的表单 MUST 按分组展示这些配置。

#### Scenario: 供应商模型拉取失败

- **WHEN** 供应商未配置 baseUrl、API Key 缺失、适配器不支持拉取或供应商接口失败
- **THEN** API MUST 返回结构化错误
- **AND** 系统 MUST NOT 静默返回空列表或切换到其他供应商。

#### Scenario: 选择模型后默认展示名

- **WHEN** 管理员选择或输入模型名且展示名未被手动修改
- **THEN** 管理后台 MUST 将展示名默认填充为“用途名称 + 模型名”
- **AND** 管理员后续修改用途时，展示名仍为自动生成值的情况下 MUST 同步更新。
