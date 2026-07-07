<template>
  <view class="screen">
    <text class="title">{{ bottle ? "你打开了一个瓶子" : "瓶子" }}</text>
    <text class="subtitle">{{ subtitle }}</text>

    <view v-if="!bottle" class="card empty-card">
      <text class="empty-title">还没有打开的瓶子</text>
      <text class="empty-text">可以先去海面捡一个，也可以扔出自己的瓶子。</text>
      <view class="action-grid">
        <button class="secondary-button" @click="goThrow">扔瓶子</button>
        <button class="primary-button" :disabled="isLoading" @click="pickNewBottle">
          {{ isLoading ? "正在打捞" : "捡瓶子" }}
        </button>
      </view>
    </view>

    <view v-else class="card letter-card">
      <view class="author-row">
        <view class="avatar">
          <image v-if="bottle.author.avatarUrl" class="avatar-image" :src="bottle.author.avatarUrl" mode="aspectFill" />
          <text v-else>{{ bottle.author.nickname.slice(0, 1) }}</text>
        </view>
        <view>
          <text class="author-name">{{ bottle.author.nickname }}</text>
          <text class="author-meta">{{ authorMeta }}</text>
          <text v-if="bottle.author.bio" class="author-bio">{{ bottle.author.bio }}</text>
        </view>
      </view>
      <text class="letter-text">{{ bottle.content }}</text>
    </view>

    <view v-if="bottle?.pickupId" class="reply-card card">
      <textarea class="textarea" v-model="replyContent" placeholder="写下你的回复..." />
    </view>

    <view v-if="bottle" class="action-grid">
      <button v-if="bottle.pickupId" class="danger-button" @click="removeBottle">删除</button>
      <button v-if="bottle.pickupId" class="primary-button" :disabled="isReplying || !replyContent.trim()" @click="reply">
        {{ isReplying ? "发送中" : "回复" }}
      </button>
      <button v-else class="secondary-button" @click="goThrow">继续扔瓶子</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import type { BottleView } from "@heart-message/shared";
import { deleteBottle, fetchBottleDetail, pickBottle, replyBottle } from "../../services/bottles";
import { useSessionStore } from "../../stores/session";

const bottle = ref<BottleView | null>(null);
const replyContent = ref("");
const isLoading = ref(false);
const isReplying = ref(false);
const session = useSessionStore();

const subtitle = computed(() => {
  if (!bottle.value) {
    return "从这里打开你刚捡到或刚扔出的瓶子。";
  }

  return bottle.value.pickupId ? "来自今日海面的漂流瓶。" : "这是你刚扔出的瓶子。";
});

const authorMeta = computed(() => {
  if (!bottle.value) {
    return "";
  }

  const age = bottle.value.author.age ? `${bottle.value.author.age} 岁` : "年龄未知";
  const genderMap = {
    male: "男",
    female: "女",
    unknown: "保密"
  };

  return `${age} · ${genderMap[bottle.value.author.gender]}`;
});

onLoad(async (query) => {
  const id = typeof query?.id === "string" ? query.id : "";

  if (id) {
    await loadBottle(id);
  }
});

async function loadBottle(id: string) {
  isLoading.value = true;

  try {
    bottle.value = await fetchBottleDetail(id);
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "瓶子不存在",
      icon: "none"
    });
  } finally {
    isLoading.value = false;
  }
}

async function pickNewBottle() {
  isLoading.value = true;

  try {
    const result = await pickBottle();
    bottle.value = result.bottle;
    session.applyQuota(result.quota);
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "暂时没有捡到瓶子",
      icon: "none"
    });
  } finally {
    isLoading.value = false;
  }
}

async function reply() {
  if (!bottle.value || isReplying.value || !replyContent.value.trim()) {
    return;
  }

  isReplying.value = true;

  try {
    const result = await replyBottle(bottle.value.id, replyContent.value);
    uni.redirectTo({
      url: `/pages/chats/detail?id=${result.conversationId}`
    });
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "回复失败",
      icon: "none"
    });
  } finally {
    isReplying.value = false;
  }
}

async function removeBottle() {
  if (!bottle.value) {
    return;
  }

  try {
    await deleteBottle(bottle.value.id);
    bottle.value = null;
    uni.showToast({
      title: "已删除",
      icon: "success"
    });
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "删除失败",
      icon: "none"
    });
  }
}

function goThrow() {
  uni.navigateTo({
    url: "/pages/bottles/throw"
  });
}
</script>

<style scoped lang="scss">
.letter-card {
  margin: 36rpx 0 28rpx;
  background: #fffaf0;
  border-color: #ecd9bd;
}

.empty-card,
.reply-card {
  margin: 36rpx 0 28rpx;
}

.empty-title,
.empty-text {
  display: block;
}

.empty-title {
  font-size: 32rpx;
  font-weight: 900;
}

.empty-text {
  margin: 12rpx 0 28rpx;
  color: #65758b;
  font-size: 26rpx;
  line-height: 1.6;
}

.author-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 28rpx;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  overflow: hidden;
  color: #ffffff;
  background: #0f8f8c;
  border-radius: 999rpx;
  font-weight: 900;
}

.avatar-image {
  width: 100%;
  height: 100%;
  display: block;
}

.author-name,
.author-meta,
.author-bio,
.letter-text {
  display: block;
}

.author-name {
  font-size: 28rpx;
  font-weight: 800;
}

.author-meta {
  margin-top: 6rpx;
  color: #65758b;
  font-size: 22rpx;
}

.author-bio {
  max-width: 520rpx;
  margin-top: 8rpx;
  color: #506176;
  font-size: 23rpx;
  line-height: 1.45;
}

.letter-text {
  color: #3b4558;
  font-size: 30rpx;
  line-height: 1.8;
}

.action-grid {
  display: flex;
  gap: 20rpx;
}

.action-grid button {
  flex: 1;
}
</style>
