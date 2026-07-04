# 平台基础搭建设计

## 架构

仓库按运行时拆分：

- `apps/client`：uni-app 用户端，用于 H5、微信小程序和后续 App 构建。
- `apps/admin`：浏览器端管理后台。
- `apps/api`：Cloudflare Worker API。
- `packages/shared`：产品常量、枚举、Zod schema 和 TypeScript DTO。
- `packages/db`：Drizzle schema 和 D1 相关导出。
- `packages/ai`：供应商无关的 AI 模型适配接口。

## Cloudflare 资源

- D1 存储用户、资料、瓶子、捡瓶记录、会话、消息、额度、AI 配置和日志。
- R2 存储头像和后续媒体附件。
- KV 存储用户端/后台配置缓存，以及短期运行状态。
- Queues 预留给 AI 瓶子生成、AI 回复和异步日志写入。

## API 形态

- 用户端路由放在 `/v1` 下。
- 管理后台路由放在 `/admin` 下。
- 请求校验使用 `packages/shared` 中的 Zod schema。
- 路由处理器保持轻量；随着功能成熟，具体业务行为下沉到 service 层。

## AI 边界

瓶子和聊天路由里不能硬编码 AI 模型供应商。业务服务应先根据用途选择后台配置的模型，再调用 `packages/ai` 中供应商无关的适配层。
