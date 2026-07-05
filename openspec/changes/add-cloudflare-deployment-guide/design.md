# Cloudflare 部署配置设计

## Pages

- 用户端 H5 使用 `apps/client` 的 uni-app 构建产物：`dist/build/h5`。
- 管理后台使用 `apps/admin` 的 Vite 构建产物：`dist`。
- 两个 Pages 项目通过 `wrangler.jsonc` 保存非敏感配置：
  - `name`
  - `pages_build_output_dir`
  - `compatibility_date`

## API Worker

- API 继续使用 `apps/api/wrangler.jsonc`。
- 生产前必须替换：
  - D1 database ID
  - KV namespace ID
  - R2 bucket
  - Queue 名称
  - CORS 白名单
  - 管理员账号和密码
  - 微信配置
  - AI 模型密钥环境变量

## 安全

- 文档只使用占位符，不写真实密钥。
- 不新增会自动部署生产的脚本。
- 生产部署、远程 migration 和远程资源修改都必须由用户明确确认。
