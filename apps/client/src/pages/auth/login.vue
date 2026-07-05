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
import { onLoad } from "@dcloudio/uni-app";
import { useSessionStore } from "../../stores/session";

const loading = ref(false);
const session = useSessionStore();
const wechatAppId = import.meta.env.VITE_WECHAT_APP_ID ?? "";
const configuredRedirectUri = import.meta.env.VITE_WECHAT_REDIRECT_URI ?? "";
const isDev = import.meta.env.DEV;

onLoad(async (query) => {
  const code = typeof query?.code === "string" ? query.code : "";

  if (code) {
    await loginWithCode(code);
  }
});

async function handleLogin() {
  if (loading.value) {
    return;
  }

  if (wechatAppId) {
    redirectToWechatOauth();
    return;
  }

  if (!isDev) {
    uni.showToast({
      title: "微信登录配置未完成",
      icon: "none"
    });
    return;
  }

  await loginWithCode("dev-h5-code");
}

async function loginWithCode(code: string) {
  loading.value = true;

  try {
    const authSession = await session.loginWithWechatCode(code);

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

function redirectToWechatOauth() {
  const redirectUri = configuredRedirectUri || window.location.href.split("#")[0];
  const url = new URL("https://open.weixin.qq.com/connect/oauth2/authorize");
  url.searchParams.set("appid", wechatAppId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "snsapi_base");
  url.searchParams.set("state", "heart-message");
  window.location.href = `${url.toString()}#wechat_redirect`;
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
