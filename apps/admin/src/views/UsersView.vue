<template>
  <section>
    <div class="page-head">
      <div>
        <h1>用户管理</h1>
        <p>查看微信注册用户、资料完善状态和账号状态。</p>
      </div>
      <el-button type="primary" @click="loadUsers">刷新</el-button>
    </div>

    <el-card shadow="never">
      <el-table v-loading="loading" :data="users" stripe>
        <el-table-column prop="id" label="用户 ID" min-width="220" />
        <el-table-column label="昵称" min-width="140">
          <template #default="{ row }">
            {{ row.nickname || "未完善" }}
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="110" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" min-width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { adminRequest } from "../services/api";

interface AdminUserRow {
  id: string;
  role: string;
  status: string;
  created_at: number;
  nickname: string | null;
  avatar_url: string | null;
}

const loading = ref(false);
const users = ref<AdminUserRow[]>([]);

function formatTime(value: number) {
  return new Date(value).toLocaleString();
}

async function loadUsers() {
  loading.value = true;

  try {
    users.value = await adminRequest<AdminUserRow[]>("/users");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "加载用户失败");
  } finally {
    loading.value = false;
  }
}

onMounted(loadUsers);
</script>
