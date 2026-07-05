## ADDED Requirements

### Requirement: AI 用途模型运行时选择

系统 MUST 按后台配置的用途绑定选择 AI 模型，业务代码不得写死具体供应商。

#### Scenario: 用途已绑定可用模型

- **WHEN** 业务请求 `persona_generation`、`bottle_generation` 或 `chat_reply` 用途的模型
- **THEN** 系统 MUST 读取系统参数中的用途绑定
- **AND** 查询 D1 中启用的模型和启用的供应商
- **AND** 从供应商的密钥环境变量名读取真实 API Key。

#### Scenario: 用途未正确配置

- **WHEN** 用途未绑定模型、模型禁用、供应商禁用或密钥缺失
- **THEN** 系统 MUST 返回明确错误
- **AND** 不得静默切换到其他模型。

### Requirement: AI 补位瓶子生成

系统 MUST 在没有可捞瓶子且 AI 补位开启时生成 AI 人格和 AI 瓶子，并让用户捞到该瓶子。

#### Scenario: 无瓶且 AI 补位开启

- **WHEN** 用户执行捞瓶且没有可用漂浮瓶
- **THEN** 系统 MUST 使用 `persona_generation` 生成 AI 人格
- **AND** 使用 `bottle_generation` 生成符合该人格的瓶子内容
- **AND** 将人格和瓶子保存到 D1
- **AND** 继续完成本次捞瓶并扣减捞瓶额度。

#### Scenario: 无瓶但 AI 补位关闭

- **WHEN** 用户执行捞瓶且没有可用漂浮瓶
- **AND** 系统参数中 AI 补位关闭
- **THEN** 系统 MUST 返回 `NO_BOTTLE_AVAILABLE`。

### Requirement: AI 陪伴聊天回复

系统 MUST 在用户与 AI 瓶子开启或继续聊天时生成 AI 回复。

#### Scenario: 用户回复 AI 瓶子

- **WHEN** 用户回复捡到的 AI 瓶子
- **THEN** 系统 MUST 创建或复用会话
- **AND** 写入用户消息
- **AND** 使用 `chat_reply` 模型生成 AI 回复
- **AND** 写入 `sender_type = ai` 的消息。

#### Scenario: 用户继续 AI 会话

- **WHEN** 用户在 AI 会话中发送消息
- **THEN** 系统 MUST 写入用户消息
- **AND** 使用同一 AI 人格的设定生成 AI 回复
- **AND** 返回后续查询可看到用户消息和 AI 消息。

### Requirement: AI 日志脱敏

系统 MUST 记录 AI 瓶子生成和 AI 回复事件，并避免记录敏感内容。

#### Scenario: AI 生成成功

- **WHEN** 系统生成 AI 瓶子或 AI 回复
- **THEN** 操作日志 MUST 记录模型 ID、人格 ID、瓶子 ID 或会话 ID
- **AND** 不得记录 API Key、完整 openid、完整瓶子正文或完整聊天正文。
