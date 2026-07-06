<template>
  <view class="screen">
    <text class="title">认识你一下</text>
    <text class="subtitle">这些资料会影响瓶子的匹配体验。</text>

    <view class="card avatar-card">
      <image v-if="form.avatarUrl" class="avatar-image" :src="form.avatarUrl" mode="aspectFill" />
      <view v-else class="avatar">{{ avatarInitial }}</view>
      <view class="avatar-actions">
        <text class="avatar-title">头像</text>
        <button class="secondary-button small-button" :disabled="uploadingAvatar" @click="chooseAvatar">
          {{ uploadingAvatar ? "上传中" : "上传头像" }}
        </button>
      </view>
    </view>

    <view class="card default-avatar-card">
      <view v-for="group in defaultAvatarGroups" :key="group.title" class="avatar-group">
        <text class="avatar-group-title">{{ group.title }}</text>
        <view class="avatar-grid">
          <button
            v-for="avatar in group.options"
            :key="avatar.id"
            class="avatar-option"
            :class="{ active: isDefaultAvatarSelected(avatar.path) }"
            hover-class="none"
            @click="selectDefaultAvatar(avatar.path)"
          >
            <image class="default-avatar-image" :src="avatar.path" mode="aspectFill" />
          </button>
        </view>
      </view>
    </view>

    <view class="field">
      <text class="field-label">昵称</text>
      <input class="input" v-model="form.nickname" />
    </view>
    <view class="field">
      <text class="field-label">年龄</text>
      <input class="input" v-model.number="form.age" type="number" />
    </view>
    <view class="field">
      <text class="field-label">个人介绍</text>
      <textarea class="textarea" v-model="form.bio" />
    </view>
    <view class="field">
      <text class="field-label">性别</text>
      <view class="gender-segment">
        <button
          v-for="option in genderOptions"
          :key="option.value"
          class="gender-button"
          :class="{ active: form.gender === option.value }"
          @click="form.gender = option.value"
        >
          {{ option.label }}
        </button>
      </view>
    </view>

    <button class="primary-button" :loading="loading" @click="submit">进入海面</button>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import type { Gender } from "@heart-message/shared";
import { DEFAULT_AVATAR_GROUPS, toAvatarPath, toDefaultAvatarUrl } from "../../constants/default-avatars";
import { useSessionStore } from "../../stores/session";
import { resolveAvatarContentType, uploadAvatarFile } from "../../services/uploads";

const session = useSessionStore();
const loading = ref(false);
const uploadingAvatar = ref(false);
const form = reactive({
  nickname: session.profile?.nickname ?? "",
  avatarUrl: session.profile?.avatarUrl ?? "",
  age: session.profile?.age ? String(session.profile.age) : "",
  bio: session.profile?.bio ?? "",
  gender: (session.profile?.gender ?? "unknown") as Gender
});
const genderOptions: Array<{ label: string; value: Gender }> = [
  { label: "保密", value: "unknown" },
  { label: "男", value: "male" },
  { label: "女", value: "female" }
];
const defaultAvatarGroups = DEFAULT_AVATAR_GROUPS;
const avatarInitial = computed(() => form.nickname.trim().slice(0, 1) || "漂");

interface ChosenImageFile {
  path?: string;
  name?: string;
  type?: string;
}

function normalizeTempFiles(files: unknown) {
  return (Array.isArray(files) ? files : files ? [files] : []) as ChosenImageFile[];
}

function getFileName(filePath: string, file?: ChosenImageFile) {
  return file?.name || filePath.split(/[\\/]/).pop() || "avatar.jpg";
}

