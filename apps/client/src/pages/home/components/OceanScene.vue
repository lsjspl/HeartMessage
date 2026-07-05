<template>
  <view class="ocean-scene" :class="sceneClass" @click="handlePick">
    <image class="scene-frame scene-base" src="/static/home/ocean-hero.png" mode="aspectFill" />
    <image class="scene-frame scene-clouds" src="/static/home/sky-horizon.png" mode="aspectFill" />

    <view class="horizon-layer" />
    <image class="scene-asset ship" src="/static/home/ship.png" mode="widthFix" />
    <view class="scene-asset lighthouse">
      <image class="lighthouse-image" src="/static/home/lighthouse.png" mode="widthFix" />
    </view>

    <image class="scene-asset plane" src="/static/home/generated/plane-overlay.png" mode="widthFix" />
    <view class="balloon-path">
      <image class="scene-asset balloon" src="/static/home/generated/balloon-overlay.png" mode="widthFix" />
    </view>

    <view class="wave-shimmer wave-shimmer-a" />
    <view class="wave-shimmer wave-shimmer-b" />
    <view class="water-motion water-motion-a" />
    <view class="water-motion water-motion-b" />
    <view class="shore-foam shore-foam-a" />
    <view class="shore-foam shore-foam-b" />
    <view class="bottle-stage">
      <image class="bottle-glass" src="/static/home/bottle-floating.png" mode="widthFix" />
      <view class="bottle-contact bottle-contact-a" />
      <view class="bottle-contact bottle-contact-b" />
      <view class="bottle-cork">
        <view class="cork-top" />
      </view>
      <view class="letter-flight">
        <view class="letter-page">
          <view class="letter-fold letter-fold-left" />
          <view class="letter-fold letter-fold-right" />
          <view class="letter-line letter-line-a" />
          <view class="letter-line letter-line-b" />
          <view class="letter-line letter-line-c" />
        </view>
      </view>
    </view>
    <view class="crab-path">
      <view class="crab-shadow" />
      <image class="scene-asset crab" src="/static/home/generated/crab-overlay.png" mode="widthFix" />
    </view>
    <view class="scene-soften" />
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  phase: "idle" | "searching";
  disabled: boolean;
}>();

const emit = defineEmits<{
  (event: "pick"): void;
}>();

const sceneClass = computed(() => ({
  searching: props.phase === "searching",
  "is-disabled": props.disabled
}));

function handlePick() {
  if (!props.disabled) {
    emit("pick");
  }
}
</script>

<style scoped lang="scss">
.ocean-scene {
  position: absolute;
  inset: 0;
  z-index: 1;
  min-height: 100vh;
  overflow: hidden;
  background: #c7f1ee;
  cursor: pointer;
}

.scene-frame {
  position: absolute;
  width: 100%;
  height: 100%;
}

.scene-frame {
  inset: 0;
  display: block;
}

.scene-base {
  transform: scale(1.02);
  transform-origin: 54% 58%;
}

.scene-clouds {
  top: -10%;
  right: -8%;
  bottom: auto;
  left: -8%;
  width: 116%;
  height: 54%;
  opacity: 0.34;
  mix-blend-mode: screen;
  animation: skyDrift 38s ease-in-out infinite alternate;
}

.horizon-layer,
.water-motion,
.wave-shimmer,
.scene-soften {
  position: absolute;
  pointer-events: none;
}

.horizon-layer {
  right: 0;
  bottom: 31%;
  left: 0;
  height: 22%;
  background:
    radial-gradient(ellipse at 18% 50%, rgba(255, 244, 193, 0.28), rgba(255, 244, 193, 0) 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(165, 230, 229, 0.2) 46%, rgba(255, 255, 255, 0));
  animation: horizonBreathe 12s ease-in-out infinite;
}

.scene-asset {
  position: absolute;
  display: block;
  pointer-events: none;
  will-change: transform;
}

.ship {
  top: 40.9%;
  left: 14.8%;
  z-index: 2;
  width: clamp(128px, 8.8vw, 172px);
  opacity: 0.42;
  filter: saturate(0.78) contrast(0.9) blur(0.18px);
  animation: distantBob 18s ease-in-out infinite;
}

