<template>
  <view class="throw-screen" :class="{ launching: isLaunching }">
    <view class="throw-shell">
      <view class="page-head">
        <text class="eyebrow">Drift Bottle</text>
        <text class="title">扔一个瓶子</text>
        <text class="subtitle">当天有效，夜里会被海浪带走。</text>
      </view>

      <view class="composer-panel">
        <view class="paper">
          <textarea
            class="textarea bottle-textarea"
            v-model="content"
            maxlength="800"
            placeholder="把今天想说的话写进瓶子..."
          />
          <view class="paper-meta">
            <text>{{ content.length }}/800</text>
            <text>今日还可扔 {{ session.quotas.throwRemaining }} 个</text>
          </view>
        </view>

        <view class="option-row">
          <button class="secondary-button option-button" :class="{ active: isAnonymous }" @click="isAnonymous = !isAnonymous">
            {{ isAnonymous ? "匿名漂流" : "展示资料" }}
          </button>
          <button class="secondary-button option-button" @click="clearContent">清空</button>
        </view>
      </view>

      <view class="launch-panel">
        <view class="shoreline">
          <view class="launch-bottle">
            <view class="launch-neck" />
            <view class="launch-body">
              <view class="launch-letter" />
            </view>
          </view>
          <view class="shore-wave wave-a" />
          <view class="shore-wave wave-b" />
        </view>

        <view class="launch-copy">
          <text class="launch-title">{{ isAnonymous ? "匿名瓶子" : "带着你的名字" }}</text>
          <text class="launch-text">{{ previewText }}</text>
        </view>

        <button class="primary-button submit-button" :disabled="submitDisabled" @click="submit">
          {{ isSubmitting ? "正在推向海面" : "封进瓶子" }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import { fetchBottleQuota, throwBottle } from "../../services/bottles";
import { useSessionStore } from "../../stores/session";

const content = ref("今天突然很想问：你最近一次觉得生活变轻，是因为什么？");
const isAnonymous = ref(false);
const isSubmitting = ref(false);
const isLaunching = ref(false);
const session = useSessionStore();

const previewText = computed(() => {
  const text = content.value.trim();

  if (!text) {
    return "瓶子里还空着。";
  }

  return text.length > 52 ? `${text.slice(0, 52)}...` : text;
});
const submitDisabled = computed(
  () => isSubmitting.value || !content.value.trim() || session.quotas.throwRemaining <= 0
);

onShow(async () => {
  const quota = await fetchBottleQuota().catch(() => null);

  if (quota) {
    session.applyQuota(quota);
  }
});

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function clearContent() {
  if (isSubmitting.value) {
    return;
  }

  content.value = "";
}

async function submit() {
  if (submitDisabled.value) {
    return;
  }

  isSubmitting.value = true;
  isLaunching.value = true;
  const animation = wait(900);

  try {
    const result = await throwBottle({
      content: content.value.trim(),
      isAnonymous: isAnonymous.value,
      mediaKeys: []
    });
    await animation;
    session.applyQuota(result.quota);
    uni.showToast({
      title: "瓶子已经漂出去了",
      icon: "success"
    });
    uni.redirectTo({
      url: `/pages/bottles/detail?id=${result.bottle.id}`
    });
  } catch (error) {
    await animation;
    uni.showToast({
      title: error instanceof Error ? error.message : "扔瓶子失败",
      icon: "none"
    });
  } finally {
    isSubmitting.value = false;
    isLaunching.value = false;
  }
}
</script>

<style scoped lang="scss">
.throw-screen {
  min-height: 100vh;
  color: #14213d;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.74), rgba(255, 255, 255, 0) 34%),
    linear-gradient(155deg, #e8f4ee 0%, #fff7e9 50%, #9dd2d1 100%);
}

.throw-shell {
  display: grid;
  gap: 28rpx;
  min-height: 100vh;
  padding: 34rpx 30rpx 42rpx;
  box-sizing: border-box;
}

.page-head {
  align-self: end;
}

.eyebrow,
.title,
.subtitle,
.paper-meta text,
.launch-title,
.launch-text {
  display: block;
}

.eyebrow {
  color: #b75f3f;
  font-size: 22rpx;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.title {
  margin-top: 12rpx;
  color: #10233f;
  font-size: 54rpx;
  font-weight: 900;
  line-height: 1.1;
}

.subtitle {
  margin-top: 12rpx;
  color: #637384;
  font-size: 26rpx;
  line-height: 1.5;
}

.composer-panel,
.launch-panel {
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx solid rgba(42, 75, 96, 0.12);
  border-radius: 26rpx;
  box-shadow: 0 24rpx 64rpx rgba(20, 33, 61, 0.11);
  backdrop-filter: blur(14px);
}

.composer-panel {
  padding: 24rpx;
}

.paper {
  padding: 22rpx;
  background:
    linear-gradient(#fffaf0 62rpx, #efe2c8 64rpx),
    #fffaf0;
  background-size: 100% 64rpx;
  border: 1rpx solid #ead6b8;
  border-radius: 18rpx;
  box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.65);
}

.bottle-textarea {
  min-height: 360rpx;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  font-size: 30rpx;
  line-height: 64rpx;
}

.paper-meta {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  margin-top: 18rpx;
  color: #8a735d;
  font-size: 22rpx;
}

.option-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 20rpx;
}

.option-button {
  height: 76rpx;
  margin: 0;
}

.option-button.active {
  color: #ffffff;
  background: #17445a;
}

.launch-panel {
  display: grid;
  gap: 22rpx;
  padding: 24rpx;
}

.shoreline {
  position: relative;
  height: 330rpx;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 247, 233, 0.95) 0 32%, rgba(125, 195, 196, 0.72) 33% 100%),
    #8ecaca;
  border-radius: 20rpx;
}

