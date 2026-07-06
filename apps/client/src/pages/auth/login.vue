<template>
  <view class="screen login-screen">
    <view class="login-shell">
      <view class="brand-panel">
        <image class="hero-image" src="/static/home/ocean-hero.png" mode="aspectFill" />
        <view class="hero-shade"></view>
        <view class="brand-content">
          <view class="brand-mark">
            <image class="logo-mark" src="/static/brand/logo-mark.png" mode="aspectFit" />
          </view>
          <text class="title">把一句话交给海风</text>
          <text class="subtitle">随机遇见真实的人，也在无人可捞时遇见温柔的 AI 陪伴。</text>
        </view>
      </view>

      <view class="auth-panel">
        <view class="auth-card">
          <text class="auth-title">登录 HeartMessage</text>

          <button
            class="google-button"
            :disabled="loading || loadingConfig || !googleConfig?.configured"
            @click="startGoogleLogin"
          >
            <text class="google-mark">G</text>
            <text>Google 登录</text>
          </button>

          <button
            v-if="googleConfig?.devLoginAllowed && !googleConfig.configured"
            class="secondary-button dev-button"
            :disabled="loading"
            @click="loginWithGoogleDevCode"
          >
            本地 Google 登录
          </button>

          <view v-if="googleError || (!loadingConfig && googleConfig && !googleConfig.configured)" class="config-note">
            <text>{{ googleError || "Google 登录配置未完成" }}</text>
          </view>

          <view class="divider"><text>微信扫码</text></view>

          <view v-if="loadingConfig || loading" class="qr-placeholder">
            <text>{{ loading ? "正在登录" : "正在加载登录方式" }}</text>
          </view>

          <view v-else-if="wechatConfig?.configured" class="qr-box">
            <view :id="qrContainerId" class="wechat-qr"></view>
            <button class="secondary-button refresh-button" @click="renderWechatQr">刷新二维码</button>
          </view>

          <view v-else class="qr-placeholder">
            <text>{{ wechatError || "微信扫码登录配置未完成" }}</text>
            <button
              v-if="wechatConfig?.devLoginAllowed"
              class="secondary-button dev-button"
              :disabled="loading"
              @click="loginWithWechatDevCode"
            >
              本地微信登录
            </button>
          </view>

          <text class="terms">登录即代表同意服务协议和隐私政策</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import type { GoogleLoginConfig, WechatWebLoginConfig } from "@heart-message/shared";
import { fetchGoogleLoginConfig, fetchWechatWebLoginConfig } from "../../services/auth";
import { useSessionStore } from "../../stores/session";

interface WechatQrLoginOptions {
  self_redirect: boolean;
  id: string;
  appid: string;
  scope: "snsapi_login";
  redirect_uri: string;
  state: string;
  style?: "black" | "white";
  href?: string;
}

declare global {
  interface Window {
    WxLogin?: new (options: WechatQrLoginOptions) => unknown;
  }
}

const WECHAT_QR_SCRIPT_URL = "https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js";
const WECHAT_STATE_STORAGE_KEY = "heart_message_wechat_web_state";
const GOOGLE_STATE_STORAGE_KEY = "heart_message_google_state";
const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_SCOPE = "openid email profile";

const qrContainerId = "wechat-web-qr";
const loading = ref(false);
const loadingConfig = ref(false);
const wechatError = ref("");
const googleError = ref("");
const wechatConfig = ref<WechatWebLoginConfig | null>(null);
const googleConfig = ref<GoogleLoginConfig | null>(null);
const session = useSessionStore();

onLoad(async (query) => {
  const code = typeof query?.code === "string" ? query.code : "";
  const state = typeof query?.state === "string" ? query.state : "";

  if (code) {
    await loginWithProviderCode(code, state);
    return;
  }

  await loadLoginOptions();
});

