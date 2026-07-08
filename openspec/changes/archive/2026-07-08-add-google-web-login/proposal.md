# Web Google 登录

## Purpose

当前 Web 登录页只有微信扫码登录。面向普通电脑浏览器用户时，需要提供 Google 登录入口，并让微信、Google 两种方式共用同一套用户、Token、资料完善和登录保护流程。现有用户表把微信 openid 作为必填字段，无法自然承载 Google 用户，因此需要引入通用登录身份表。

## What Changes

- 登录页优化为 Web 多登录方式布局，同时展示 Google 登录和微信扫码登录。
- 增加 Google OAuth 授权码登录入口，使用 `openid email profile` 范围获取用户身份。
- API 增加 Google 登录配置查询和 code 登录接口。
- 用户身份改为通用 provider 映射，微信和 Google 登录都映射到同一用户表。
- 数据库新增 `user_auth_identities` 表，并放宽 `users.wechat_open_id` 约束。
- 后台敏感配置列表增加 Google OAuth Client ID 和 Client Secret。

## Impact

- 影响 `apps/client` 登录页、认证服务和 session store。
- 影响 `apps/api` 认证路由、用户服务、Google OAuth 服务和敏感配置定义。
- 影响 `packages/shared` 认证 DTO。
- 影响 `packages/db` schema 和 D1 migration。
- 不执行生产环境迁移，不写入真实 Google 密钥。