.shore-wave {
  position: absolute;
  right: -18%;
  left: -18%;
  height: 48rpx;
  background: rgba(255, 255, 255, 0.52);
  border-radius: 999rpx;
}

.wave-a {
  top: 43%;
  animation: shoreWave 6s ease-in-out infinite;
}

.wave-b {
  top: 60%;
  opacity: 0.72;
  animation: shoreWave 7.5s ease-in-out infinite reverse;
}

.launch-bottle {
  position: absolute;
  top: 84rpx;
  left: 50%;
  z-index: 1;
  width: 90rpx;
  height: 178rpx;
  transform: translateX(-50%) rotate(55deg);
  transform-origin: 50% 75%;
  transition: transform 0.3s ease;
  animation: readyBottle 3.8s ease-in-out infinite;
}

.launching .launch-bottle {
  animation: launchBottle 0.9s ease-in forwards;
}

.launch-neck {
  position: absolute;
  top: 0;
  left: 31rpx;
  width: 28rpx;
  height: 46rpx;
  background: rgba(255, 246, 220, 0.72);
  border: 3rpx solid rgba(86, 64, 42, 0.18);
  border-bottom: 0;
  border-radius: 14rpx 14rpx 8rpx 8rpx;
}

.launch-body {
  position: absolute;
  top: 40rpx;
  left: 8rpx;
  width: 74rpx;
  height: 130rpx;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.08)),
    rgba(244, 174, 94, 0.78);
  border: 4rpx solid rgba(86, 64, 42, 0.2);
  border-radius: 38rpx 38rpx 22rpx 22rpx;
  box-shadow: 0 18rpx 34rpx rgba(69, 61, 46, 0.18);
}

.launch-letter {
  position: absolute;
  right: 20rpx;
  bottom: 30rpx;
  width: 26rpx;
  height: 54rpx;
  background: #fff8dc;
  border-radius: 999rpx;
}

.launch-title {
  color: #17314c;
  font-size: 30rpx;
  font-weight: 900;
}

.launch-text {
  min-height: 78rpx;
  margin-top: 10rpx;
  color: #627386;
  font-size: 25rpx;
  line-height: 1.55;
}

.submit-button {
  margin: 0;
}

@keyframes shoreWave {
  0%,
  100% {
    transform: translateX(-4%);
  }

  50% {
    transform: translateX(4%);
  }
}

@keyframes readyBottle {
  0%,
  100% {
    transform: translateX(-50%) rotate(55deg) translateY(0);
  }

  50% {
    transform: translateX(-50%) rotate(49deg) translateY(-12rpx);
  }
}

@keyframes launchBottle {
  0% {
    opacity: 1;
    transform: translateX(-50%) rotate(55deg) translateY(0) scale(1);
  }

  70% {
    opacity: 1;
    transform: translateX(68%) rotate(72deg) translateY(74rpx) scale(0.82);
  }

  100% {
    opacity: 0;
    transform: translateX(126%) rotate(78deg) translateY(118rpx) scale(0.68);
  }
}

@media screen and (min-width: 900px) {
  .throw-shell {
    grid-template-columns: minmax(0, 1fr) 380px;
    grid-template-rows: auto 1fr;
    gap: 28px;
    width: min(100%, 1120px);
    margin: 0 auto;
    padding: 46px 32px;
  }

  .page-head {
    grid-column: 1 / -1;
  }

  .title {
    font-size: 44px;
  }

  .subtitle {
    font-size: 16px;
  }

  .composer-panel,
  .launch-panel {
    border-radius: 18px;
  }

  .composer-panel {
    padding: 24px;
  }

  .paper {
    padding: 22px;
    border-radius: 14px;
  }

  .bottle-textarea {
    min-height: 430px;
    font-size: 18px;
  }

  .paper-meta {
    font-size: 13px;
  }

  .launch-panel {
    align-self: start;
    padding: 22px;
  }

  .shoreline {
    height: 290px;
    border-radius: 14px;
  }

  .launch-title {
    font-size: 20px;
  }

  .launch-text {
    font-size: 14px;
  }
}
</style>
