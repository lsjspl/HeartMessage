<template>
  <view class="screen chat-screen">
    <view class="chat-head card">
      <view class="avatar">乔</view>
      <view>
        <text class="message-name">乔木</text>
        <text class="message-preview">由瓶子开启</text>
      </view>
    </view>

    <view class="chat-stream">
      <view class="bubble left">你说的微小东西，我最近想到的是便利店门口的热豆浆。</view>
      <view class="bubble right">这很具体，也很温暖。我最近是下班路上的风。</view>
      <view class="bubble left">风这个答案好自由。</view>
    </view>

    <view class="chat-input">
      <input class="input" placeholder="输入回复..." />
      <button class="primary-button send-button">发</button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.chat-screen {
  padding-bottom: 132rpx;
}

.chat-head {
  display: flex;
  align-items: center;
  gap: 20rpx;
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

.message-name,
.message-preview {
  display: block;
}

.message-name {
  font-size: 28rpx;
  font-weight: 800;
}

.message-preview {
  margin-top: 6rpx;
  color: #65758b;
  font-size: 22rpx;
}

.chat-stream {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 28rpx;
}

.bubble {
  max-width: 520rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  line-height: 1.6;
}

.bubble.left {
  color: #283747;
  background: #ffffff;
  border: 1rpx solid #d9e4e7;
}

.bubble.right {
  align-self: flex-end;
  color: #ffffff;
  background: #0f8f8c;
}

.chat-input {
  position: fixed;
  right: 24rpx;
  bottom: 24rpx;
  left: 24rpx;
  display: flex;
  gap: 16rpx;
}

.chat-input .input {
  flex: 1;
}

.send-button {
  width: 96rpx;
  height: 84rpx;
}
</style>
