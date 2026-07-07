<template>
  <view class="home-page weather-sunny" :class="{ searching: pickPhase === 'searching' }">
    <OceanScene :phase="pickPhase" :disabled="pickDisabled" @pick="pickBottle" />

    <view class="home-content">
      <view class="topbar">
        <view class="brand-block">
          <image class="brand-logo" src="/static/brand/logo-mark.png" mode="aspectFit" />
          <view class="brand-copy">
            <text class="brand">HeartMessage</text>
            <text class="brand-subtitle">今日海面</text>
          </view>
        </view>
        <view class="top-actions">
          <button class="bottle-count-button" hover-class="none" @click="openBottleDock()">
            瓶子 {{ bottleCount }} 封
          </button>
          <text class="quota-chip">可捡 {{ session.quotas.pickRemaining }} 封</text>
          <button class="throw-top-button" hover-class="none" @click="throwBottle">投信</button>
        </view>
      </view>

      <view class="hero-layout">
        <view class="hero-copy">
          <text class="kicker">{{ displayName }}，潮水把远方送来了</text>
          <text class="headline">捡起一封漂来的心事</text>
          <text class="subline">海面正在发光，故事会顺着浪花靠近。这里适合慢慢读，也适合把没说完的话交给风。</text>
        </view>
      </view>

      <view class="shore-actions">
        <view class="tide-whisper">
          <view class="pulse-dot" />
          <view class="whisper-copy">
            <text class="whisper-title">{{ pickStatusText }}</text>
            <text class="whisper-subtitle">今日还可捡 {{ session.quotas.pickRemaining }} 封</text>
          </view>
        </view>

        <view class="shore-buttons">
          <button class="pick-button" hover-class="none" :disabled="pickDisabled" @click="pickBottle">
            {{ pickButtonText }}
          </button>
          <button class="throw-button" hover-class="none" @click="throwBottle">写信</button>
        </view>
      </view>
    </view>

    <BottleDock
      :visible="dockVisible"
      :selected-bottle-id="dockSelectedBottleId"
      @close="closeBottleDock"
      @count-change="updateBottleCount"
    />
  </view>
</template>

<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import BottleDock from "./components/BottleDock.vue";
import OceanScene from "./components/OceanScene.vue";
import { fetchBottleQuota, fetchMyBottles, pickBottle as requestPickBottle } from "../../services/bottles";
import { useSessionStore } from "../../stores/session";

const session = useSessionStore();
const pickPhase = ref<"idle" | "searching">("idle");
const bottleCount = ref(0);
const dockVisible = ref(false);
const dockSelectedBottleId = ref("");

const displayName = computed(() => session.profile?.nickname || "海面旅人");
const pickDisabled = computed(() => pickPhase.value === "searching" || session.quotas.pickRemaining <= 0);
const pickButtonText = computed(() => {
  if (pickPhase.value === "searching") {
    return "靠岸中";
  }

  if (session.quotas.pickRemaining <= 0) {
    return "明天来";
  }

  return "捞瓶子";
});
const pickStatusText = computed(() => {
  if (pickPhase.value === "searching") {
    return "浪花正在把瓶子推近岸边";
  }

  if (session.quotas.pickRemaining <= 0) {
    return "今天的潮汐已经安静下来";
  }

  return "海面上还有新的故事";
});

onShow(async () => {
  uni.hideTabBar({ animation: false });

  if (!session.isLoggedIn) {
    uni.navigateTo({
      url: "/pages/auth/login"
    });
    return;
  }

  if (!session.hasProfile) {
    await loadCurrentUser();
  }

  await refreshQuota();
  await refreshBottleCount();
});

async function loadCurrentUser() {
  try {
    await session.fetchCurrentUser();
  } catch (error) {
    showToast(getErrorMessage(error, "无法更新用户资料"));
  }
}

async function refreshQuota() {
  try {
    const quota = await fetchBottleQuota();
    session.applyQuota(quota);
  } catch (error) {
    showToast(getErrorMessage(error, "无法刷新今日额度"));
  }
}