.lighthouse {
  top: 35.4%;
  right: clamp(154px, 9.8vw, 196px);
  bottom: auto;
  z-index: 2;
  overflow: hidden;
  width: clamp(30px, 2.3vw, 44px);
  height: clamp(50px, 3.8vw, 70px);
  opacity: 0.62;
  filter: saturate(0.74) contrast(0.86) blur(0.14px) drop-shadow(0 4px 7px rgba(96, 76, 52, 0.04));
  -webkit-mask-image: linear-gradient(180deg, #000 0 80%, rgba(0, 0, 0, 0.5) 92%, rgba(0, 0, 0, 0) 100%);
  mask-image: linear-gradient(180deg, #000 0 80%, rgba(0, 0, 0, 0.5) 92%, rgba(0, 0, 0, 0) 100%);
}

.lighthouse-image {
  position: absolute;
  top: -2%;
  left: 0;
  z-index: 1;
  display: block;
  width: 100%;
}

.plane {
  top: 8%;
  left: -24%;
  z-index: 3;
  width: clamp(156px, 24vw, 336px);
  opacity: 0;
  filter: drop-shadow(0 10px 12px rgba(42, 93, 128, 0.12));
  animation: planeFlight 24s linear infinite;
  animation-delay: -7s;
}

.balloon-path {
  position: absolute;
  top: 12%;
  right: 15%;
  z-index: 4;
  width: clamp(54px, 7.4vw, 116px);
  pointer-events: none;
  animation: balloonDrift 26s ease-in-out infinite alternate;
  will-change: transform;
}

.balloon {
  position: relative;
  width: 100%;
  transform-origin: 50% 18%;
  filter: drop-shadow(0 18px 18px rgba(142, 109, 74, 0.12));
  animation: balloonSway 7.5s ease-in-out infinite;
}

.wave-shimmer {
  right: -8%;
  left: -8%;
  height: 16%;
  opacity: 0.3;
  background:
    repeating-linear-gradient(
      168deg,
      rgba(255, 255, 255, 0) 0,
      rgba(255, 255, 255, 0) 26px,
      rgba(255, 255, 255, 0.62) 34px,
      rgba(255, 255, 255, 0) 46px
    );
  mix-blend-mode: screen;
}

.wave-shimmer-a {
  bottom: 28%;
  animation: waveSlide 9s ease-in-out infinite;
}

.wave-shimmer-b {
  bottom: 18%;
  opacity: 0.2;
  transform: rotate(2deg);
  animation: waveSlide 12s ease-in-out infinite reverse;
}

.water-motion {
  right: -12%;
  left: -12%;
  z-index: 3;
  height: 34%;
  background:
    radial-gradient(ellipse at 18% 42%, rgba(255, 255, 255, 0.36), rgba(255, 255, 255, 0) 28%),
    radial-gradient(ellipse at 58% 58%, rgba(72, 203, 213, 0.22), rgba(72, 203, 213, 0) 34%),
    repeating-linear-gradient(
      171deg,
      rgba(255, 255, 255, 0) 0,
      rgba(255, 255, 255, 0) 30px,
      rgba(255, 255, 255, 0.38) 39px,
      rgba(97, 207, 216, 0.2) 52px,
      rgba(255, 255, 255, 0) 68px
    );
  mix-blend-mode: screen;
  opacity: 0.38;
  transform: skewY(-2deg);
  will-change: transform, opacity;
}

.water-motion-a {
  top: 41%;
  animation: waterCurrent 8.4s ease-in-out infinite;
}

.water-motion-b {
  top: 48%;
  opacity: 0.22;
  animation: waterCurrent 11s ease-in-out infinite reverse;
}

.shore-foam {
  position: absolute;
  right: -12%;
  left: -10%;
  z-index: 4;
  height: 18%;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 18% 68%, rgba(255, 255, 255, 0.72) 0 3%, rgba(255, 255, 255, 0) 17%),
    radial-gradient(ellipse at 44% 58%, rgba(255, 255, 255, 0.58) 0 4%, rgba(255, 255, 255, 0) 19%),
    radial-gradient(ellipse at 70% 54%, rgba(255, 255, 255, 0.64) 0 3%, rgba(255, 255, 255, 0) 17%),
    repeating-linear-gradient(
      166deg,
      rgba(255, 255, 255, 0) 0,
      rgba(255, 255, 255, 0) 34px,
      rgba(255, 255, 255, 0.46) 42px,
      rgba(255, 255, 255, 0) 58px
    );
  mix-blend-mode: screen;
  opacity: 0.42;
  transform: rotate(-2.5deg);
  will-change: transform, opacity;
}

.shore-foam-a {
  bottom: 16%;
  animation: foamWash 5.8s ease-in-out infinite;
}

.shore-foam-b {
  bottom: 22%;
  opacity: 0.26;
  animation: foamWash 7.4s ease-in-out infinite reverse;
}

.bottle-stage {
  position: absolute;
  right: clamp(182px, 26.6vw, 482px);
  bottom: clamp(74px, 12vh, 126px);
  z-index: 5;
  width: clamp(128px, 12.7vw, 200px);
  transform-origin: 48% 62%;
  animation: bottleFloat 5.8s ease-in-out infinite;
  pointer-events: none;
  will-change: transform;
}

.bottle-glass {
  position: relative;
  z-index: 2;
  display: block;
  width: 100%;
  filter: drop-shadow(0 22px 18px rgba(35, 86, 87, 0.18));
}

.bottle-contact {
  position: absolute;
  z-index: 3;
  pointer-events: none;
  border-radius: 999px;
  mix-blend-mode: screen;
  will-change: transform, opacity;
}

.bottle-contact-a {
  right: 16%;
  bottom: 27%;
  left: 8%;
  height: 16%;
  background:
    radial-gradient(ellipse at 18% 50%, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0) 56%),
    linear-gradient(90deg, rgba(255, 255, 255, 0.68), rgba(255, 255, 255, 0.12));
  opacity: 0.68;
  transform: rotate(-11deg);
  animation: bottleWash 3.4s ease-in-out infinite;
}

