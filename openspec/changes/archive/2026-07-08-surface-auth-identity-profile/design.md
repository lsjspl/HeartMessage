# 展示第三方登录身份资料设计

## 共享契约

- 新增 `AuthIdentityProfile`：
  - `provider`
  - `email`
  - `displayName`
  - `avatarUrl`
- `AuthSession` 和 `CurrentUser` 返回 `authIdentity`。
- `AdminUserListItem` 增加 `email`、`authProvider` 和 `authAvatarUrl`。

## API

- Google 登录时继续调用 userinfo 获取 `email`、`name` 和 `picture`。
- 登录身份写入 `user_auth_identities` 后，登录响应把本次身份资料返回给前端。
- `/v1/me` 查询当前用户最新登录身份，用于刷新后仍能预填资料页。
- 后台用户列表左连接聚合后的登录身份资料：
  - 邮箱优先显示 Google 邮箱。
  - 登录来源优先显示最近更新的身份 provider。
  - 头像优先使用用户资料头像，其次显示认证身份头像。
- 后台用户搜索关键词匹配用户 ID、昵称和邮箱。

## 用户端

- 资料完善页初始化时：
  - 已有资料优先使用用户资料。
  - 没有资料时，使用认证身份的显示名称和头像预填。
  - 展示认证邮箱作为只读参考信息。
- 用户仍可选择默认头像或上传头像覆盖认证头像。

## 后台

- 用户列表将用户 ID 和昵称拆成更清晰的身份列。
- 头像列展示用户资料头像，缺省时使用认证身份头像。
- 邮箱列显示认证邮箱，未获取时显示空态。
- 登录来源列显示 Google、微信或未知。
