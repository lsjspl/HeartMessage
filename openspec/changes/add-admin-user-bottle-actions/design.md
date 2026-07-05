# 后台用户与瓶子管理操作设计

## 用户状态

- 后台用户列表返回 camelCase DTO，避免前端依赖数据库字段名。
- 管理员可以把普通用户状态改为 `active` 或 `disabled`。
- 不允许通过该接口修改管理员角色账号。
- `requireAuth` 对普通用户 token 增加状态检查：
  - `active` 允许继续。
  - `disabled` 或 `deleted` 返回 403。
- demo header 仅用于本地开发，不作为生产鉴权依据。

## 瓶子状态

- 管理员可以把瓶子状态改为 `blocked`、`deleted` 或 `expired`。
- 修改状态时写入 `bottles.updated_at`。
- 如果目标状态是 `blocked` 或 `deleted`，关联会话状态同步改为 `blocked` 或 `deleted`，后续聊天查询和发送都会被拒绝。
- 不提供把已捡瓶子恢复为 `floating` 的隐式操作，避免破坏捡瓶关系。

## 日志

- 用户状态变化记录 `admin.user.status.update`。
- 瓶子状态变化记录 `admin.bottle.status.update`。
- 日志只记录用户 ID、瓶子 ID、旧状态、新状态和来源，不记录完整瓶子正文或聊天正文。
