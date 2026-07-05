# 头像 R2 上传设计

## API

1. 客户端调用 `POST /v1/uploads/avatar`，提交文件名和内容类型。
2. API 校验登录态和内容类型，返回：
   - `objectKey`
   - `uploadUrl`
   - `publicUrl`
3. 客户端使用 `POST uploadUrl` 上传 multipart 文件字段 `file`。
4. API 校验：
   - object key 必须属于当前用户的 `avatars/<userId>/` 前缀。
   - 文件内容类型必须是 `image/jpeg`、`image/png` 或 `image/webp`。
   - 文件大小不得超过 5 MB。
5. API 使用 `MEDIA_BUCKET.put` 写入 R2，并返回同一个 `publicUrl`。
6. `GET /media/*` 从 R2 读取对象，设置内容类型和缓存头。

## 用户端

- 资料页点击选择头像后调用 `uni.chooseImage`。
- 根据文件扩展名或文件信息识别内容类型。
- 先申请上传票据，再使用 `uni.uploadFile` 上传。
- 上传成功后预览头像，并在保存资料时提交 `avatarUrl`。
- 性别使用明确选择控件，保存为 `male`、`female` 或 `unknown`。

## 安全

- 用户只能上传到自己的头像前缀。
- 不接收任意对象 key。
- 不把 R2 bucket 名、Cloudflare token 或真实生产域名写入代码。
- 上传失败时不更新资料中的头像地址。
