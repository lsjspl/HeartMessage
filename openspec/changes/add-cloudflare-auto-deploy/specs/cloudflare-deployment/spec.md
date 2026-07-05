## ADDED Requirements

### Requirement: API 自动部署链路

系统 MUST 提供可由 Cloudflare Git 构建调用的 API 自动部署脚本。

#### Scenario: Git 构建部署 API

- **WHEN** Cloudflare Git 构建在 `apps/api` 中执行生产部署命令
- **THEN** 脚本 MUST 先完成 API build
- **AND** 应用远程 D1 migration
- **AND** D1 migration MUST 创建默认超级管理员 `admin / 123456`
- **AND** 初始化缺失的 KV 系统配置
- **AND** 最后部署 Worker。

#### Scenario: D1 migration 失败

- **WHEN** 远程 D1 migration 执行失败
- **THEN** 部署脚本 MUST 失败
- **AND** 不得继续部署 Worker。

### Requirement: KV 首次配置初始化

系统 MUST 提供脚本初始化生产所需的系统配置和敏感配置。

#### Scenario: KV 配置不存在

- **WHEN** `system-settings` 或 `system-sensitive-config` 不存在
- **THEN** 初始化脚本 MUST 从构建环境变量生成对应配置并写入 KV。

#### Scenario: KV 配置已存在

- **WHEN** KV 中已经存在对应配置
- **THEN** 初始化脚本 MUST 默认跳过覆盖
- **AND** 只有显式设置覆盖开关时才能覆盖已有配置。

#### Scenario: 必需 Secret 缺失

- **WHEN** 构建环境缺少 `AUTH_TOKEN_SECRET` 或 `PRODUCTION_CORS_ORIGINS`
- **THEN** 初始化脚本 MUST 失败
- **AND** 不得写入不完整配置。