.bottle-contact-b {
  right: 22%;
  bottom: 20%;
  left: 16%;
  height: 10%;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.36), rgba(255, 255, 255, 0));
  opacity: 0.46;
  transform: rotate(-13deg);
  animation: bottleWash 4.6s ease-in-out infinite reverse;
}

.bottle-cork {
  position: absolute;
  top: 6%;
  left: 58%;
  z-index: 4;
  width: 13%;
  height: 18%;
  background: linear-gradient(135deg, #d49a54, #8f5a24 72%);
  border: 1px solid rgba(101, 62, 24, 0.22);
  border-radius: 44% 44% 34% 34%;
  box-shadow:
    inset 0 4px 8px rgba(255, 232, 174, 0.42),
    0 6px 12px rgba(107, 73, 38, 0.16);
  transform: rotate(29deg);
  transform-origin: 34% 78%;
  opacity: 0;
}

.cork-top {
  position: absolute;
  top: -9%;
  right: -7%;
  left: -7%;
  height: 27%;
  background: linear-gradient(90deg, #f2c47f, #b97835);
  border-radius: 999px;
}

.letter-flight {
  position: absolute;
  top: 0;
  left: 20%;
  z-index: 6;
  width: 58%;
  height: 38%;
  opacity: 0;
  transform: translate3d(0, 0, 0) rotate(20deg) scale(0.18);
  transform-origin: 12% 86%;
}

.letter-page {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(184, 134, 76, 0.22), rgba(184, 134, 76, 0) 12%, rgba(184, 134, 76, 0) 88%, rgba(184, 134, 76, 0.2)),
    linear-gradient(145deg, #fff9dd, #f3cf86);
  border: 1px solid rgba(126, 84, 35, 0.38);
  border-radius: 4px;
  box-shadow: 0 16px 24px rgba(78, 62, 36, 0.28);
  transform: scaleX(0.18) rotateX(22deg);
  transform-origin: 0 50%;
}

.letter-fold {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 35%;
  background: rgba(255, 255, 255, 0.22);
}

.letter-fold-left {
  left: 0;
  border-right: 1px solid rgba(166, 118, 58, 0.18);
}

.letter-fold-right {
  right: 0;
  border-left: 1px solid rgba(166, 118, 58, 0.16);
}

.letter-line {
  position: absolute;
  left: 18%;
  height: 5%;
  background: rgba(144, 96, 51, 0.34);
  border-radius: 999px;
  opacity: 0;
}

.letter-line-a {
  top: 30%;
  width: 58%;
}

.letter-line-b {
  top: 46%;
  width: 66%;
}

.letter-line-c {
  top: 62%;
  width: 44%;
}

.crab-path {
  position: absolute;
  right: clamp(26px, 8vw, 144px);
  bottom: clamp(36px, 8vh, 88px);
  z-index: 6;
  width: clamp(82px, 10vw, 142px);
  pointer-events: none;
  animation: crabScuttle 8.5s ease-in-out infinite;
  will-change: transform;
}

.crab {
  position: relative;
  width: 100%;
  transform-origin: 50% 76%;
  animation: crabBody 1.7s ease-in-out infinite;
}

.crab-shadow {
  position: absolute;
  right: 6%;
  bottom: -2%;
  left: 10%;
  height: 13%;
  background: rgba(100, 71, 40, 0.22);
  border-radius: 999px;
  filter: blur(7px);
  transform: skewX(-18deg);
}

.scene-soften {
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 6% 34%, rgba(255, 244, 198, 0.24), rgba(255, 244, 198, 0) 28%),
    linear-gradient(90deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.08) 38%, rgba(255, 255, 255, 0) 70%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0) 50%, rgba(246, 225, 162, 0.1));
}

