# HeartMessage

漂流瓶社交程序，先交付 Web/H5，后续扩展微信小程序和 App。后端与 Web 版部署在 Cloudflare，使用 Workers、D1、R2、KV、Queues 等能力。

## 项目结构

```txt
apps/
  client/        # uni-app 用户端：H5 / 小程序 / App
  admin/         # Vue 3 管理后台
  api/           # Cloudflare Workers API
packages/
  shared/        # 共享类型、Zod schema、常量
  db/            # D1 / Drizzle schema
  ai/            # 多模型 AI 供应商适配层
openspec/
  specs/         # 已确认的产品/技术规格
  changes/       # 每次需求变更的 proposal / design / tasks / spec delta
docs/
  design/        # 设计稿和产品图
```

## 开发命令

```bash
pnpm install
pnpm dev:client
pnpm dev:admin
pnpm dev:api
```

## OpenSpec 工作流

1. 新功能先在 `openspec/changes/<change-id>/` 写 `proposal.md`、`design.md`、`tasks.md`。
2. 规格变更写到 `openspec/changes/<change-id>/specs/<capability>/spec.md`。
3. 通过评审后再实现代码。
4. 实现完成后，把稳定规格合并到 `openspec/specs/`。