async function refreshBottleCount() {
  try {
    const bottles = await fetchMyBottles();
    bottleCount.value = bottles.length;
  } catch (error) {
    showToast(getErrorMessage(error, "无法刷新瓶子数量"));
  }
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function pickBottle() {
  if (pickDisabled.value) {
    return;
  }

  pickPhase.value = "searching";
  const animation = wait(1250);

  try {
    const result = await requestPickBottle();
    await animation;
    session.applyQuota(result.quota);
    openBottleDock(result.bottle.id);
  } catch (error) {
    await animation;
    showToast(getErrorMessage(error, "暂时没有捡到瓶子"));
  } finally {
    pickPhase.value = "idle";
  }
}

function openBottleDock(bottleId = "") {
  dockSelectedBottleId.value = bottleId;
  dockVisible.value = true;
}

function closeBottleDock() {
  dockVisible.value = false;
}

function updateBottleCount(count: number) {
  bottleCount.value = count;
}

function throwBottle() {
  uni.navigateTo({
    url: "/pages/bottles/throw"
  });
}

function showToast(title: string) {
  uni.showToast({
    title,
    icon: "none"
  });
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}
</script>

<style scoped lang="scss">
.home-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: #133852;
  background: #bfeef0;
}

.home-content {
  position: relative;
  z-index: 8;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 32rpx;
  box-sizing: border-box;
  pointer-events: none;
}

.topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  pointer-events: auto;
}

.brand,
.brand-subtitle,
.bottle-count-button,
.quota-chip,
.kicker,
.headline,
.subline,
.whisper-title,
.whisper-subtitle {
  display: block;
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding-top: 4rpx;
}

.brand-logo {
  flex: 0 0 auto;
  width: 54rpx;
  height: 54rpx;
  border-radius: 14rpx;
  box-shadow: 0 12rpx 28rpx rgba(18, 117, 146, 0.14);
}

.brand-copy {
  min-width: 0;
}

.brand {
  color: #0d334f;
  font-size: 30rpx;
  font-weight: 900;
  line-height: 1;
}

.brand-subtitle {
  margin-top: 8rpx;
  color: rgba(19, 56, 82, 0.62);
  font-size: 22rpx;
  font-weight: 800;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.bottle-count-button {
  height: 58rpx;
  margin: 0;
  padding: 0 18rpx;
  color: #ffffff;
  background: rgba(239, 118, 83, 0.88);
  border: 1rpx solid rgba(255, 255, 255, 0.42);
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 58rpx;
  box-shadow: 0 14rpx 30rpx rgba(239, 118, 83, 0.18);
}

.quota-chip {
  min-width: 140rpx;
  padding: 10rpx 18rpx;
  color: rgba(13, 51, 79, 0.76);
  background: rgba(255, 255, 255, 0.62);
  border: 1rpx solid rgba(255, 255, 255, 0.72);
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 900;
  text-align: center;
  backdrop-filter: blur(14px);
  box-shadow: 0 12rpx 34rpx rgba(34, 94, 124, 0.1);
}

.throw-top-button {
  height: 58rpx;
  margin: 0;
  padding: 0 22rpx;
  color: #ffffff;
  background: rgba(14, 119, 149, 0.78);
  border: 1rpx solid rgba(255, 255, 255, 0.38);
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 58rpx;
  box-shadow: 0 14rpx 30rpx rgba(18, 117, 146, 0.18);
}

.hero-layout {
  display: flex;
  align-items: flex-start;
  flex: 1;
  padding-top: 72rpx;
  box-sizing: border-box;
}

.hero-copy {
  max-width: 690rpx;
  pointer-events: none;
}

.kicker {
  color: rgba(13, 51, 79, 0.72);
  font-size: 25rpx;
  font-weight: 900;
}

.headline {
  margin-top: 16rpx;
  color: #0e3654;
  font-size: 68rpx;
  font-weight: 900;
  line-height: 1.06;
  text-shadow: 0 8rpx 34rpx rgba(255, 255, 255, 0.56);
}

.subline {
  max-width: 640rpx;
  margin-top: 22rpx;
  color: rgba(15, 60, 84, 0.72);
  font-size: 27rpx;
  line-height: 1.68;
  text-shadow: 0 4rpx 22rpx rgba(255, 255, 255, 0.5);
}

.shore-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  width: 100%;
  padding-bottom: 28rpx;
  box-sizing: border-box;
  pointer-events: auto;
}

.tide-whisper {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 14rpx;
  padding: 14rpx 18rpx;
  background: rgba(255, 255, 255, 0.5);
  border: 1rpx solid rgba(255, 255, 255, 0.68);
  border-radius: 999rpx;
  backdrop-filter: blur(14px);
  box-shadow: 0 18rpx 44rpx rgba(31, 92, 112, 0.12);
}

