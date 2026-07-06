## ADDED Requirements

### Requirement: 展示第三方认证身份资料

系统 MUST 在登录会话和当前用户接口中返回第三方认证身份资料，用于用户端预填资料。

#### Scenario: Google 登录返回身份资料

- **WHEN** 用户使用 Google OAuth 登录成功
- **THEN** API MUST 返回 Google 邮箱、显示名称和头像地址
- **AND** 用户端资料页 MUST 使用显示名称和头像预填资料
- **AND** 用户端资料页 MUST 展示邮箱作为只读参考信息。

#### Scenario: 用户刷新资料页

- **WHEN** 已登录用户刷新资料完善页
- **THEN** 客户端 MUST 能通过当前用户接口重新获取认证身份资料
- **AND** 在用户资料未完善时继续预填认证名称和头像。
