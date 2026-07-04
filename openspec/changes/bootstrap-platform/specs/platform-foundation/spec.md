## ADDED Requirements

### Requirement: Monorepo 工程基础

平台 MUST 使用 workspace monorepo，并将用户端、管理后台和 Cloudflare Worker API 拆分为独立应用。

#### Scenario: 开发者只启动一个应用

- **WHEN** 开发者运行某个应用专属的开发命令
- **THEN** 只有被请求的应用会启动
- **AND** 共享包通过 workspace 正确解析。

### Requirement: 共享契约

平台 MUST 把跨端使用的枚举、DTO schema 和产品常量放在共享包中。

#### Scenario: API 和客户端使用同一份瓶子额度常量

- **WHEN** 代码需要引用每日额度
- **THEN** API 和前端都可以从 `@heart-message/shared` 导入同一份常量。

### Requirement: Cloudflare API 边界

API MUST 实现为 Cloudflare Worker，并显式声明 D1、KV、R2 和 Queue 绑定。

#### Scenario: Worker 收到请求

- **WHEN** 请求进入 API
- **THEN** 路由处理器通过类型化的 Worker bindings 访问基础设施
- **AND** 业务逻辑执行前必须先完成请求参数校验。

### Requirement: OpenSpec 驱动变更

功能开发 MUST 在实现前先写入 OpenSpec 变更目录。

#### Scenario: 收到新功能需求

- **WHEN** 开发者开始一个新功能
- **THEN** 必须在 `openspec/changes/<change-id>/` 下创建 proposal、tasks 和 spec delta。
