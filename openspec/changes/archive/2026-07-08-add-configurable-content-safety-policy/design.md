# 可配置 AI 内容安全策略设计

## 设计目标

内容审核拆成两层：

1. 风险识别：硬规则和 AI 模型只负责识别风险类别、程度和原因。
2. 策略决策：平台读取后台配置，决定该风险是否拦截。

这样广告、色情、联系方式等类别可以有独立开关，也可以按 `low`、`medium`、`high` 配置不同拦截阈值。

## 分类

首批分类：

- `contact_info`：手机号、微信、QQ、外部联系方式、站外导流。
- `advertisement`：广告营销、推广、刷屏、商业引流。
- `sexual`：色情低俗、露骨性暗示、性邀约、色情交易。
- `abuse`：辱骂、骚扰、歧视、威胁。
- `illegal`：诈骗、违法交易、灰产引导。

分类枚举放在 `packages/shared`，API 和后台共用。后续新增分类必须先扩展共享枚举和默认策略，不能只改模型 prompt。

## 程度

风险程度使用三档：

- `low`：轻微或语义不明确，默认不拦截。
- `medium`：明确风险，但不是最严重形态，按类别和场景决定是否拦截。
- `high`：明显违规或高风险，默认拦截。

模型输出不再包含 `allowed`，只返回风险发现：

```json
{
  "findings": [
    {
      "category": "advertisement",
      "severity": "medium",
      "confidence": 0.86,
      "reason": "包含明确推广和导流表达"
    }
  ]
}
```

API 使用 Zod 校验模型 JSON。格式错误、未知类别或程度非法时显式失败，不静默放行。

## 默认策略

默认策略保存在系统参数的 `contentSafety` 字段中。首次读取没有配置时写入默认值。

```ts
{
  enabled: true,
  logAllowedFindings: false,
  categories: {
    contact_info: {
      enabled: true,
      hardRuleEnabled: true,
      blockAt: "low"
    },
    advertisement: {
      enabled: true,
      blockAt: "medium"
    },
    sexual: {
      enabled: true,
      blockAt: "medium"
    },
    abuse: {
      enabled: true,
      blockAt: "high"
    },
    illegal: {
      enabled: true,
      blockAt: "medium"
    }
  },
  sourceOverrides: {
    bottle_reply: {
      sexual: { blockAt: "high" }
    },
    chat_message: {
      sexual: { blockAt: "high" },
      abuse: { blockAt: "high" }
    }
  }
}
```

解释：

- 联系方式默认最严格，只要命中低风险及以上就拦截。
- 广告和违法诈骗默认中风险拦截，避免普通日常描述误杀。
- 公开漂流瓶里的色情低俗默认中风险拦截。
- 回复和聊天属于已建立对话，色情与辱骂默认只拦截高风险，避免把轻微暧昧或情绪表达全部挡掉。

## 决策流程

1. 校验内容非空和长度。
2. 读取内容安全策略；全局关闭时跳过内容安全审核。
3. 对启用 `hardRuleEnabled` 的类别执行硬规则。
4. 硬规则命中后生成风险发现，不直接写死最终结果。
5. 如果仍有启用的语义审核类别，调用 `content_moderation` 用途模型。
6. 合并硬规则发现和模型发现。
7. 对每个发现读取当前来源的有效策略。
8. 如果类别关闭，忽略该发现。
9. 如果发现程度大于或等于该类别 `blockAt`，最终决策为拦截。
10. 没有达到拦截阈值时放行；默认不记录放行事件。

严重程度顺序为 `low < medium < high`。多个发现同时存在时，只要任一启用类别达到拦截阈值就拒绝发送，返回主要风险类别对应的中文错误。

## 后台配置

新增接口：

- `GET /admin/content-moderation/settings`
- `PUT /admin/content-moderation/settings`

接口读写系统参数中的 `contentSafety`，但放在内容审核模块 service 和 route 中，避免全局系统参数接口继续膨胀。

后台页面放在内容审核模块内，提供：

- 全局内容安全开关。
- 每个分类的启用开关。
- 每个分类的拦截阈值选择。
- 联系方式硬规则开关。
- 按来源覆盖的阈值配置。

保存后写入操作日志，日志只记录开关状态、阈值摘要和分类数量，不记录用户内容。

## 事件记录

`content_moderation_events` 继续不保存完整正文。新增字段建议：

- `decision`：`blocked` 或 `allowed_logged`。
- `highest_severity`：本次命中的最高程度。
- `findings_json`：脱敏后的风险发现列表。
- `policy_version`：策略版本号或更新时间。
- `policy_snapshot_json`：本次参与决策的策略摘要。
- `rule_source`：`hard_rule`、`ai_model` 或 `mixed`。

默认只记录拦截事件。只有 `logAllowedFindings = true` 时，才记录未拦截但命中低风险的观察事件。

## 迁移和兼容

数据库 migration 给新增字段提供默认值：

- 旧事件 `decision` 视为 `blocked`。
- 旧事件没有程度时 `highest_severity` 视为 `medium`。
- 旧事件没有 findings 时由原 `categories` 和 `reason` 生成兼容摘要。

这不是静默兜底，只是历史数据展示兼容；新审核链路必须写入新字段。

## 验证

实现完成后必须运行：

- `pnpm spec:validate`
- `pnpm typecheck`
- API 相关测试或构建
- 管理后台构建
