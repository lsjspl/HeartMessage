<template>
  <view class="screen">
    <text class="title">你捡到一个瓶子</text>
    <text class="subtitle">来自 3 小时前的海面。</text>

    <view class="card letter-card">
      <view class="author-row">
        <view class="avatar">乔</view>
        <view>
          <text class="author-name">乔木</text>
          <text class="author-meta">27 岁 · 保密 · 城市夜行者</text>
        </view>
      </view>
      <text class="letter-text">
        如果你也刚好睡不着，可以告诉我一个最近支撑你的微小东西吗？我想收集一些不太响亮、但真的有用的答案。
      </text>
    </view>

    <view class="action-grid">
      <button class="danger-button">删除</button>
      <button class="primary-button" @click="reply">回复</button>
    </view>
  </view>
</template>

<script setup lang="ts">
function reply() {
  uni.navigateTo({
    url: "/pages/chats/detail?id=demo-conversation"
  });
}
</script>

<style scoped lang="scss">
.letter-card {
  margin: 36rpx 0 28rpx;
  background: #fffaf0;
  border-color: #ecd9bd;
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
  color: #ffffff;
  background: #0f8f8c;
  border-radius: 999rpx;
  font-weight: 900;
}

.author-name,
.author-meta,
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
