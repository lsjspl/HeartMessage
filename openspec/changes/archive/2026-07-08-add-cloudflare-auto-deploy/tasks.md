# 任务清单

- [x] 移除 Cloudflare 构建环境变量初始化业务配置的脚本。
- [x] 增加 API CI 部署脚本，串联 build、D1 migration 和 Worker 部署。
- [x] 增加后端配置自初始化，缺失系统配置时写入后台系统配置，缺失 `AUTH_TOKEN_SECRET` 时生成并写入后台敏感配置。
- [x] 更新 Cloudflare 部署文档，删除手动执行 SQL 的主路径。
- [x] 增加 OpenSpec 规格并运行校验。