async function loadLoginOptions() {
  loadingConfig.value = true;
  wechatError.value = "";
  googleError.value = "";

  try {
    const [wechat, google] = await Promise.allSettled([fetchWechatWebLoginConfig(), fetchGoogleLoginConfig()]);

    if (wechat.status === "fulfilled") {
      wechatConfig.value = wechat.value;
    } else {
      wechatConfig.value = null;
      wechatError.value = errorMessage(wechat.reason, "微信扫码登录配置加载失败");
    }

    if (google.status === "fulfilled") {
      googleConfig.value = google.value;
    } else {
      googleConfig.value = null;
      googleError.value = errorMessage(google.reason, "Google 登录配置加载失败");
    }

    if (wechatConfig.value?.configured && wechatConfig.value.appId) {
      loadingConfig.value = false;
      await nextTick();
      await loadWechatQrScript();
      renderWechatQr();
    }
  } catch (error) {
    wechatConfig.value = null;
    wechatError.value = errorMessage(error, "登录配置加载失败");
  } finally {
    loadingConfig.value = false;
  }
}

function startGoogleLogin() {
  if (!googleConfig.value?.clientId || loading.value) {
    return;
  }

  const state = createRandomState();
  uni.setStorageSync(GOOGLE_STATE_STORAGE_KEY, state);

  const url = new URL(GOOGLE_AUTH_ENDPOINT);
  url.searchParams.set("client_id", googleConfig.value.clientId);
  url.searchParams.set("redirect_uri", getAuthRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_SCOPE);
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  window.location.href = url.toString();
}

async function loginWithGoogleDevCode() {
  await loginWithGoogleCode("dev-google-code", "", true);
}

async function loginWithWechatDevCode() {
  await loginWithWechatCode("dev-web-code", "", true);
}

async function loginWithProviderCode(code: string, state: string) {
  if (isValidStoredState(GOOGLE_STATE_STORAGE_KEY, state)) {
    await loginWithGoogleCode(code, state, code.startsWith("dev-"));
    return;
  }

  if (isValidStoredState(WECHAT_STATE_STORAGE_KEY, state)) {
    await loginWithWechatCode(code, state, code.startsWith("dev-"));
    return;
  }

  uni.showToast({
    title: "登录状态已失效",
    icon: "none"
  });
}

async function loginWithGoogleCode(code: string, state: string, skipState: boolean) {
  if (loading.value) {
    return;
  }

  if (!skipState && !isValidStoredState(GOOGLE_STATE_STORAGE_KEY, state)) {
    uni.showToast({
      title: "Google 登录状态已失效",
      icon: "none"
    });
    return;
  }

  loading.value = true;

  try {
    const authSession = await session.loginWithGoogleCode(code, getAuthRedirectUri());
    uni.removeStorageSync(GOOGLE_STATE_STORAGE_KEY);
    await navigateAfterLogin(authSession.needsProfile);
  } catch (error) {
    showLoginError(error);
  } finally {
    loading.value = false;
  }
}

async function loginWithWechatCode(code: string, state: string, skipState: boolean) {
  if (loading.value) {
    return;
  }

  if (!skipState && !isValidStoredState(WECHAT_STATE_STORAGE_KEY, state)) {
    uni.showToast({
      title: "微信登录状态已失效",
      icon: "none"
    });
    return;
  }

  loading.value = true;

  try {
    const authSession = await session.loginWithWechatCode(code);
    uni.removeStorageSync(WECHAT_STATE_STORAGE_KEY);
    await navigateAfterLogin(authSession.needsProfile);
  } catch (error) {
    showLoginError(error);
  } finally {
    loading.value = false;
  }
}

async function navigateAfterLogin(needsProfile: boolean) {
  if (needsProfile) {
    uni.navigateTo({
      url: "/pages/profile/setup"
    });
    return;
  }

  uni.switchTab({
    url: "/pages/home/index"
  });
}

