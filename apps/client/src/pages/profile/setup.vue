<template>
  <view class="screen">
    <text class="title">认识你一下</text>
    <text class="subtitle">这些资料会影响瓶子的匹配体验。</text>

    <view class="card avatar-card">
      <image v-if="form.avatarUrl" class="avatar-image" :src="form.avatarUrl" mode="aspectFill" />
      <view v-else class="avatar">{{ avatarInitial }}</view>
      <button class="secondary-button small-button" :disabled="uploadingAvatar" @click="chooseAvatar">
        {{ uploadingAvatar ? "上传中" : "选择头像" }}
      </button>
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
  margin: 36rpx 0;
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

.small-button {
  width: 220rpx;
  height: 72rpx;
  margin: 0;
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
</style>
