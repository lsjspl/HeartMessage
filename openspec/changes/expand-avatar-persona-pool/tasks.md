# 扩展默认头像和 AI 人格资料任务

- [x] 编写 OpenSpec proposal、design、tasks 和规格增量。
- [x] 生成 50 个 GPT Image 2 头像原图并保存到 `docs/img/avatars/originals`。
- [x] 压缩生成前端 WebP 头像并控制单张不超过 200KB。
- [x] 将默认头像元数据移动到共享包并更新用户端资料完善页。
- [x] 给 `ai_personas` 增加 `avatar_url` 字段和 D1 migration。
- [x] AI 人格创建时写入头像，历史人格读取时按 ID 计算展示头像。
- [x] 瓶子和聊天接口返回 AI 人格头像。
- [x] 用户端瓶子详情、聊天列表和聊天详情展示头像图片。
- [x] 运行 OpenSpec 校验、类型检查和相关构建验证。
