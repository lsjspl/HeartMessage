<template>
  <section>
    <div class="page-head">
      <div>
        <h1>日志中心</h1>
        <p>查看后台操作和关键业务事件，不展示敏感密钥或完整隐私内容。</p>
      </div>
      <el-button :loading="loading" @click="loadLogs">刷新</el-button>
    </div>

    <el-card shadow="never">
      <el-table :data="logs" stripe>
        <el-table-column prop="action" label="动作" width="180" />
        <el-table-column prop="targetType" label="目标类型" width="150" />
        <el-table-column prop="targetId" label="目标 ID" min-width="180" />
        <el-table-column label="摘要" min-width="260">
          <template #default="{ row }">
            {{ JSON.stringify(row.metadata) }}
          </template>
        </el-table-column>
        <el-table-column label="时间" width="190">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { OperationLogItem } from "@heart-message/shared";
import { adminRequest } from "../services/api";

const loading = ref(false);
const logs = ref<OperationLogItem[]>([]);

onMounted(loadLogs);

async function loadLogs() {
  loading.value = true;

  try {
    logs.value = await adminRequest<OperationLogItem[]>("/logs");
  } finally {
    loading.value = false;
  }
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
</script>
