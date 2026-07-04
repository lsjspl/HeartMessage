# 平台基础搭建

## 为什么

在实现产品功能之前，项目需要先有稳定的工程基础。这个基础必须支持 OpenSpec 驱动开发、H5 优先交付、后续小程序和 App 构建、Cloudflare 部署，以及多平台 AI 模型接入。

## 改动内容

- 添加 OpenSpec 项目指南和初始平台基础规格。
- 创建 pnpm workspace monorepo。
- 搭建 uni-app 用户端框架。
- 搭建 Vue 3 管理后台框架。
- 搭建 Cloudflare Worker API 框架。
- 添加共享契约包、D1 schema 包和 AI 适配接口包。

## 影响范围

- 开发者得到一个边界清晰的单仓库工程。
- 后续功能都可以从 OpenSpec 变更开始推进。
- 第一批 MVP 功能可以在不改项目结构的前提下实现。
