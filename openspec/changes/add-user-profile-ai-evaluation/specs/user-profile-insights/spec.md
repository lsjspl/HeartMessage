## ADDED Requirements

### Requirement: 用户画像结构

系统 MUST 为普通用户维护 AI 画像，用于生成更匹配用户偏好的 AI 人格。

#### Scenario: 用户画像评估成功

- **WHEN** 系统完成一次用户画像评估
- **THEN** 系统 MUST 保存摘要、兴趣标签、偏好话题、避开话题、沟通风格、情绪需求、偏好人格特征和陪伴期待
- **AND** 记录评估模型 ID、评估时间和状态。

#### Scenario: 用户画像评估失败

- **WHEN** 画像评估模型不可用或返回格式不正确
- **THEN** 系统 MUST 将画像状态标记为 `failed`
- **AND** 保存脱敏错误摘要
- **AND** 不得假装评估成功。

### Requirement: 用户画像定时评估

系统 MUST 定时评估到期用户画像。

#### Scenario: 定时任务触发

- **WHEN** Worker scheduled 事件触发
- **THEN** 系统 MUST 按系统参数选择未评估、失败或超过间隔的 active 普通用户
- **AND** 使用 `user_profile_evaluation` 用途模型批量评估
- **AND** 每批数量不得超过后台配置的 batchSize。

### Requirement: 用户画像独立模型

系统 MUST 使用后台绑定的 `user_profile_evaluation` 独立用途模型生成用户画像。

#### Scenario: 画像评估模型未配置

- **WHEN** 系统需要评估用户画像但用途模型未配置
- **THEN** 系统 MUST 显式失败或记录 failed 状态
- **AND** 不得静默切换到人格生成、聊天回复或内容审核模型。

### Requirement: AI 人格按用户画像生成

系统 MUST 在 AI 补位人格生成时使用目标用户画像。

#### Scenario: 用户触发 AI 补位

- **WHEN** 用户捞瓶且没有真人瓶子可用
- **THEN** 系统 MUST 读取该用户最新可用画像
- **AND** 使用画像信息生成更符合用户偏好的人格
- **AND** 生成的定制 AI 瓶子 MUST 只允许该目标用户捞取。

### Requirement: 后台查看和触发画像评估

系统 MUST 允许管理员查看用户画像状态并手动触发单个用户评估。

#### Scenario: 管理员查看画像列表

- **WHEN** 管理员打开用户画像页面
- **THEN** API MUST 返回用户昵称、画像状态、摘要、标签、评估时间和错误摘要。

#### Scenario: 管理员手动评估用户画像

- **WHEN** 管理员请求评估某个用户画像
- **THEN** 系统 MUST 使用 `user_profile_evaluation` 模型立即评估该用户
- **AND** 写入脱敏操作日志。
