## ADDED Requirements

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
