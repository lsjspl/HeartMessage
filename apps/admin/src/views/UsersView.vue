<template>
  <section>
    <div class="page-head">
      <div>
        <h1>用户管理</h1>
        <p>查看第三方登录用户、资料完善状态和账号状态。</p>
      </div>
    </div>

    <el-card shadow="never">
      <div class="table-toolbar">
        <div class="table-filters">
          <el-input v-model="filters.keyword" clearable placeholder="用户 ID / 昵称 / 邮箱" @keyup.enter="applyFilters" />
          <el-select v-model="filters.role" clearable placeholder="角色">
            <el-option label="用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
          <el-select v-model="filters.status" clearable placeholder="状态">
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" />
            <el-option label="已删除" value="deleted" />
          </el-select>
          <div class="filter-actions">
            <el-tooltip content="搜索">
              <el-button circle :icon="Search" @click="applyFilters" />
            </el-tooltip>
            <el-tooltip content="重置筛选">
              <el-button circle :icon="RefreshLeft" @click="resetFilters" />
            </el-tooltip>
          </div>
        </div>
        <div class="table-actions">
          <el-tooltip content="刷新">
            <el-button circle :loading="loading" :icon="Refresh" @click="loadUsers" />
          </el-tooltip>
          <el-tooltip content="取消多选">
            <el-button circle :disabled="!selectedRows.length" :icon="Close" @click="clearSelection" />
          </el-tooltip>
        </div>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="users"
        row-key="id"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column type="index" label="序号" width="76" :index="indexMethod" />
        <el-table-column label="用户" min-width="280">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="42" :src="displayAvatar(row)">
                {{ displayInitial(row) }}
              </el-avatar>
              <div class="user-copy">
                <span class="user-name">{{ displayName(row) }}</span>
                <span class="user-id">{{ row.id }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="邮箱" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.email || "未获取" }}
          </template>
        </el-table-column>
        <el-table-column label="登录来源" width="120">
          <template #default="{ row }">
            <el-tag :type="row.authProvider === 'google' ? 'success' : 'info'">
              {{ authProviderLabel(row.authProvider) }}
            </el-tag>
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
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="96" fixed="right">
          <template #default="{ row }">
            <el-tooltip v-if="row.status === 'active'" content="禁用">
              <el-button
                circle
                type="danger"
                :icon="Lock"
                :loading="updatingId === row.id"
                @click="updateStatus(row.id, 'disabled')"
              />
            </el-tooltip>
            <el-tooltip v-else-if="row.status === 'disabled'" content="恢复">
              <el-button
                circle
                type="primary"
                :icon="Unlock"
                :loading="updatingId === row.id"
                @click="updateStatus(row.id, 'active')"
              />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        class="table-pagination"
        :page-sizes="adminPageSizes"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="loadUsers"
      />
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { Close, Lock, Refresh, RefreshLeft, Search, Unlock } from "@element-plus/icons-vue";
import type { AdminUserListItem, AdminUserStatusUpdateInput, PaginatedList } from "@heart-message/shared";
import { adminRequest } from "../services/api";
import {
  adminPageSizes,
  applyPagination,
  createPaginationState,
  listQuery
} from "../services/pagination";

const loading = ref(false);
const updatingId = ref("");
const users = ref<AdminUserListItem[]>([]);
const selectedRows = ref<AdminUserListItem[]>([]);
const tableRef = ref<{ clearSelection: () => void } | null>(null);
const pagination = reactive(createPaginationState());
const filters = reactive({
  keyword: "",
  role: "",
  status: ""
});

function formatTime(value: string) {
  return new Date(value).toLocaleString();
}

function displayName(row: AdminUserListItem) {
  return row.nickname || row.authDisplayName || "未完善资料";
}

function displayAvatar(row: AdminUserListItem) {
  return row.avatarUrl || row.authAvatarUrl || "";
}

function displayInitial(row: AdminUserListItem) {
  return displayName(row).slice(0, 1);
}

function authProviderLabel(provider?: AdminUserListItem["authProvider"]) {
  if (provider === "google") {
    return "Google";
  }

  if (provider === "wechat") {
    return "微信";
  }

  return "未知";
}

function indexMethod(index: number) {
  return (pagination.page - 1) * pagination.pageSize + index + 1;
}

function handleSelectionChange(rows: AdminUserListItem[]) {
  selectedRows.value = rows;
}

function clearSelection() {
  tableRef.value?.clearSelection();
}

async function loadUsers() {
  loading.value = true;

  try {
    const data = await adminRequest<PaginatedList<AdminUserListItem>>(
      `/users?${listQuery(pagination, filters)}`
    );
    users.value = data.items;
    applyPagination(pagination, data.pagination);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "加载用户失败");
  } finally {
    loading.value = false;
  }
}

async function applyFilters() {
  pagination.page = 1;
  await loadUsers();
}

async function resetFilters() {
  Object.assign(filters, { keyword: "", role: "", status: "" });
  await applyFilters();
}

async function handleSizeChange() {
  pagination.page = 1;
  await loadUsers();
}

async function updateStatus(id: string, status: AdminUserStatusUpdateInput["status"]) {
  updatingId.value = id;

  try {
    await adminRequest(`/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    ElMessage.success(status === "active" ? "用户已恢复" : "用户已禁用");
    await loadUsers();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "更新用户状态失败");
  } finally {
    updatingId.value = "";
  }
}

onMounted(loadUsers);
</script>

<style scoped>
.user-cell {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12px;
}

.user-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.user-name {
  overflow: hidden;
  color: #1f2937;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-id {
  overflow: hidden;
  color: #8a94a6;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
