## MODIFIED Requirements

### Requirement: 捡取可用瓶子

系统 MUST 允许已登录用户捡取未过期、未被捡走、非本人扔出的瓶子。

#### Scenario: 用户成功捡到瓶子

- **WHEN** 存在可捞取瓶子且用户仍有捡瓶额度
- **THEN** API 返回瓶子内容、作者展示信息和捡取记录 ID
- **AND** 作者展示信息 MUST 包含头像、昵称、简介、年龄和性别中可用的字段
- **AND** 将瓶子状态更新为 `picked`
- **AND** 递增当天捡瓶次数。

#### Scenario: 用户查看自己可访问的瓶子详情

- **WHEN** 用户请求自己扔出或已经捡到的瓶子详情
- **THEN** API 返回瓶子内容、作者展示信息和瓶子状态。

#### Scenario: 没有可捞取瓶子

- **WHEN** 不存在未过期可捞取瓶子
- **THEN** API MUST 返回结构化错误码 `NO_BOTTLE_AVAILABLE`
- **AND** 不得静默返回 demo 瓶子或假成功。

### Requirement: 聊天消息

系统 MUST 允许会话参与者查看聊天列表、查看消息和发送消息。

#### Scenario: 用户查看聊天列表

- **WHEN** 已登录用户请求 `GET /v1/chats`
- **THEN** API 返回该用户仍可见的会话列表
- **AND** 每个会话包含对方头像、展示名、最近消息摘要、未读数和更新时间。

#### Scenario: 用户发送聊天消息

- **WHEN** 会话参与者提交合法消息内容
- **THEN** API 写入消息
- **AND** 更新会话更新时间。

#### Scenario: 非参与者访问会话

- **WHEN** 非会话参与者请求消息列表或发送消息
- **THEN** API MUST 返回 403 错误。
