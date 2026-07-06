## ADDED Requirements

### Requirement: AI 供应商模型拉取

系统 MUST 支持管理员在 AI 模型表单中按供应商拉取可用模型列表并选择模型名。

#### Scenario: 管理员拉取供应商模型

- **WHEN** 管理员在 AI 模型表单中选择供应商并触发模型拉取
- **THEN** API MUST 使用该供应商的适配器和敏感配置中的 API Key 请求供应商模型列表
- **AND** 响应 MUST 只包含模型标识和非敏感摘要
- **AND** 响应 MUST NOT 包含 API Key 或敏感配置值。

#### Scenario: 供应商模型拉取失败

- **WHEN** 供应商未配置 baseUrl、API Key 缺失、适配器不支持拉取或供应商接口失败
- **THEN** API MUST 返回结构化错误
- **AND** 系统 MUST NOT 静默返回空列表或切换到其他供应商。

#### Scenario: 选择模型后默认展示名

- **WHEN** 管理员选择或输入模型名且展示名未被手动修改
- **THEN** 管理后台 MUST 将展示名默认填充为“用途名称 + 模型名”
- **AND** 管理员后续修改用途时，展示名仍为自动生成值的情况下 MUST 同步更新。
