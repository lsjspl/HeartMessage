# client-experience Specification

## Purpose
TBD - created by archiving change redesign-client-ocean-experience. Update Purpose after archive.
## Requirements
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

### Requirement: 首页瓶子弹窗收件箱

用户端首页 MUST 提供单个瓶子弹窗，用于浏览用户瓶子列表、查看瓶子内容和继续聊天。

#### Scenario: 用户捡到瓶子后查看内容

- **WHEN** 用户在首页成功捡到瓶子
- **THEN** 首页 MUST 在当前页面打开瓶子弹窗
- **AND** 弹窗 MUST 选中刚捡到的瓶子并展示瓶子内容
- **AND** 不得要求用户先跳转到独立瓶子详情页才能阅读内容。

#### Scenario: 用户打开瓶子列表

- **WHEN** 用户点击首页右上角瓶子数量入口
- **THEN** 首页 MUST 打开同一个瓶子弹窗
- **AND** 弹窗 MUST 展示当前用户可见的捡到和扔出的瓶子列表。

#### Scenario: 用户在弹窗中查看聊天

- **WHEN** 用户在弹窗列表中选择已经开启会话的瓶子
- **THEN** 弹窗 MUST 在右侧区域展示聊天窗口
- **AND** 用户 MUST 可以在该窗口内发送消息并刷新消息流。

#### Scenario: 用户在弹窗中回复未开启会话的瓶子

- **WHEN** 用户在弹窗列表中选择自己捡到且尚未开启会话的瓶子
- **THEN** 弹窗 MUST 展示瓶子内容和回复输入区域
- **AND** 回复成功后 MUST 在同一个弹窗内切换到聊天窗口。

