# AI 内容安全审核设计

## 审核入口

用户文本进入以下接口前必须审核：

- `POST /v1/bottles/throw`
- `POST /v1/bottles/:id/reply`
- `POST /v1/chats/:id/messages`

审核放在 service 层，路由只负责解析参数。发送失败不得消耗扔瓶额度，不得创建会话，不得写入消息。

## 审核策略

1. 先执行本地硬规则：
   - 明显手机号。
   - 明显微信、WeChat、VX、WX 联系方式。
   - 明显 QQ、扣扣联系方式。
2. 硬规则命中时直接返回 `CONTENT_BLOCKED`，类别为 `contact_info`。
3. 未命中硬规则时，调用 `content_moderation` 用途模型。
4. 模型必须返回 JSON：`allowed`、`categories`、`reason`。
5. 模型未配置、不可用或返回无法解析时显式失败，不静默放行。

## 日志

- 拦截事件记录 `content.moderation.block`。
- AI 审核失败记录明确错误，由 API 返回错误，不写假成功日志。
- 日志 metadata 只允许包含来源、类别、模型 ID、文本长度，不保存完整用户正文。

## 前端行为

用户端使用后端结构化错误中的中文 message 展示 toast。后台通过日志中心可查看拦截摘要，不展示完整正文。