function loadWechatQrScript() {
  if (window.WxLogin) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${WECHAT_QR_SCRIPT_URL}"]`);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("微信二维码脚本加载失败")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = WECHAT_QR_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("微信二维码脚本加载失败"));
    document.head.appendChild(script);
  });
}

function renderWechatQr() {
  if (!wechatConfig.value?.appId || !window.WxLogin) {
    return;
  }

  const container = document.getElementById(qrContainerId);

  if (!container) {
    wechatConfig.value = null;
    wechatError.value = "微信扫码容器加载失败";
    return;
  }

  container.innerHTML = "";
  const state = createRandomState();
  uni.setStorageSync(WECHAT_STATE_STORAGE_KEY, state);

  new window.WxLogin({
    self_redirect: false,
    id: qrContainerId,
    appid: wechatConfig.value.appId,
    scope: "snsapi_login",
    redirect_uri: encodeURIComponent(getAuthRedirectUri()),
    state,
    style: "black"
  });
}

function getAuthRedirectUri() {
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("appid");
  url.searchParams.delete("scope");
  url.searchParams.delete("authuser");
  url.searchParams.delete("prompt");
  url.searchParams.delete("iss");
  url.searchParams.delete("error");
  url.searchParams.delete("error_description");
  return url.toString();
}

function createRandomState() {
  const bytes = new Uint8Array(16);

  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isValidStoredState(key: string, state: unknown) {
  const storedState = uni.getStorageSync(key);
  return (
    typeof state === "string" &&
    typeof storedState === "string" &&
    state.length > 0 &&
    storedState.length > 0 &&
    storedState === state
  );
}

function showLoginError(error: unknown) {
  uni.showToast({
    title: errorMessage(error, "登录失败"),
    icon: "none"
  });
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
</script>

<style scoped lang="scss">
.login-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  max-width: none;
  padding: 28rpx;
  background:
    linear-gradient(120deg, rgba(13, 55, 65, 0.58), rgba(248, 246, 233, 0.7) 54%, rgba(255, 253, 248, 0.84)),
    url("/static/home/ocean-hero.png") center / cover no-repeat;
}

.login-shell {
  display: grid;
  width: min(100%, 1120px);
  min-height: 720rpx;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.9);
  border: 1rpx solid rgba(255, 255, 255, 0.55);
  border-radius: 18rpx;
  box-shadow: 0 30rpx 86rpx rgba(8, 28, 45, 0.2);
  box-sizing: border-box;
}

.brand-panel,
.auth-panel {
  display: flex;
  flex-direction: column;
  padding: 44rpx;
  box-sizing: border-box;
}

.brand-panel {
  position: relative;
  justify-content: center;
  min-height: 420rpx;
  overflow: hidden;
  color: #ffffff;
}

.hero-image,
.hero-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hero-shade {
  background:
    linear-gradient(90deg, rgba(7, 34, 49, 0.7), rgba(7, 34, 49, 0.22) 62%, rgba(7, 34, 49, 0.08)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 244, 221, 0.16));
}

.brand-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  max-width: 620rpx;
}

.brand-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 108rpx;
  height: 108rpx;
  margin-bottom: 32rpx;
  color: #0f6b78;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 18rpx;
  font-size: 48rpx;
  font-weight: 900;
}

.logo-mark {
  width: 108rpx;
  height: 108rpx;
}

.brand-content .title {
  color: #ffffff;
  text-shadow: 0 6rpx 18rpx rgba(0, 0, 0, 0.24);
}

.brand-content .subtitle {
  width: min(100%, 520rpx);
  color: rgba(255, 255, 255, 0.88);
  text-shadow: 0 4rpx 14rpx rgba(0, 0, 0, 0.22);
}

.auth-panel {
  justify-content: center;
  background: #fffdf8;
}

.auth-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
}

.auth-title {
  color: #14213d;
  font-size: 36rpx;
  font-weight: 900;
  text-align: center;
}

