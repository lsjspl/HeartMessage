<template>
  <section>
    <div class="page-head">
      <div>
        <h1>运营工作台</h1>
        <p>今日瓶子流转、聊天增长、AI 补位和内容安全概览。</p>
      </div>
      <el-button :loading="loading" @click="loadDashboard">刷新</el-button>
    </div>

    <div class="metric-grid">
      <el-card v-for="metric in metrics" :key="metric.label" class="metric-card" shadow="never">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
        <el-tag :type="metric.type" effect="light">{{ metric.note }}</el-tag>
      </el-card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { adminRequest } from "../services/api";

interface DashboardStats {
  thrownToday: number;
  pickedToday: number;
  conversationsStarted: number;
  aiFilledBottles: number;
  contentBlockedToday: number;
}

const loading = ref(false);
const stats = ref<DashboardStats>({
  thrownToday: 0,
  pickedToday: 0,
  conversationsStarted: 0,
  aiFilledBottles: 0,
  contentBlockedToday: 0
});

const metrics = computed(() => [
  { label: "今日扔瓶", value: stats.value.thrownToday, note: "真实 D1 统计", type: "success" as const },
  { label: "今日捡瓶", value: stats.value.pickedToday, note: "真实 D1 统计", type: "success" as const },
  { label: "开启聊天", value: stats.value.conversationsStarted, note: "今日新增", type: "primary" as const },
  { label: "AI 补位", value: stats.value.aiFilledBottles, note: "AI 来源瓶子", type: "warning" as const },
  { label: "内容拦截", value: stats.value.contentBlockedToday, note: "今日拦截", type: "danger" as const }
]);

onMounted(loadDashboard);

async function loadDashboard() {
  loading.value = true;

  try {
    stats.value = await adminRequest<DashboardStats>("/dashboard");
  } finally {
    loading.value = false;
  }
}
</script>
