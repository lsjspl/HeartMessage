<template>
  <slot />
</template>

<script setup lang="ts">
import { onLaunch, onShow } from "@dcloudio/uni-app";

onLaunch(() => {
  console.log("HeartMessage client launched");
});

onShow(() => {
  console.log("HeartMessage client shown");
});
</script>
