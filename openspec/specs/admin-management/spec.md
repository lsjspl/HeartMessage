# admin-management Specification

## Purpose
TBD - created by archiving change add-admin-management. Update Purpose after archive.
## Requirements
### Requirement: 管理员登录

系统 MUST 提供后台管理员登录能力，并返回仅允许访问后台接口的 admin token。

#### Scenario: 数据库迁移创建默认管理员

- **WHEN** 部署数据库 migration
- **THEN** 系统 MUST 创建默认超级管理员账号 `admin`
- **AND** 默认密码 MUST 为 `123456`
- **AND** 默认管理员不得依赖 KV、`wrangler vars` 或部署 Secret 创建。

#### Scenario: 管理员使用正确账号密码登录

- **WHEN** 管理员提交正确的账号和密码
- **THEN** API 返回 admin token、管理员名称和过期时间
- **AND** token 的角色 MUST 为 `admin`。

#### Scenario: 管理员提交错误密码

- **WHEN** 管理员提交错误账号或密码
- **THEN** API MUST 返回 401 错误
- **AND** 不得泄露哪个字段错误。

### Requirement: 管理员账号管理

系统 MUST 支持超级管理员维护后台管理员账号。

#### Scenario: 超级管理员创建管理员

- **WHEN** 超级管理员提交账号、名称、角色和初始密码
- **THEN** API MUST 创建管理员账号
- **AND** 密码 MUST 以不可逆哈希保存
- **AND** 写入操作日志。

#### Scenario: 超级管理员修改管理员

- **WHEN** 超级管理员修改管理员名称、角色或状态
- **THEN** API MUST 更新管理员账号
- **AND** 不得允许超级管理员删除或禁用自己的账号。

#### Scenario: 超级管理员重置密码

- **WHEN** 超级管理员为管理员设置新密码
- **THEN** API MUST 更新密码哈希
- **AND** 不得在日志中记录明文密码。

#### Scenario: 普通管理员访问管理员管理

- **WHEN** 普通管理员请求管理员账号管理接口
- **THEN** API MUST 返回 403 错误。

### Requirement: 管理员修改自己的密码

系统 MUST 允许已登录管理员修改自己的密码。

#### Scenario: 管理员提交正确旧密码

- **WHEN** 管理员提交正确旧密码和合法新密码
- **THEN** API MUST 更新该管理员密码哈希
- **AND** 后续登录 MUST 使用新密码。

#### Scenario: 管理员提交错误旧密码

- **WHEN** 管理员提交错误旧密码
- **THEN** API MUST 返回 401 错误
- **AND** 不得修改密码。

### Requirement: 后台接口鉴权

系统 MUST 保护除登录外的所有 `/admin/*` 接口，只有 admin token 可以访问。

#### Scenario: 未登录访问后台接口

- **WHEN** 请求没有携带有效 admin token
- **THEN** API MUST 返回 401 或 403 错误。

#### Scenario: 普通用户访问后台接口

- **WHEN** 普通用户 token 请求后台接口
- **THEN** API MUST 返回 403 错误。

### Requirement: 系统参数管理

系统 MUST 允许管理员查看和保存系统参数，包括运行环境、CORS 白名单、每日额度、AI 补位开关、AI 生成数量和 AI 用途绑定。

#### Scenario: 管理员查看系统参数

- **WHEN** 管理员请求系统参数
- **THEN** API 返回当前 D1 参数或显式默认参数。

#### Scenario: 管理员保存系统参数

- **WHEN** 管理员提交合法系统参数
- **THEN** API 将参数保存到 D1
- **AND** 写入操作日志。

#### Scenario: 管理员修改访问白名单

- **WHEN** 管理员在系统参数页修改 CORS 白名单
- **THEN** 后续跨域请求 MUST 使用后台保存的白名单判断
- **AND** 当后台保存 `*` 时 MUST 允许任意请求来源
- **AND** 不得继续读取 `wrangler vars` 中的 CORS 业务配置。

### Requirement: 敏感配置管理

系统 MUST 提供后台敏感配置管理能力，用于维护 Token 密钥、微信配置和 AI Key 等敏感值。

#### Scenario: 管理员查看敏感配置

- **WHEN** 管理员进入敏感配置页面
- **THEN** 页面 MUST 显示配置键、名称、来源、状态、脱敏预览和更新时间
- **AND** 不得回显完整配置值。

#### Scenario: 管理员保存敏感配置

- **WHEN** 管理员提交配置键和配置值
- **THEN** API MUST 保存到后端系统配置
- **AND** 日志 MUST 只记录配置键和更新动作，不记录配置值。

#### Scenario: 业务读取敏感配置

- **WHEN** 登录 token、微信登录或 AI 调用需要密钥
- **THEN** 后端 MUST 从敏感配置读取
- **AND** 敏感配置 MUST 存储在 D1
- **AND** 不得继续依赖 KV 或 `wrangler vars` 配置常用业务参数。

