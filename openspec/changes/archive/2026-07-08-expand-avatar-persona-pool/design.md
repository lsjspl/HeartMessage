# 扩展默认头像和 AI 人格资料设计

## 头像资产

头像资产分为两类：

- 原始 PNG：保存到 `docs/img/avatars/originals`，用于提交、归档和后续重新压缩。
- 前端 WebP：保存到 `apps/client/src/static/avatars/defaults`，用于用户端展示，目标单张小于 200KB。

默认头像元数据放在 `packages/shared`，用户端资料完善页和 API AI 人格头像选择共用同一份配置。

## AI 人格头像

AI 人格创建时由服务端从真人风格头像中选择一个头像路径，写入 `ai_personas.avatar_url`。动物动漫头像只给用户选择，不用于 AI 人格。

瓶子详情、捞瓶结果、聊天列表和聊天详情继续返回 `BottleAuthor`，其中 AI 人格作者也包含 `avatarUrl`、昵称、简介、年龄和性别。后台和数据层继续保留 `source = ai`，用于审计和运营统计。

## 数据迁移

新增 `0012_ai_persona_avatar_url.sql`，只增加 nullable `avatar_url` 字段，不改写历史 AI 人格。历史 AI 人格没有头像时，API 使用头像池按人格 ID 计算展示头像，不静默修改数据库。