.is-disabled {
  cursor: default;
}

.searching .scene-frame {
  filter: saturate(1.04) brightness(1.02);
}

.searching .bottle-stage {
  animation: bottleApproach 0.9s ease-in forwards;
}

.searching .bottle-cork {
  animation: corkPop 0.72s cubic-bezier(0.18, 0.8, 0.26, 1) 0.16s forwards;
}

.searching .letter-flight {
  animation: letterFly 1.18s cubic-bezier(0.2, 0.74, 0.22, 1) 0.28s forwards;
}

.searching .letter-page {
  animation: letterOpen 0.7s cubic-bezier(0.16, 0.86, 0.28, 1) 0.54s forwards;
}

.searching .letter-line {
  animation: letterInk 0.28s ease 0.82s forwards;
}

@keyframes skyDrift {
  from {
    transform: translate3d(-1.4%, 0, 0) scale(1.02);
  }

  to {
    transform: translate3d(1.2%, -1.4%, 0) scale(1.04);
  }
}

@keyframes horizonBreathe {
  0%,
  100% {
    opacity: 0.7;
    transform: translateY(0);
  }

  50% {
    opacity: 0.92;
    transform: translateY(-6px);
  }
}

@keyframes distantBob {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(-0.2deg);
  }

  50% {
    transform: translate3d(3px, -1px, 0) rotate(0.18deg);
  }
}

@keyframes planeFlight {
  0% {
    opacity: 0;
    transform: translate3d(-8vw, 28px, 0) scale(0.3) rotate(6deg);
  }

  8% {
    opacity: 0.74;
  }

  34% {
    opacity: 0.86;
    transform: translate3d(42vw, -8px, 0) scale(0.38) rotate(3.5deg);
  }

  58% {
    opacity: 0.84;
    transform: translate3d(78vw, -34px, 0) scale(0.34) rotate(1.2deg);
  }

  88% {
    opacity: 0.78;
    transform: translate3d(126vw, -66px, 0) scale(0.28) rotate(-1deg);
  }

  100% {
    opacity: 0;
    transform: translate3d(142vw, -76px, 0) scale(0.25) rotate(-1deg);
  }
}

@keyframes balloonDrift {
  0% {
    transform: translate3d(0, 0, 0);
  }

  40% {
    transform: translate3d(-28px, -18px, 0);
  }

  70% {
    transform: translate3d(-42px, 8px, 0);
  }

  100% {
    transform: translate3d(-14px, -26px, 0);
  }
}

@keyframes balloonSway {
  0%,
  100% {
    transform: rotate(-1.6deg);
  }

  50% {
    transform: rotate(2.2deg);
  }
}

@keyframes waveSlide {
  0%,
  100% {
    transform: translate3d(-1.5%, 0, 0);
  }

  50% {
    transform: translate3d(2.2%, -5px, 0);
  }
}

@keyframes waterCurrent {
  0%,
  100% {
    opacity: 0.26;
    transform: translate3d(-3.4%, 9px, 0) skewY(-2deg) scaleX(0.98);
  }

  46% {
    opacity: 0.5;
    transform: translate3d(3.2%, -7px, 0) skewY(-2deg) scaleX(1.05);
  }

  72% {
    opacity: 0.34;
    transform: translate3d(4.4%, 1px, 0) skewY(-2deg) scaleX(1);
  }
}

@keyframes foamWash {
  0%,
  100% {
    opacity: 0.26;
    transform: translate3d(-2.4%, 12px, 0) rotate(-2.5deg) scaleX(0.98);
  }

  46% {
    opacity: 0.52;
    transform: translate3d(1.8%, -10px, 0) rotate(-2.5deg) scaleX(1.03);
  }

  72% {
    opacity: 0.36;
    transform: translate3d(3.4%, -2px, 0) rotate(-2.5deg) scaleX(1);
  }
}

