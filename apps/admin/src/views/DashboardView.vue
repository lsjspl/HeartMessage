<template>
  <section>
    <div class="page-head">
      <div>
        <h1>运营工作台</h1>
        <p>今日瓶子流转、聊天增长、AI 补位和内容安全概览。</p>
      </div>
      <div>
        <el-button :loading="loading" @click="loadDashboard">刷新</el-button>
      </div>
    </div>

    <div class="metric-grid">
      <el-card v-for="metric in metrics" :key="metric.label" class="metric-card" shadow="never">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
        <el-tag :type="metric.type" effect="light">{{ metric.note }}</el-tag>
      </el-card>
    </div>

    <div class="panel-grid">
      <el-card shadow="never">
        <h2 class="panel-title">最近瓶子</h2>
        <el-table :data="bottles" stripe>
          <el-table-column prop="authorNickname" label="用户" width="120" />
          <el-table-column prop="contentPreview" label="摘要" />
          <el-table-column prop="status" label="状态" width="100" />
          <el-table-column prop="source" label="来源" width="90" />
        </el-table>
      </el-card>

      <el-card shadow="never">
        <h2 class="panel-title">待处理事项</h2>
        <el-timeline>
          <el-timeline-item v-for="log in logs" :key="log.id" :timestamp="formatTime(log.createdAt)">
            {{ log.action }} · {{ log.targetType }}
          </el-timeline-item>
          <el-empty v-if="!logs.length" description="暂无日志" />
        </el-timeline>
      </el-card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { AdminBottleListItem, OperationLogItem } from "@heart-message/shared";
import { adminRequest } from "../services/api";

interface DashboardStats {
  thrownToday: number;
  pickedToday: number;
  conversationsStarted: number;
  aiFilledBottles: number;
}

const loading = ref(false);
const stats = ref<DashboardStats>({
  thrownToday: 0,
  pickedToday: 0,
  conversationsStarted: 0,
  aiFilledBottles: 0
});
const bottles = ref<AdminBottleListItem[]>([]);
const logs = ref<OperationLogItem[]>([]);

const metrics = computed(() => [
  { label: "今日扔瓶", value: stats.value.thrownToday, note: "真实 D1 统计", type: "success" as const },
  { label: "今日捡瓶", value: stats.value.pickedToday, note: "真实 D1 统计", type: "success" as const },
  { label: "开启聊天", value: stats.value.conversationsStarted, note: "今日新增", type: "primary" as const },
  { label: "AI 补位", value: stats.value.aiFilledBottles, note: "AI 来源瓶子", type: "warning" as const }
]);

onMounted(loadDashboard);

async function loadDashboard() {
  loading.value = true;

  try {
    const [dashboard, bottleRows, logRows] = await Promise.all([
      adminRequest<DashboardStats>("/dashboard"),
      adminRequest<AdminBottleListItem[]>("/bottles"),
      adminRequest<OperationLogItem[]>("/logs")
    ]);
    stats.value = dashboard;
    bottles.value = bottleRows.slice(0, 5);
    logs.value = logRows.slice(0, 5);
  } finally {
    loading.value = false;
  }
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("zh-CN", { hour12: false });
}
</script>
