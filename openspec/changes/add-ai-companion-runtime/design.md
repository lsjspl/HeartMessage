# AI 补位与陪伴聊天设计

## 运行链路

1. `pickBottle` 先按真人和已有 AI 漂浮瓶查询可捞瓶子。
2. 如果没有候选瓶子，读取系统参数：
   - `aiFallbackEnabled = false` 时，返回明确的 `NO_BOTTLE_AVAILABLE`。
   - `aiFallbackEnabled = true` 时，调用 AI 补位服务生成一个 AI 瓶子。
3. AI 补位服务按用途读取模型：
   - `persona_generation` 生成 AI 人格。
   - `bottle_generation` 基于人格生成瓶子内容。
4. 生成成功后写入 `ai_personas` 和 `bottles`，再继续走原捞瓶流程。
5. 用户回复 AI 瓶子或向 AI 会话发送消息后，按 `chat_reply` 用途生成 AI 回复，并写入 `messages`，`sender_type = ai`。

## 模型配置

- 业务代码只传入用途，例如 `chat_reply`，不写死 OpenAI、DeepSeek 或其他供应商。
- AI 运行时通过后台绑定找到 `ai_models`，再关联 `ai_providers`。
- `ai_providers.adapter_type` 决定使用哪个适配器，首个内置适配器是 `openai_compatible`。
- 真实 API Key 只从 Worker 环境变量读取，D1 只保存 `api_key_secret_name`。
- 如果用途未绑定模型、模型被禁用、供应商被禁用、密钥缺失或模型返回异常，API MUST 显式失败。

## 数据结构

- `ai_personas` 保存 AI 人格：
  - `id`
  - `display_name`
  - `bio`
  - `age`
  - `gender`
  - `system_prompt`
  - `model_id`
  - `created_at`
- `bottles.ai_persona_id` 关联 AI 人格。
- `ai_providers.adapter_type` 用于选择模型适配器。

## 日志和隐私

- 记录 `ai.bottle.generate` 和 `ai.chat.reply`。
- 日志 metadata 只记录模型 ID、人格 ID、瓶子 ID、会话 ID、状态和长度摘要。
- 不记录 token、API Key、完整 openid、完整瓶子正文或完整聊天正文。

## 非目标

- 本变更不实现生产队列化调度。
- 本变更不实现后台人格人工编辑页面。
- 本变更不实现多模态图片/语音 AI。