### Requirement: AI 模型管理

系统 MUST 支持管理员维护 AI 供应商和模型，且模型必须按用途配置。

#### Scenario: 管理员查看模型列表

- **WHEN** 管理员请求 AI 模型列表
- **THEN** API 返回供应商、模型名、用途、启用状态和配置摘要。

#### Scenario: 管理员保存模型

- **WHEN** 管理员提交合法模型配置
- **THEN** API 新增或更新 D1 中的供应商和模型记录
- **AND** 供应商 MUST 保存敏感配置键，真实 API Key 通过敏感配置维护。

### Requirement: AI 用途绑定

系统 MUST 支持管理员配置人格生成、瓶子生成、聊天回复和内容审核分别使用哪个模型。

#### Scenario: 管理员保存用途绑定

- **WHEN** 管理员选择每个用途对应的模型 ID 并保存
- **THEN** API 将绑定保存到系统参数
- **AND** 后续 AI 业务可按用途读取绑定。

### Requirement: 日志查询

系统 MUST 提供后台日志查询能力，用于查看管理员操作、AI 配置变更和关键业务事件。

#### Scenario: 管理员查看日志

- **WHEN** 管理员请求日志列表
- **THEN** API 返回最近日志的动作、目标、摘要和时间
- **AND** 不返回 token、API Key、完整 openid 或完整聊天正文。

### Requirement: 后台用户状态管理

系统 MUST 允许管理员查看用户列表，并启用或禁用普通用户账号。

#### Scenario: 管理员禁用普通用户

- **WHEN** 管理员将普通用户状态改为 `disabled`
- **THEN** API MUST 更新用户状态
- **AND** 写入操作日志。

#### Scenario: 被禁用用户访问用户端接口

- **WHEN** 状态为 `disabled` 的普通用户使用 token 请求需要登录的用户端接口
- **THEN** API MUST 返回 403 错误。

#### Scenario: 管理员恢复普通用户

- **WHEN** 管理员将普通用户状态改为 `active`
- **THEN** API MUST 更新用户状态
- **AND** 用户可以继续访问用户端接口。

### Requirement: 后台瓶子状态管理

系统 MUST 允许管理员处理瓶子状态，包括封禁、删除和过期。

#### Scenario: 管理员封禁瓶子

- **WHEN** 管理员将瓶子状态改为 `blocked`
- **THEN** API MUST 更新瓶子状态
- **AND** 关联会话 MUST 不再保持 active
- **AND** 写入操作日志。

#### Scenario: 管理员删除瓶子

- **WHEN** 管理员将瓶子状态改为 `deleted`
- **THEN** API MUST 更新瓶子状态
- **AND** 关联会话 MUST 不再保持 active
- **AND** 写入操作日志。

#### Scenario: 管理员过期瓶子

- **WHEN** 管理员将瓶子状态改为 `expired`
- **THEN** API MUST 更新瓶子状态
- **AND** 该瓶子不再可被捞取。

### Requirement: 后台模块化导航

系统 MUST 按模块组织后台导航，复杂模块 MUST 使用子菜单。

#### Scenario: 管理员查看侧边栏

- **WHEN** 管理员登录后台
- **THEN** 侧边栏 MUST 展示运营工作台、系统配置、用户中心、内容管理、AI 配置和日志中心
- **AND** 用户中心与 AI 配置 MUST 使用子菜单承载复杂功能。

### Requirement: 后台一个页面一个主要列表

系统 MUST 避免在同一后台页面平铺多个主要管理列表。

#### Scenario: 管理员打开 AI 配置模块

- **WHEN** 管理员分别进入供应商、模型和用途绑定页面
- **THEN** 每个页面 MUST 只承载对应功能
- **AND** 不得在同一页面同时平铺供应商列表、模型列表和用途绑定。

#### Scenario: 管理员打开工作台

- **WHEN** 管理员查看运营工作台
- **THEN** 页面 MUST 以指标概览为主
- **AND** 不得平铺最近瓶子和日志等管理列表。

### Requirement: 后台主要列表分页

系统 MUST 为数据量会持续增长的后台主要列表提供分页。

#### Scenario: 管理员查看主要列表

- **WHEN** 管理员打开用户列表、用户画像、瓶子列表、日志中心、AI 供应商或 AI 模型页面
- **THEN** API MUST 返回当前页数据和分页元信息
- **AND** 前端 MUST 展示页码、每页数量和总数
- **AND** 管理员切换页码或每页数量时 MUST 重新加载对应页数据。

### Requirement: 后台主要列表标准交互

系统 MUST 为后台主要列表提供标准表格交互。

#### Scenario: 管理员查看列表

