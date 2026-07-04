<template>
  <view class="screen login-screen">
    <view class="brand-mark">H</view>
    <text class="title">把一句话交给海风</text>
    <text class="subtitle">随机遇见真实的人，也在无人可捞时遇见温柔的 AI 陪伴。</text>
    <button class="primary-button wechat-button" :loading="loading" @click="handleLogin">
      微信一键登录
    </button>
    <text class="terms">登录即代表同意服务协议和隐私政策</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useSessionStore } from "../../stores/session";

const loading = ref(false);
const session = useSessionStore();

async function handleLogin() {
  loading.value = true;

  try {
    const authSession = await session.loginWithWechatCode("dev-h5-code");

    if (authSession.needsProfile) {
      uni.navigateTo({
        url: "/pages/profile/setup"
      });
      return;
    }

    uni.switchTab({
      url: "/pages/home/index"
    });
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "登录失败",
      icon: "none"
    });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.login-screen {
  justify-content: center;
}

.brand-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 108rpx;
  height: 108rpx;
  margin-bottom: 32rpx;
  color: #ffffff;
  background: #0f8f8c;
  border-radius: 28rpx;
  font-size: 48rpx;
  font-weight: 900;
}

.wechat-button {
  margin-top: 56rpx;
  background: #13b957;
}

.terms {
  margin-top: 24rpx;
  color: rgba(20, 33, 61, 0.55);
  font-size: 22rpx;
  text-align: center;
}
</style>
