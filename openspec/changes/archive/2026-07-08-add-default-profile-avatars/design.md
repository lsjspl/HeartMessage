# 用户默认头像库设计

## 头像资产

- 默认头像放在 `apps/client/src/static/avatars/defaults/`。
- 文件名使用稳定语义：
  - `male-01.png` 到 `male-04.png`
  - `female-01.png` 到 `female-04.png`
  - `animal-01.png` 到 `animal-03.png`
- 图片使用统一的正方形构图，适配圆形裁剪展示。
- 头像必须是项目内静态资源，不引用外部图片地址。

## 用户端

- 资料完善页头像区域展示当前头像预览。
- 默认头像按“男生”“女生”“动物动漫”分组显示。
- 点击默认头像立即更新 `form.avatarUrl`。
- 继续保留上传按钮；上传成功后把 `form.avatarUrl` 更新为上传后的公开地址。
- 当前选中的默认头像需要有明确选中态，避免用户不知道保存的是哪张。

## 契约

- 资料保存继续复用现有 `ProfileUpsertInput.avatarUrl`。
- 默认头像展示使用以 `/static/avatars/defaults/` 开头的项目内路径。
- 保存资料时客户端把默认头像路径转换为同源完整 URL，以满足现有 `avatarUrl` URL 契约。
- 不新增后端接口，不改数据库 schema。
