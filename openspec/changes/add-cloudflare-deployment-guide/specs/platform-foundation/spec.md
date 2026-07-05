## ADDED Requirements

### Requirement: Cloudflare 部署配置

项目 MUST 提供 API、用户端 Web/H5 和管理后台部署到 Cloudflare 的配置与说明。

#### Scenario: 开发者准备部署用户端

- **WHEN** 开发者查看用户端部署配置
- **THEN** 系统 MUST 指明 Cloudflare Pages 构建输出目录为 `dist/build/h5`。

#### Scenario: 开发者准备部署管理后台

- **WHEN** 开发者查看后台部署配置
- **THEN** 系统 MUST 指明 Cloudflare Pages 构建输出目录为 `dist`。

#### Scenario: 开发者准备部署 API

- **WHEN** 开发者查看 API 部署说明
- **THEN** 文档 MUST 列出 D1、R2、Queues、环境变量和 migration 的生产准备项
- **AND** 不得包含真实密钥或生产资源 ID。

#### Scenario: 未经确认的生产操作

- **WHEN** 需要执行生产部署、远程 migration 或远程资源修改
- **THEN** 系统 MUST 要求先获得用户明确确认。
