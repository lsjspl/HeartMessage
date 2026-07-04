<template>
  <view class="screen">
    <text class="title">认识你一下</text>
    <text class="subtitle">这些资料会影响瓶子的匹配体验。</text>

    <view class="card avatar-card">
      <view class="avatar">林</view>
      <button class="secondary-button small-button">选择头像</button>
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

    <button class="primary-button" :loading="loading" @click="submit">进入海面</button>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useSessionStore } from "../../stores/session";

const session = useSessionStore();
const loading = ref(false);
const form = reactive({
  nickname: "海边的林",
  age: 26,
  bio: "喜欢夜路、冷饮和突然出现的好消息。"
});

async function submit() {
  loading.value = true;

  try {
    await session.saveProfile({
      nickname: form.nickname,
      age: form.age,
      bio: form.bio,
      gender: "unknown"
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

.small-button {
  width: 220rpx;
  height: 72rpx;
  margin: 0;
}

.field {
  margin-bottom: 28rpx;
}
</style>
