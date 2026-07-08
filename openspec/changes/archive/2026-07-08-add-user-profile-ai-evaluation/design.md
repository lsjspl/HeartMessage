# AI 用户画像评估设计

## 画像字段

用户画像保存以下信息：

- `summary`：用户整体摘要。
- `interestTags`：兴趣标签。
- `preferredTopics`：偏好聊天话题。
- `avoidedTopics`：应避免主动触碰的话题。
- `conversationStyle`：用户偏好的沟通节奏和表达风格。
- `emotionalNeeds`：可能需要的陪伴感。
- `preferredPersonaTraits`：用户更可能喜欢的 AI 人格特征。
- `companionExpectation`：对陪伴对象的期待。
- `safetyNotes`：生成人格时需要遵守的边界提示。

画像只保存模型输出摘要，不在日志里保存原始聊天正文。

## 定时评估

Worker 增加 `scheduled` 入口。定时任务读取系统参数：

- `userProfileEvaluation.enabled`
- `userProfileEvaluation.intervalHours`
- `userProfileEvaluation.batchSize`

系统选择 active 普通用户中未评估、评估失败或超过间隔的用户，批量调用 `user_profile_evaluation` 用途模型。失败会写入画像状态和错误摘要，便于后台观察。

## 画像输入

画像评估输入包含：

- 用户基础资料。
- 最近扔出的瓶子正文摘要集合。
- 最近用户自己发送的聊天消息集合。

输入只发送给配置的画像评估模型，不写入操作日志。

## AI 人格生成接入

当用户捞瓶且触发 AI 补位时，`createAiBottle` 接收目标用户 ID。人格生成 prompt 携带该用户画像，要求模型生成符合用户偏好的虚拟人格，并避免画像中标记的敏感边界。生成的 AI 人格保存 `target_user_id`，捞瓶候选只允许目标用户捞到该定制 AI 瓶子。

## 后台

后台新增用户画像页面，展示画像状态、摘要、标签、评估时间和手动评估按钮。AI 用途绑定页面增加“画像评估”用途。
