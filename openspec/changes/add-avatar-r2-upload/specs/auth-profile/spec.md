## ADDED Requirements

### Requirement: 头像文件上传到 R2

系统 MUST 支持登录用户把头像图片上传到 Cloudflare R2，并返回可保存到资料中的公开访问地址。

#### Scenario: 用户上传合法头像

- **WHEN** 登录用户申请头像上传并提交合法图片文件
- **THEN** API MUST 将文件写入 R2 的用户头像前缀
- **AND** 返回对象 key 和公开访问地址。

#### Scenario: 用户上传非法头像

- **WHEN** 用户上传非图片类型、超出大小限制或不属于自己前缀的对象 key
- **THEN** API MUST 拒绝请求并返回结构化错误。

### Requirement: 头像公开读取

系统 MUST 提供头像媒体读取路由，用于展示 R2 中的头像。

#### Scenario: 客户端读取已上传头像

- **WHEN** 客户端请求头像公开访问地址
- **THEN** API MUST 从 R2 读取对象
- **AND** 返回正确内容类型。

### Requirement: 资料页选择头像和性别

用户端资料页 MUST 支持选择头像和性别，并在保存资料时提交头像地址、昵称、介绍、年龄和性别。

#### Scenario: 用户完善资料

- **WHEN** 用户选择头像、填写资料并选择性别
- **THEN** 客户端 MUST 先成功上传头像
- **AND** 保存资料时提交 `avatarUrl` 和 `gender`。