.google-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18rpx;
  width: 100%;
  height: 88rpx;
  margin-top: 34rpx;
  color: #14213d;
  background: #ffffff;
  border: 1rpx solid rgba(42, 75, 96, 0.18);
  border-radius: 10rpx;
  font-size: 28rpx;
  font-weight: 800;
  box-shadow: 0 12rpx 26rpx rgba(20, 33, 61, 0.06);
}

.google-button[disabled] {
  opacity: 0.56;
}

.google-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42rpx;
  height: 42rpx;
  color: #ffffff;
  background: #1a73e8;
  border-radius: 50%;
  font-size: 24rpx;
  font-weight: 900;
}

.config-note {
  margin-top: 16rpx;
  color: #886226;
  font-size: 22rpx;
  line-height: 1.45;
  text-align: center;
}

.divider {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin: 36rpx 0 0;
  color: #65758b;
  font-size: 24rpx;
}

.divider::before,
.divider::after {
  flex: 1;
  height: 1rpx;
  background: rgba(42, 75, 96, 0.12);
  content: "";
}

.qr-box,
.qr-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 360rpx;
  min-height: 360rpx;
  margin: 26rpx auto 0;
  color: #65758b;
  background: #f5fbf8;
  border: 1rpx solid rgba(42, 75, 96, 0.12);
  border-radius: 10rpx;
  font-size: 26rpx;
  text-align: center;
  box-sizing: border-box;
}

.qr-box {
  flex-direction: column;
  gap: 24rpx;
  padding: 20rpx;
}

.qr-placeholder {
  flex-direction: column;
  padding: 28rpx;
  line-height: 1.5;
}

.wechat-qr {
  width: 300rpx;
  height: 300rpx;
  overflow: hidden;
}

.refresh-button,
.dev-button {
  height: 72rpx;
  font-size: 24rpx;
}

.refresh-button {
  width: 240rpx;
}

.dev-button {
  width: 260rpx;
  margin: 20rpx auto 0;
}

.terms {
  margin-top: 24rpx;
  color: rgba(20, 33, 61, 0.55);
  font-size: 22rpx;
  text-align: center;
}

@media screen and (min-width: 900px) {
  .login-screen {
    width: 100%;
    padding: 40px;
  }

  .login-shell {
    grid-template-columns: minmax(0, 1fr) 408px;
    min-height: 600px;
    border-radius: 14px;
  }

  .brand-panel,
  .auth-panel {
    padding: 44px;
  }

  .brand-panel {
    min-height: 600px;
  }

  .brand-content {
    max-width: 470px;
  }

  .brand-mark {
    width: 64px;
    height: 64px;
    margin-bottom: 28px;
    border-radius: 12px;
    font-size: 30px;
  }

  .logo-mark {
    width: 64px;
    height: 64px;
  }

  .brand-content .subtitle {
    width: 390px;
  }

  .auth-title {
    font-size: 24px;
  }

  .google-button {
    gap: 10px;
    height: 48px;
    margin-top: 20px;
    border-radius: 8px;
    font-size: 15px;
  }

  .google-mark {
    width: 24px;
    height: 24px;
    font-size: 14px;
  }

  .config-note {
    margin-top: 10px;
    font-size: 12px;
  }

  .divider {
    gap: 12px;
    margin-top: 22px;
    font-size: 13px;
  }

  .qr-box,
  .qr-placeholder {
    width: 240px;
    min-height: 240px;
    margin-top: 16px;
    border-radius: 12px;
    font-size: 14px;
  }

  .qr-box {
    gap: 16px;
    padding: 16px;
  }

  .wechat-qr {
    width: 204px;
    height: 204px;
  }

  .refresh-button,
  .dev-button {
    height: 40px;
    font-size: 14px;
  }

  .refresh-button {
    width: 150px;
  }

  .dev-button {
    width: 170px;
    margin-top: 12px;
  }

  .terms {
    margin-top: 14px;
    font-size: 12px;
  }
}
</style>
