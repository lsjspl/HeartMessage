## ADDED Requirements

### Requirement: 用户发言发送前审核

系统 MUST 在用户发言写入瓶子、会话或消息前完成内容安全审核。

#### Scenario: 用户扔出合规瓶子

- **WHEN** 已登录用户提交不包含违规内容的瓶子正文
- **THEN** 系统 MUST 使用 `content_moderation` 用途模型完成审核
- **AND** 审核通过后才写入瓶子并消耗扔瓶额度。

#### Scenario: 用户发送违规内容

- **WHEN** 用户提交广告、色情或联系方式内容
- **THEN** 系统 MUST 拒绝发送
- **AND** 返回结构化错误码 `CONTENT_BLOCKED`
- **AND** 不得写入瓶子、会话或消息。

### Requirement: 联系方式硬拦截

系统 MUST 对明显微信、QQ、手机号联系方式执行硬拦截。

#### Scenario: 内容包含手机号

- **WHEN** 用户发言包含明显手机号
- **THEN** 系统 MUST 拒绝发送
- **AND** 拦截类别 MUST 包含 `contact_info`
- **AND** 不得依赖模型放行。

#### Scenario: 内容包含微信或 QQ 联系方式

- **WHEN** 用户发言包含明显微信、QQ、VX、WX 或扣扣联系方式
- **THEN** 系统 MUST 拒绝发送
- **AND** 返回用户可理解的中文错误。

### Requirement: 内容审核独立模型

系统 MUST 使用后台绑定的 `content_moderation` 独立用途模型进行语义审核。

#### Scenario: 内容审核模型未配置

- **WHEN** 内容需要语义审核但 `content_moderation` 未绑定可用模型
- **THEN** 系统 MUST 返回明确错误
- **AND** 不得静默放行或切换其他用途模型。

### Requirement: 内容审核日志脱敏

系统 MUST 记录内容拦截事件并保护用户隐私。

#### Scenario: 内容被拦截

- **WHEN** 用户发言被内容安全审核拦截
- **THEN** 操作日志 MUST 记录来源、类别、模型 ID 和文本长度
- **AND** 不得记录完整瓶子正文或完整聊天正文。

### Requirement: 内容审核后台管理

系统 MUST 提供后台内容审核管理页面和接口，用于查看、筛选和处理被拦截的用户发言。

#### Scenario: 管理员查看拦截列表

- **WHEN** 管理员进入内容审核页面
- **THEN** 页面 MUST 显示分页列表
- **AND** 列表 MUST 包含序号、事件 ID、用户、来源、类别、原因、脱敏预览、状态和时间。

#### Scenario: 管理员筛选拦截事件

- **WHEN** 管理员按关键词、来源、类别或处理状态筛选
- **THEN** API MUST 返回匹配的分页结果。

#### Scenario: 管理员处理拦截事件

- **WHEN** 管理员将事件标记为确认违规、误判或待处理
- **THEN** API MUST 保存处理状态、处理人、处理时间和备注
- **AND** 写入操作日志。

#### Scenario: 管理员查看拦截详情

- **WHEN** 管理员打开拦截事件详情
- **THEN** 页面 MUST 使用弹框展示详情
- **AND** 不得展示未脱敏的完整联系方式或完整聊天正文。
