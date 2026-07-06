## ADDED Requirements

### Requirement: 后台用户列表展示认证资料

后台用户列表 MUST 展示用户头像、邮箱和登录来源，便于管理员识别第三方登录用户。

#### Scenario: 管理员查看用户列表

- **WHEN** 管理员打开用户列表
- **THEN** 列表 MUST 展示用户头像
- **AND** 展示认证邮箱
- **AND** 展示登录来源。

#### Scenario: 管理员搜索邮箱

- **WHEN** 管理员使用邮箱关键词搜索用户
- **THEN** 用户列表 MUST 返回邮箱匹配的用户。
