## ADDED Requirements

### Requirement: API 自动部署链路

系统 MUST 提供可由 Cloudflare Git 构建调用的 API 自动部署脚本。

#### Scenario: Git 构建部署 API

- **WHEN** Cloudflare Git 构建在仓库根目录执行 API 生产部署命令
- **THEN** 脚本 MUST 先完成 API build
- **AND** 应用远程 D1 migration
- **AND** D1 migration MUST 创建默认超级管理员 `admin / 123456`
- **AND** 最后部署 Worker。

#### Scenario: D1 migration 失败

- **WHEN** 远程 D1 migration 执行失败
- **THEN** 部署脚本 MUST 失败
- **AND** 不得继续部署 Worker。

### Requirement: 后台配置自初始化

系统 MUST 由后端配置服务初始化缺失的系统配置和必需敏感配置，不得依赖 Cloudflare 构建环境变量。

#### Scenario: 系统配置不存在

- **WHEN** `system-settings` 不存在
- **THEN** 后端 MUST 写入默认系统配置到 `CONFIG_KV`
- **AND** 后续后台系统参数页面 MUST 能读取和修改该配置。

#### Scenario: Token 签名密钥不存在

- **WHEN** `AUTH_TOKEN_SECRET` 不存在且系统需要签发登录 Token
- **THEN** 后端 MUST 生成随机密钥并写入后台敏感配置
- **AND** 接口响应和日志不得回显完整密钥。

#### Scenario: 构建环境缺少业务配置变量

- **WHEN** Cloudflare Git 构建环境没有配置 `PRODUCTION_CORS_ORIGINS`、`AUTH_TOKEN_SECRET`、微信或 AI Key
- **THEN** API 部署脚本 MUST NOT 因这些业务配置变量缺失而失败
- **AND** 这些配置 MUST 在后台系统配置或敏感配置中维护。
