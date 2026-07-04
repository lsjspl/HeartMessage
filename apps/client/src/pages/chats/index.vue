<template>
  <view class="screen">
    <text class="title">我的瓶子</text>
    <text class="subtitle">回复、聊天和已删除关系。</text>

    <view class="tabs">
      <view class="tab active">聊天中</view>
      <view class="tab">我捡到</view>
      <view class="tab">我扔出</view>
    </view>

    <view class="message-list">
      <view v-for="item in conversations" :key="item.name" class="card message-item" @click="openChat">
        <view class="avatar">{{ item.name.slice(0, 1) }}</view>
        <view class="message-main">
          <text class="message-name">{{ item.name }}</text>
          <text class="message-preview">{{ item.preview }}</text>
        </view>
        <text v-if="item.unread" class="badge">{{ item.unread }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const conversations = [
  { name: "乔木", preview: "风这个答案好自由。", unread: 2 },
  { name: "夏迟", preview: "我刚刚看到你的瓶子。", unread: 1 },
  { name: "海雾电台", preview: "今晚给你留了一段话。", unread: 0 }
];

function openChat() {
  uni.navigateTo({
    url: "/pages/chats/detail?id=demo-conversation"
  });
}
</script>

<style scoped lang="scss">
.tabs {
  display: flex;
  gap: 8rpx;
  padding: 8rpx;
  margin: 36rpx 0 24rpx;
  background: #f2f5f7;
  border-radius: 16rpx;
}

.tab {
  flex: 1;
  padding: 18rpx 0;
  color: #68778a;
  border-radius: 12rpx;
  font-size: 24rpx;
  font-weight: 800;
  text-align: center;
}

.tab.active {
  color: #075c66;
  background: #ffffff;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.message-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76rpx;
  height: 76rpx;
  color: #ffffff;
  background: linear-gradient(135deg, #0f8f8c, #a18cd1);
  border-radius: 999rpx;
  font-weight: 900;
}

.message-main {
  flex: 1;
  min-width: 0;
}

.message-name,
.message-preview {
  display: block;
}

.message-name {
  font-size: 28rpx;
  font-weight: 800;
}

.message-preview {
  margin-top: 8rpx;
  overflow: hidden;
  color: #65758b;
  font-size: 24rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 42rpx;
  height: 42rpx;
  color: #ffffff;
  background: #ff8066;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 800;
}
</style>