- **WHEN** 管理员打开后台主要列表页面
- **THEN** 表格 MUST 提供多选列
- **AND** 表格前部 MUST 提供序号列或 ID 列
- **AND** 页面 MUST 提供取消多选操作。

#### Scenario: 管理员筛选列表

- **WHEN** 管理员在后台主要列表输入常用筛选条件
- **THEN** API MUST 按筛选条件返回匹配数据
- **AND** 前端 MUST 在筛选后回到第一页。

### Requirement: 添加编辑使用模态框

系统 MUST 避免将添加或编辑表单平铺到列表上方。

#### Scenario: 管理员新增或编辑 AI 配置

- **WHEN** 管理员在 AI 供应商或 AI 模型列表新增或编辑记录
- **THEN** 页面 MUST 使用图标按钮触发模态弹框
- **AND** 保存成功后 MUST 关闭弹框并刷新当前列表。

### Requirement: AI 供应商模型拉取

系统 MUST 支持管理员在 AI 模型表单中按供应商拉取可用模型列表并选择模型名。

#### Scenario: 管理员拉取供应商模型

- **WHEN** 管理员在 AI 模型表单中选择供应商并触发模型拉取
- **THEN** API MUST 使用该供应商的适配器和敏感配置中的 API Key 请求供应商模型列表
- **AND** 响应 MUST 只包含模型标识和非敏感摘要
- **AND** 响应 MUST NOT 包含 API Key 或敏感配置值。

#### Scenario: 管理员保存供应商 API Key

- **WHEN** 管理员在供应商表单中填写 API Key 并保存
- **THEN** 系统 MUST 将 API Key 写入敏感配置
- **AND** 供应商列表、编辑表单、操作日志和错误响应 MUST NOT 回显 API Key 明文或片段。

#### Scenario: 管理员选择敏感配置键

- **WHEN** 管理员在供应商表单中选择 API Key 配置
- **THEN** 管理后台 MUST 通过分组下拉展示可选敏感配置键
- **AND** 管理员 MUST NOT 通过普通文本输入框手动录入敏感配置键。

#### Scenario: 管理员维护敏感配置分组

- **WHEN** 管理员新增或编辑敏感配置
- **THEN** 系统 MUST 支持维护配置名称和分组
- **AND** 需要选择敏感配置键的表单 MUST 按分组展示这些配置。

#### Scenario: 供应商模型拉取失败

- **WHEN** 供应商未配置 baseUrl、API Key 缺失、适配器不支持拉取或供应商接口失败
- **THEN** API MUST 返回结构化错误
- **AND** 系统 MUST NOT 静默返回空列表或切换到其他供应商。

#### Scenario: 选择模型后默认展示名

- **WHEN** 管理员选择或输入模型名且展示名未被手动修改
- **THEN** 管理后台 MUST 将展示名默认填充为“用途名称 + 模型名”
- **AND** 管理员后续修改用途时，展示名仍为自动生成值的情况下 MUST 同步更新。

### Requirement: AI 模型多用途配置

系统 MUST 支持一个 AI 模型记录绑定多个用途，并按供应商和模型名作为单条模型展示。

#### Scenario: 管理员新增多用途模型

- **WHEN** 管理员新增 AI 模型并选择多个用途
- **THEN** API MUST 保存该模型支持的用途数组
- **AND** 后台模型列表 MUST 将该供应商和模型名展示为一行
- **AND** 用途列 MUST 展示该模型支持的全部用途。

#### Scenario: 同供应商同模型重复新增

- **WHEN** 管理员新增模型时选择的供应商和模型名已存在
- **THEN** API MUST 返回结构化冲突错误
- **AND** 系统 MUST NOT 创建第二条同供应商同模型记录。

#### Scenario: 用途绑定筛选模型

- **WHEN** 管理员为某个用途选择绑定模型
- **THEN** 后台 MUST 只展示包含该用途且启用的模型。

#### Scenario: 管理员删除模型

- **WHEN** 管理员删除 AI 模型
- **THEN** API MUST 删除该模型记录
- **AND** 系统 MUST 清理系统设置中指向该模型的用途绑定。

#### Scenario: 运行时校验模型用途

- **WHEN** AI 运行时按用途读取绑定模型
- **THEN** API MUST 确认该模型的用途数组包含当前用途
- **AND** 如果不包含该用途，API MUST 显式返回模型不可用错误。

### Requirement: 后台用户列表展示认证资料

后台用户列表 MUST 展示用户头像、邮箱和登录来源，便于管理员识别第三方登录用户。

#### Scenario: 管理员查看用户列表

- **WHEN** 管理员打开用户列表
- **THEN** 列表 MUST 展示用户头像
- **AND** 展示认证邮箱
- **AND** 展示登录来源。

#### Scenario: 管理员搜索邮箱

- **WHEN** 管理员使用邮箱关键词搜索用户
- **THEN** 用户列表 MUST 返回邮箱匹配的用户。

