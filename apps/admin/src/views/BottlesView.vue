<template>
  <section>
    <div class="page-head">
      <div>
        <h1>瓶子管理</h1>
        <p>查看最近瓶子、来源、状态和过期时间。</p>
      </div>
      <el-button :loading="loading" @click="loadBottles">刷新</el-button>
    </div>

    <el-card shadow="never">
      <el-table :data="bottles" stripe>
        <el-table-column prop="authorNickname" label="作者" width="140" />
        <el-table-column prop="contentPreview" label="内容摘要" min-width="320" />
        <el-table-column prop="source" label="来源" width="100" />
        <el-table-column prop="status" label="状态" width="120" />
        <el-table-column label="创建时间" width="190">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="过期时间" width="190">
          <template #default="{ row }">
            {{ formatTime(row.expiresAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <el-button
              type="warning"
              link
              :disabled="row.status === 'blocked'"
              :loading="updatingId === row.id"
              @click="updateStatus(row.id, 'blocked')"
            >
              封禁
            </el-button>
            <el-button
              type="info"
              link
              :disabled="row.status === 'expired'"
              :loading="updatingId === row.id"
              @click="updateStatus(row.id, 'expired')"
            >
              过期
            </el-button>
            <el-button
              type="danger"
              link
              :disabled="row.status === 'deleted'"
              :loading="updatingId === row.id"
              @click="updateStatus(row.id, 'deleted')"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import type { AdminBottleListItem, AdminBottleStatusUpdateInput } from "@heart-message/shared";
import { adminRequest } from "../services/api";

const bottles = ref<AdminBottleListItem[]>([]);
const loading = ref(false);
const updatingId = ref("");

onMounted(async () => {
  await loadBottles();
});

async function loadBottles() {
  loading.value = true;

  try {
    bottles.value = await adminRequest<AdminBottleListItem[]>("/bottles");
  } finally {
    loading.value = false;
  }
}

async function updateStatus(id: string, status: AdminBottleStatusUpdateInput["status"]) {
  updatingId.value = id;

  try {
    await adminRequest(`/bottles/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    ElMessage.success("瓶子状态已更新");
    await loadBottles();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "更新瓶子状态失败");
  } finally {
    updatingId.value = "";
  }
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    hour12: false
  });
}
</script>
