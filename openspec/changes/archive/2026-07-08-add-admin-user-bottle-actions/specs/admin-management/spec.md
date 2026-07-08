## ADDED Requirements

### Requirement: 后台用户状态管理

系统 MUST 允许管理员查看用户列表，并启用或禁用普通用户账号。

#### Scenario: 管理员禁用普通用户

- **WHEN** 管理员将普通用户状态改为 `disabled`
- **THEN** API MUST 更新用户状态
- **AND** 写入操作日志。

#### Scenario: 被禁用用户访问用户端接口

- **WHEN** 状态为 `disabled` 的普通用户使用 token 请求需要登录的用户端接口
- **THEN** API MUST 返回 403 错误。

#### Scenario: 管理员恢复普通用户

- **WHEN** 管理员将普通用户状态改为 `active`
- **THEN** API MUST 更新用户状态
- **AND** 用户可以继续访问用户端接口。

### Requirement: 后台瓶子状态管理

系统 MUST 允许管理员处理瓶子状态，包括封禁、删除和过期。

#### Scenario: 管理员封禁瓶子

- **WHEN** 管理员将瓶子状态改为 `blocked`
- **THEN** API MUST 更新瓶子状态
- **AND** 关联会话 MUST 不再保持 active
- **AND** 写入操作日志。

#### Scenario: 管理员删除瓶子

- **WHEN** 管理员将瓶子状态改为 `deleted`
- **THEN** API MUST 更新瓶子状态
- **AND** 关联会话 MUST 不再保持 active
- **AND** 写入操作日志。

#### Scenario: 管理员过期瓶子

- **WHEN** 管理员将瓶子状态改为 `expired`
- **THEN** API MUST 更新瓶子状态
- **AND** 该瓶子不再可被捞取。