async function chooseAvatar() {
  if (uploadingAvatar.value) {
    return;
  }

  uploadingAvatar.value = true;

  try {
    const result = await uni.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"]
    });
    const filePath = result.tempFilePaths[0];
    const file = normalizeTempFiles(result.tempFiles)[0];

    if (!filePath) {
      throw new Error("没有选择头像");
    }

    const fileName = getFileName(filePath, file);
    const contentType = resolveAvatarContentType(fileName, file?.type);
    const uploaded = await uploadAvatarFile(filePath, fileName, contentType);
    form.avatarUrl = uploaded.publicUrl;
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "头像上传失败",
      icon: "none"
    });
  } finally {
    uploadingAvatar.value = false;
  }
}

function selectDefaultAvatar(path: string) {
  form.avatarUrl = toDefaultAvatarUrl(path);
}

function isDefaultAvatarSelected(path: string) {
  return toAvatarPath(form.avatarUrl) === path;
}

async function submit() {
  loading.value = true;

  try {
    const age = form.age ? Number(form.age) : undefined;

    await session.saveProfile({
      nickname: form.nickname.trim(),
      avatarUrl: form.avatarUrl || undefined,
      age: Number.isFinite(age) ? age : undefined,
      bio: form.bio.trim() || undefined,
      gender: form.gender
    });

    uni.switchTab({
      url: "/pages/home/index"
    });
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "保存失败",
      icon: "none"
    });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.avatar-card {
  display: flex;
  align-items: center;
  gap: 28rpx;
  margin: 36rpx 0 24rpx;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 128rpx;
  height: 128rpx;
  color: #ffffff;
  background: linear-gradient(135deg, #0f8f8c, #a18cd1);
  border-radius: 999rpx;
  font-size: 48rpx;
  font-weight: 900;
}

.avatar-image {
  width: 128rpx;
  height: 128rpx;
  border-radius: 999rpx;
  background: #e8eef2;
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.avatar-title {
  color: #14213d;
  font-size: 30rpx;
  font-weight: 900;
}

.small-button {
  width: 220rpx;
  height: 72rpx;
  margin: 0;
}

.default-avatar-card {
  margin-bottom: 28rpx;
}

.avatar-group + .avatar-group {
  margin-top: 24rpx;
}

.avatar-group-title {
  display: block;
  margin-bottom: 14rpx;
  color: #65758b;
  font-size: 24rpx;
  font-weight: 900;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14rpx;
}

.avatar-option {
  position: relative;
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #edf7f5;
  border: 4rpx solid transparent;
  border-radius: 999rpx;
  line-height: 1;
  box-sizing: border-box;
}

.avatar-option::after {
  border: 0;
}

.avatar-option.active {
  border-color: #ef7653;
  box-shadow:
    0 0 0 5rpx rgba(239, 118, 83, 0.14),
    0 14rpx 28rpx rgba(18, 117, 146, 0.16);
}

.default-avatar-image {
  width: 100%;
  height: 100%;
}

.field {
  margin-bottom: 28rpx;
}

.gender-segment {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}

.gender-button {
  height: 72rpx;
  margin: 0;
  color: #3b4558;
  background: #ffffff;
  border: 1rpx solid #d9e4e7;
  border-radius: 12rpx;
  font-size: 26rpx;
}

.gender-button.active {
  color: #ffffff;
  background: #0f8f8c;
  border-color: #0f8f8c;
}

@media screen and (min-width: 900px) {
  .avatar-card {
    gap: 18px;
    margin: 24px 0 16px;
  }

  .avatar,
  .avatar-image {
    width: 82px;
    height: 82px;
  }

  .avatar-title {
    font-size: 18px;
  }

  .default-avatar-card {
    margin-bottom: 20px;
  }

  .avatar-group + .avatar-group {
    margin-top: 18px;
  }

  .avatar-group-title {
    margin-bottom: 10px;
    font-size: 14px;
  }

  .avatar-grid {
    grid-template-columns: repeat(4, 78px);
    gap: 12px;
  }

  .avatar-option {
    border-width: 3px;
  }

  .avatar-option.active {
    box-shadow:
      0 0 0 3px rgba(239, 118, 83, 0.14),
      0 8px 18px rgba(18, 117, 146, 0.14);
  }
}
</style>
