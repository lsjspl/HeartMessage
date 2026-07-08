# bottles-chat Specification

## Purpose
TBD - created by archiving change add-bottles-and-chat. Update Purpose after archive.
## Requirements
### Requirement: 每日瓶子额度

系统 MUST 按用户和日期限制每日捡瓶子与扔瓶子次数，默认每天可捡 20 个瓶子、可扔 3 个瓶子。

#### Scenario: 用户查询当天额度

- **WHEN** 已登录用户请求 `GET /v1/bottles/quota`
- **THEN** API 返回当天捡瓶和扔瓶的限制、已使用次数和剩余次数。

#### Scenario: 用户超过扔瓶额度

- **WHEN** 用户当天已经扔出 3 个瓶子后继续请求扔瓶子
- **THEN** API MUST 拒绝请求
- **AND** 返回结构化错误码 `THROW_LIMIT_REACHED`。

#### Scenario: 用户超过捡瓶额度

- **WHEN** 用户当天已经捡到 20 个瓶子后继续请求捡瓶子
- **THEN** API MUST 拒绝请求
- **AND** 返回结构化错误码 `PICK_LIMIT_REACHED`。

### Requirement: 扔出当天有效瓶子

系统 MUST 允许已登录用户扔出当天有效的漂流瓶，并在当天结束后不再允许被捞取。

#### Scenario: 用户成功扔瓶子

- **WHEN** 已登录用户提交合法瓶子内容
- **THEN** API 创建状态为 `floating` 的瓶子
- **AND** 设置 `expiresAt` 为当天结束时间
- **AND** 递增当天扔瓶次数。

#### Scenario: 用户提交非法瓶子内容

- **WHEN** 用户提交空内容或超过长度限制的内容
- **THEN** API MUST 拒绝请求并返回校验错误。

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

### Requirement: 回复瓶子开启聊天

系统 MUST 允许捡瓶用户回复自己捡到且未删除的瓶子，并创建聊天会话。

#### Scenario: 捡瓶用户回复瓶子

- **WHEN** 捡瓶用户对已捡到的瓶子提交合法回复
- **THEN** API 创建或返回对应会话
- **AND** 写入首条聊天消息
- **AND** 返回会话 ID。

#### Scenario: 用户回复未捡到的瓶子

- **WHEN** 用户尝试回复自己没有捡到的瓶子
- **THEN** API MUST 拒绝请求并返回 403 错误。

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

### Requirement: 删除捡到的瓶子和会话

系统 MUST 允许用户删除自己捡到的瓶子或聊天会话，删除后该用户不再收到该关系的后续消息。

#### Scenario: 用户删除捡到的瓶子

- **WHEN** 捡瓶用户删除自己捡到的瓶子
- **THEN** API 标记捡取关系为 `deleted`
- **AND** 该瓶子对应会话对该用户不可见。

#### Scenario: 用户删除聊天会话

- **WHEN** 会话参与者删除会话
- **THEN** API 仅隐藏该用户视角的会话
- **AND** 后续任何参与者向该会话发送消息时，若对方已删除关系，API MUST 显式拒绝。

