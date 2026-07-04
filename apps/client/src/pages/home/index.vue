<template>
  <view class="screen">
    <view class="home-head">
      <view>
        <text class="title">今日海面</text>
        <text class="subtitle">有人把心事放进了瓶子</text>
      </view>
      <view class="avatar">林</view>
    </view>

    <view class="quota-grid">
      <view class="card quota-card">
        <text class="quota-number">{{ session.quotas.pickRemaining }}</text>
        <text class="quota-label">可捡瓶子</text>
      </view>
      <view class="card quota-card">
        <text class="quota-number">{{ session.quotas.throwRemaining }}</text>
        <text class="quota-label">可扔瓶子</text>
      </view>
    </view>

    <view class="sea-card">
      <view class="bottle" />
      <view class="wave" />
    </view>

    <view class="action-grid">
      <button class="primary-button" @click="pickBottle">捡瓶子</button>
      <button class="secondary-button" @click="throwBottle">扔瓶子</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { useSessionStore } from "../../stores/session";

const session = useSessionStore();

onShow(async () => {
  if (!session.isLoggedIn) {
    uni.navigateTo({
      url: "/pages/auth/login"
    });
    return;
  }

  if (!session.hasProfile) {
    await session.fetchCurrentUser().catch(() => null);
  }
});

function pickBottle() {
  uni.navigateTo({
    url: "/pages/bottles/detail?id=demo-bottle"
  });
}

function throwBottle() {
  uni.navigateTo({
    url: "/pages/bottles/throw"
  });
}
</script>

<style scoped lang="scss">
.home-head,
.quota-grid,
.action-grid {
  display: flex;
  gap: 20rpx;
}

.home-head {
  align-items: center;
  justify-content: space-between;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  color: #ffffff;
  background: linear-gradient(135deg, #0f8f8c, #a18cd1);
  border-radius: 999rpx;
  font-weight: 900;
}

.quota-grid {
  margin: 36rpx 0 24rpx;
}

.quota-card {
  flex: 1;
}

.quota-number {
  display: block;
  font-size: 56rpx;
  font-weight: 900;
}

.quota-label {
  color: #65758b;
  font-size: 24rpx;
}

.sea-card {
  position: relative;
  height: 520rpx;
  overflow: hidden;
  background: linear-gradient(180deg, #e7fbf8 0%, #85dbcf 50%, #0f8f8c 100%);
  border-radius: 18rpx;
}

.bottle {
  position: absolute;
  top: 180rpx;
  left: 310rpx;
  width: 96rpx;
  height: 210rpx;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.12)),
    #ffbe78;
  border: 4rpx solid rgba(104, 70, 44, 0.22);
  border-radius: 52rpx 52rpx 28rpx 28rpx;
  transform: rotate(62deg);
}

.wave {
  position: absolute;
  right: -40rpx;
  bottom: 80rpx;
  left: -40rpx;
  height: 88rpx;
  background: rgba(255, 255, 255, 0.34);
  border-radius: 999rpx;
}

.action-grid {
  margin-top: 28rpx;
}

.action-grid button {
  flex: 1;
}
</style>
