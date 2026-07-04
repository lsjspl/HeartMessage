# HeartMessage 项目指南

## Purpose

HeartMessage 是一个漂流瓶社交产品。用户可以扔出当天有效的瓶子、随机捡瓶子、回复后开启聊天，也可以删除捡到的瓶子来停止接收后续消息。当没有真人瓶子可捞时，系统可以使用 AI 人格生成瓶子，并继续提供陪伴式聊天。

## 技术栈

- 用户端：uni-app、Vue 3、TypeScript、Pinia。
- 管理后台：Vue 3、Vite、TypeScript、Element Plus、Pinia。
- API：Cloudflare Workers、Hono、TypeScript、Zod。
- 数据库：Cloudflare D1，使用 Drizzle ORM 管理 schema。
- 存储和缓存：R2 存放头像和未来媒体附件，KV 缓存配置和短期状态。
- 异步任务：Cloudflare Queues 用于 AI 生成瓶子、AI 回复和日志写入。
- AI：建立供应商无关的适配层，后续可接入多平台模型 API。

## 开发原则

- 产品需求先写成 OpenSpec 变更，再进入实现。
- 用户、瓶子、聊天、额度、AI、管理后台的边界要清晰。
- 跨端共享的类型、枚举、DTO 和常量放在 `packages/shared`。
- 数据库 schema 放在 `packages/db`；API 路由里不要手写表结构。
- AI 供应商逻辑放在 `packages/ai`；业务代码只调用面向用例的服务。
- Cloudflare 绑定属于基础设施边界，通过 Worker `Env` 注入。

## OpenSpec 工作流

1. 创建 `openspec/changes/<change-id>/proposal.md`，说明为什么要做、要改什么、影响范围。
2. 如果变更涉及架构、数据、AI 行为或安全策略，就在 `design.md` 写清技术方案。
3. 在 `tasks.md` 写实现任务清单。
4. 在 `openspec/changes/<change-id>/specs/<capability>/spec.md` 写规格增量。
5. 规格足够清晰、能验收之后再开始写代码。
6. 实现完成后，把已确认的需求合并进 `openspec/specs/`。

## 命名规范

- 变更 ID 使用 kebab-case，并带动作前缀，例如 `add-wechat-login`。
- 能力名称使用稳定名词，例如 `auth`、`bottles`、`chat`、`ai-models`、`admin`。
- 用户端 API 使用 `/v1` 前缀，管理后台 API 使用 `/admin` 前缀。

## 当前 MVP 能力

- 微信登录和个人资料完善。
- 每日额度：可捡 20 个瓶子，可扔 3 个瓶子。
- 扔出的瓶子当天有效，当天结束后过期。
- 捡到瓶子后可以回复，并开启聊天。
- 删除捡到的瓶子后，该关系不再接收后续消息。
- 管理员可以管理用户、瓶子、系统参数、AI 供应商、模型、人格和日志。