.pulse-dot {
  flex: 0 0 auto;
  width: 18rpx;
  height: 18rpx;
  background: #ef7653;
  border-radius: 999rpx;
  box-shadow: 0 0 0 10rpx rgba(239, 118, 83, 0.14);
  animation: pulseDot 2.2s ease-in-out infinite;
}

.whisper-copy {
  min-width: 0;
}

.whisper-title {
  overflow: hidden;
  color: #123852;
  font-size: 24rpx;
  font-weight: 900;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.whisper-subtitle {
  margin-top: 5rpx;
  color: rgba(18, 56, 82, 0.6);
  font-size: 20rpx;
  font-weight: 800;
}

.shore-buttons {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 12rpx;
}

.pick-button,
.throw-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 72rpx;
  margin: 0;
  padding: 0 28rpx;
  border-radius: 999rpx;
  font-size: 25rpx;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 72rpx;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.pick-button {
  color: #ffffff;
  background: linear-gradient(135deg, #0c8aa2, #105c87);
  border: 0;
  box-shadow: 0 18rpx 32rpx rgba(14, 112, 146, 0.24);
}

.throw-button {
  color: #17445a;
  background: rgba(255, 255, 255, 0.64);
  border: 1rpx solid rgba(23, 68, 90, 0.1);
  box-shadow: 0 16rpx 32rpx rgba(31, 92, 112, 0.1);
}

.pick-button[disabled] {
  opacity: 0.58;
}

.searching .pick-button {
  transform: translateY(-2rpx);
}

@keyframes pulseDot {
  0%,
  100% {
    transform: scale(0.92);
    box-shadow: 0 0 0 8rpx rgba(239, 118, 83, 0.12);
  }

  50% {
    transform: scale(1.12);
    box-shadow: 0 0 0 16rpx rgba(239, 118, 83, 0.02);
  }
}

@media screen and (min-width: 900px) {
  .home-content {
    width: min(100%, 1180px);
    min-height: 100vh;
    margin: 0 auto;
    padding: 34px 32px 42px;
  }

  .brand {
    font-size: 19px;
  }

  .brand-logo {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .brand-subtitle {
    margin-top: 5px;
    font-size: 13px;
  }

  .quota-chip {
    min-width: 92px;
    padding: 7px 12px;
    font-size: 13px;
  }

  .bottle-count-button {
    height: 34px;
    padding: 0 12px;
    font-size: 13px;
    line-height: 34px;
  }

  .throw-top-button {
    height: 34px;
    padding: 0 15px;
    font-size: 13px;
    line-height: 34px;
  }

  .hero-layout {
    padding-top: 78px;
  }

  .hero-copy {
    max-width: 690px;
  }

  .kicker {
    font-size: 15px;
  }

  .headline {
    max-width: 620px;
    margin-top: 14px;
    font-size: 64px;
  }

  .subline {
    max-width: 520px;
    margin-top: 20px;
    font-size: 17px;
  }

  .shore-actions {
    max-width: 720px;
    padding-bottom: 0;
  }

  .tide-whisper {
    gap: 10px;
    padding: 10px 14px;
  }

  .pulse-dot {
    width: 9px;
    height: 9px;
  }

  .whisper-title {
    font-size: 14px;
  }

  .whisper-subtitle {
    margin-top: 3px;
    font-size: 12px;
  }

  .shore-buttons {
    gap: 8px;
  }

  .pick-button,
  .throw-button {
    height: 42px;
    padding: 0 20px;
    font-size: 14px;
    line-height: 42px;
  }
}

@media screen and (max-width: 520px) {
  .home-content {
    padding: 28rpx 24rpx 22rpx;
  }

  .topbar {
    align-items: flex-start;
  }

  .top-actions {
    flex-direction: column;
    align-items: flex-end;
    gap: 8rpx;
  }

  .quota-chip {
    min-width: 132rpx;
  }

  .hero-layout {
    padding-top: 62rpx;
  }

  .headline {
    font-size: 56rpx;
  }

  .subline {
    max-width: 560rpx;
    font-size: 25rpx;
  }

  .shore-actions {
    align-items: stretch;
    flex-direction: column;
    gap: 14rpx;
    padding-bottom: 0;
  }

  .tide-whisper {
    width: fit-content;
    max-width: 100%;
    box-sizing: border-box;
  }

  .shore-buttons {
    display: grid;
    grid-template-columns: 1fr auto;
    width: 100%;
    gap: 12rpx;
  }

  .pick-button,
  .throw-button {
    height: 76rpx;
    padding: 0 24rpx;
    font-size: 26rpx;
    line-height: 76rpx;
  }
}
</style>