@keyframes bottleFloat {
  0%,
  100% {
    transform: translate3d(0, 12px, 0) rotate(50deg);
  }

  50% {
    transform: translate3d(6px, 5px, 0) rotate(47deg);
  }
}

@keyframes bottleApproach {
  from {
    transform: translate3d(0, 12px, 0) rotate(50deg) scale(1);
  }

  to {
    transform: translate3d(-32px, 26px, 0) rotate(44deg) scale(1.08);
  }
}

@keyframes bottleWash {
  0%,
  100% {
    opacity: 0.38;
    transform: translate3d(-5%, 2px, 0) rotate(-8deg) scaleX(0.94);
  }

  48% {
    opacity: 0.72;
    transform: translate3d(5%, -2px, 0) rotate(-8deg) scaleX(1.08);
  }
}

@keyframes corkPop {
  0% {
    opacity: 1;
    transform: translate3d(0, 0, 0) rotate(29deg) scale(1);
  }

  48% {
    opacity: 1;
    transform: translate3d(16%, -54%, 0) rotate(80deg) scale(0.94);
  }

  100% {
    opacity: 0;
    transform: translate3d(44%, -92%, 0) rotate(132deg) scale(0.74);
  }
}

@keyframes letterFly {
  0% {
    opacity: 0;
    transform: translate3d(0, 0, 0) rotate(20deg) scale(0.18);
  }

  22% {
    opacity: 1;
  }

  58% {
    opacity: 1;
    transform: translate3d(4%, -160%, 0) rotate(-14deg) scale(0.88);
  }

  100% {
    opacity: 1;
    transform: translate3d(-18%, -205%, 0) rotate(-8deg) scale(1.08);
  }
}

@keyframes letterOpen {
  0% {
    transform: scaleX(0.18) rotateX(22deg);
  }

  64% {
    transform: scaleX(1.08) rotateX(0);
  }

  100% {
    transform: scaleX(1) rotateX(0);
  }
}

@keyframes letterInk {
  from {
    opacity: 0;
    transform: translateX(-10%);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes crabScuttle {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }

  18% {
    transform: translate3d(-18px, -1px, 0);
  }

  32% {
    transform: translate3d(-12px, 1px, 0);
  }

  54% {
    transform: translate3d(-42px, -1px, 0);
  }

  76% {
    transform: translate3d(-30px, 0, 0);
  }
}

@keyframes crabBody {
  0%,
  100% {
    transform: rotate(-1deg) translateY(0);
  }

  50% {
    transform: rotate(1.2deg) translateY(-2px);
  }
}

@media screen and (max-width: 520px) {
  .scene-base {
    transform: scale(1.08);
    transform-origin: 56% 60%;
  }

  .scene-clouds {
    top: -6%;
    left: -34%;
    width: 154%;
    height: 44%;
    opacity: 0.28;
  }

  .ship {
    top: 41.5%;
    left: 13%;
    width: 78px;
    opacity: 0.42;
  }

  .lighthouse {
    top: 37%;
    right: 46px;
    bottom: auto;
    width: 18px;
    height: 31px;
    opacity: 0.58;
  }

  .plane {
    top: 6%;
    width: 184px;
    animation-duration: 20s;
  }

  .balloon-path {
    top: 26%;
    right: 8%;
    width: 48px;
  }

  .bottle-stage {
    right: 10%;
    bottom: 15%;
    width: 128px;
  }

  .crab-path {
    right: 8%;
    bottom: 7%;
    width: 88px;
  }

  .wave-shimmer-a {
    bottom: 25%;
  }

  .wave-shimmer-b {
    bottom: 15%;
  }

  .water-motion-a {
    top: 42%;
  }

  .water-motion-b {
    top: 50%;
  }

  .shore-foam-a {
    bottom: 15%;
  }

  .shore-foam-b {
    bottom: 20%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .scene-frame,
  .scene-asset,
  .horizon-layer,
  .water-motion,
  .wave-shimmer,
  .shore-foam,
  .bottle-stage,
  .bottle-cork,
  .letter-flight,
  .letter-page,
  .letter-line,
  .balloon-path,
  .crab-path,
  .crab {
    animation-duration: 1ms;
    animation-iteration-count: 1;
  }
}
</style>
