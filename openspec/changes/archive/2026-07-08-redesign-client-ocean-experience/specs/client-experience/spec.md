## ADDED Requirements

### Requirement: Web/H5 海面首页

用户端首页 MUST 在 Web 和 H5 上呈现全屏海面体验，并提供清晰的捡瓶子与扔瓶子入口。

#### Scenario: 桌面端打开首页

- **WHEN** 已登录用户在电脑端浏览器打开首页
- **THEN** 页面 MUST 使用宽屏布局展示动态海面和轻量操作入口
- **AND** 捡瓶子与扔瓶子入口 MUST 无遮挡、可点击。

#### Scenario: 移动 H5 打开首页

- **WHEN** 已登录用户在移动 H5 打开首页
- **THEN** 页面 MUST 保持核心海面场景可见
- **AND** 今日额度和主要操作 MUST 在首屏内可见。

#### Scenario: 用户捡瓶子

- **WHEN** 用户点击捡瓶子
- **THEN** 页面 MUST 展示打捞过程动画
- **AND** 漂流瓶 MUST 呈现瓶塞打开、信纸飞出并展开的反馈
- **AND** 接口成功后跳转瓶子详情
- **AND** 接口失败后 MUST 恢复可操作状态并显示错误。

### Requirement: Web/H5 扔瓶动画

用户端扔瓶页 MUST 提供清晰的写信、封瓶和投放反馈，并兼容桌面端和移动 H5。

#### Scenario: 用户填写瓶子

- **WHEN** 用户打开扔瓶页
- **THEN** 页面 MUST 展示信纸式内容输入区域
- **AND** 页面 MUST 展示当前扔瓶剩余额度。

#### Scenario: 用户提交瓶子

- **WHEN** 用户点击封进瓶子
- **THEN** 页面 MUST 展示瓶子投放动画
- **AND** 成功后跳转瓶子详情
- **AND** 失败后 MUST 恢复可操作状态并显示错误。
