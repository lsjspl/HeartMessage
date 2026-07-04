<template>
  <view class="screen">
    <text class="title">扔一个瓶子</text>
    <text class="subtitle">当天有效，明天会被海浪带走。</text>

    <view class="card composer">
      <textarea class="textarea bottle-textarea" v-model="content" />
      <view class="composer-tools">
        <button class="secondary-button tool-button">图片</button>
        <button class="secondary-button tool-button">匿名</button>
        <button class="secondary-button tool-button">预览</button>
      </view>
      <button class="primary-button" @click="submit">封进瓶子</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";

const content = ref("今天突然很想问：你最近一次觉得生活变轻，是因为什么？");

function submit() {
  uni.switchTab({
    url: "/pages/home/index"
  });
}
</script>

<style scoped lang="scss">
.composer {
  margin-top: 36rpx;
}

.bottle-textarea {
  min-height: 360rpx;
  background:
    linear-gradient(#fffaf0 58rpx, #f1e6cd 60rpx),
    #fffaf0;
  background-size: 100% 60rpx;
}

.composer-tools {
  display: flex;
  gap: 16rpx;
  margin: 24rpx 0;
}

.tool-button {
  flex: 1;
  height: 72rpx;
}
</style>
