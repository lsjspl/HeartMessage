## ADDED Requirements

### Requirement: 内容安全分类策略配置

系统 MUST 支持按内容安全分类配置启用状态、默认拦截程度和来源覆盖策略。

#### Scenario: 系统生成默认内容安全策略

- **WHEN** 系统参数中没有内容安全策略
- **THEN** API MUST 写入并返回显式默认策略
- **AND** 默认策略 MUST 包含 `contact_info`、`advertisement`、`sexual`、`abuse` 和 `illegal` 分类
- **AND** 每个分类 MUST 有独立启用开关和拦截程度。

#### Scenario: 管理员关闭某个审核分类

- **WHEN** 管理员将 `advertisement` 分类关闭并保存
- **THEN** 后续内容审核决策 MUST 忽略广告类风险发现
- **AND** 不得影响联系方式、色情低俗或其他已启用分类。

#### Scenario: 管理员调整分类拦截程度

- **WHEN** 管理员将 `sexual` 的拦截程度从 `medium` 改为 `high`
- **THEN** 后续 `low` 和 `medium` 色情低俗风险 MUST 不触发拦截
- **AND** `high` 色情低俗风险 MUST 继续拦截。

#### Scenario: 不同来源使用不同拦截程度

- **WHEN** `bottle_throw` 的 `sexual` 拦截程度为 `medium`
- **AND** `chat_message` 的 `sexual` 拦截程度为 `high`
- **THEN** 同样的 `medium` 色情低俗风险在扔瓶入口 MUST 被拦截
- **AND** 在聊天入口 MUST 按聊天来源策略放行。

### Requirement: 内容审核风险程度判定

系统 MUST 将 AI 审核模型输出解释为风险发现列表，并由平台策略决定是否拦截。

#### Scenario: 模型返回多个风险发现

- **WHEN** 模型返回广告 `medium` 和联系方式 `low`
- **THEN** 系统 MUST 分别按两个分类的有效策略判断
- **AND** 只要任一启用分类达到拦截程度就拒绝发送。

#### Scenario: 模型返回低风险内容

- **WHEN** 模型仅返回未达到当前分类拦截程度的低风险发现
- **THEN** 系统 MUST 允许发送
- **AND** 默认不得写入拦截事件。

#### Scenario: 模型返回非法格式

- **WHEN** 内容审核模型返回无法解析的 JSON、未知分类或非法程度
- **THEN** 系统 MUST 返回明确审核失败错误
- **AND** 不得静默放行或切换其他用途模型。

### Requirement: 内容审核策略后台管理

系统 MUST 提供后台接口和页面维护内容安全策略。

#### Scenario: 管理员查看内容安全策略

- **WHEN** 管理员打开内容审核策略页面
- **THEN** 页面 MUST 展示全局开关、分类开关、拦截程度和来源覆盖配置。

#### Scenario: 管理员保存内容安全策略

- **WHEN** 管理员提交合法内容安全策略
- **THEN** API MUST 将策略保存到后台系统参数
- **AND** 写入操作日志
- **AND** 日志不得包含用户发言正文或敏感配置值。

### Requirement: 内容审核策略审计

系统 MUST 在内容审核事件中记录触发拦截的风险程度、决策来源和策略摘要。

#### Scenario: 内容被策略拦截

- **WHEN** 用户发言因内容安全策略被拦截
- **THEN** 事件 MUST 记录最高风险程度、风险发现列表、决策来源和策略版本
- **AND** 不得记录完整瓶子正文或完整聊天正文。

#### Scenario: 历史事件展示

- **WHEN** 管理员查看旧版本内容审核事件
- **THEN** API MUST 使用兼容摘要展示历史类别和原因
- **AND** 不得伪造新策略字段为已执行的新链路结果。

## MODIFIED Requirements

### Requirement: 用户发言发送前审核

系统 MUST 在用户发言写入瓶子、会话或消息前完成内容安全审核，并按后台内容安全策略决定是否拦截。

#### Scenario: 用户扔出合规瓶子

- **WHEN** 已登录用户提交不包含达到拦截程度风险的瓶子正文
- **THEN** 系统 MUST 使用启用的内容安全策略完成审核
- **AND** 审核通过后才写入瓶子并消耗扔瓶额度。

#### Scenario: 用户发送达到策略阈值的违规内容

- **WHEN** 用户提交命中已启用分类且达到拦截程度的内容
- **THEN** 系统 MUST 拒绝发送
- **AND** 返回结构化错误码 `CONTENT_BLOCKED`
- **AND** 不得写入瓶子、会话或消息。

### Requirement: 联系方式硬拦截

系统 MUST 对明显微信、QQ、手机号联系方式执行硬规则识别，并按 `contact_info` 分类策略决定是否拦截。

#### Scenario: 内容包含手机号

- **WHEN** 用户发言包含明显手机号
- **AND** `contact_info` 分类已启用且命中程度达到拦截阈值
- **THEN** 系统 MUST 拒绝发送
- **AND** 拦截类别 MUST 包含 `contact_info`
- **AND** 不得依赖模型放行。

#### Scenario: 联系方式分类被关闭

- **WHEN** 管理员关闭 `contact_info` 分类
- **THEN** 联系方式硬规则 MUST 不再触发拦截
- **AND** 该行为 MUST 写入内容安全策略变更操作日志。

### Requirement: 内容审核后台管理

系统 MUST 提供后台内容审核管理页面和接口，用于配置审核策略、查看筛选事件，并处理被拦截的用户发言。

#### Scenario: 管理员查看拦截列表

- **WHEN** 管理员进入内容审核页面
- **THEN** 页面 MUST 显示分页列表
- **AND** 列表 MUST 包含序号、事件 ID、用户、来源、类别、程度、原因、脱敏预览、状态和时间。

#### Scenario: 管理员筛选拦截事件

- **WHEN** 管理员按关键词、来源、类别、程度或处理状态筛选
- **THEN** API MUST 返回匹配的分页结果。

#### Scenario: 管理员处理拦截事件

- **WHEN** 管理员将事件标记为确认违规、误判或待处理
- **THEN** API MUST 保存处理状态、处理人、处理时间和备注
- **AND** 写入操作日志。

#### Scenario: 管理员查看拦截详情

- **WHEN** 管理员打开拦截事件详情
- **THEN** 页面 MUST 使用弹框展示详情、风险发现和策略摘要
- **AND** 不得展示未脱敏的完整联系方式或完整聊天正文。
