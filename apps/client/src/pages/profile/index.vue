<template>
  <view class="screen">
    <view class="card profile-card">
      <view class="avatar">林</view>
      <text class="profile-name">{{ session.profile?.nickname || "未完善资料" }}</text>
      <text class="profile-bio">{{ session.profile?.bio || "把自己介绍给海风。" }}</text>
      <view class="stat-grid">
        <view class="stat"><text>12</text><text>扔出</text></view>
        <view class="stat"><text>48</text><text>捡到</text></view>
        <view class="stat"><text>9</text><text>聊天</text></view>
      </view>
    </view>

    <view class="settings">
      <view class="card setting">编辑资料</view>
      <view class="card setting">隐私设置</view>
      <view class="card setting">反馈与举报</view>
      <view class="card setting" @click="logout">退出登录</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { useSessionStore } from "../../stores/session";

const session = useSessionStore();

onShow(() => {
  session.fetchCurrentUser().catch(() => null);
});

function logout() {
  session.logout();
  uni.navigateTo({
    url: "/pages/auth/login"
  });
}
</script>

<style scoped lang="scss">
.profile-card {
  text-align: center;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 152rpx;
  height: 152rpx;
  margin: 0 auto 24rpx;
  color: #ffffff;
  background: linear-gradient(135deg, #0f8f8c, #a18cd1);
  border-radius: 999rpx;
  font-size: 56rpx;
  font-weight: 900;
}

.profile-name,
.profile-bio {
  display: block;
}

.profile-name {
  font-size: 38rpx;
  font-weight: 900;
}

.profile-bio {
  margin-top: 12rpx;
  color: #65758b;
  font-size: 26rpx;
  line-height: 1.6;
}

.stat-grid {
  display: flex;
  gap: 16rpx;
  margin-top: 28rpx;
}

.stat {
  flex: 1;
  padding: 18rpx 0;
  background: #f7f9fb;
  border-radius: 16rpx;
}

.stat text {
  display: block;
}

.stat text:first-child {
  font-size: 34rpx;
  font-weight: 900;
}

.stat text:last-child {
  color: #65758b;
  font-size: 22rpx;
}

.settings {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 28rpx;
}

.setting {
  font-size: 28rpx;
  font-weight: 800;
}
</style>
