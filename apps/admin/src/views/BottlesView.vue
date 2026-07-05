<template>
  <section>
    <div class="page-head">
      <div>
        <h1>瓶子管理</h1>
        <p>查看最近瓶子、来源、状态和过期时间。</p>
      </div>
    </div>

    <el-card shadow="never">
      <div class="table-toolbar">
        <div class="table-filters">
          <el-input v-model="filters.keyword" clearable placeholder="瓶子 ID / 作者 / 内容" @keyup.enter="applyFilters" />
          <el-select v-model="filters.source" clearable placeholder="来源">
            <el-option label="真人" value="human" />
            <el-option label="AI" value="ai" />
          </el-select>
          <el-select v-model="filters.status" clearable placeholder="状态">
            <el-option label="漂浮" value="floating" />
            <el-option label="已捡" value="picked" />
            <el-option label="过期" value="expired" />
            <el-option label="封禁" value="blocked" />
            <el-option label="删除" value="deleted" />
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
            <el-button circle :loading="loading" :icon="Refresh" @click="loadBottles" />
          </el-tooltip>
          <el-tooltip content="取消多选">
            <el-button circle :disabled="!selectedRows.length" :icon="Close" @click="clearSelection" />
          </el-tooltip>
        </div>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="bottles"
        row-key="id"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column type="index" label="序号" width="76" :index="indexMethod" />
        <el-table-column prop="id" label="瓶子 ID" min-width="220" show-overflow-tooltip />
        <el-table-column prop="authorNickname" label="作者" width="140" />
        <el-table-column prop="contentPreview" label="内容摘要" min-width="320" show-overflow-tooltip />
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
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-tooltip v-if="row.status === 'blocked'" content="解封">
              <el-button
                circle
                type="success"
                :icon="Unlock"
                :loading="updatingId === row.id"
                @click="updateStatus(row.id, 'restore')"
              />
            </el-tooltip>
            <el-tooltip v-else content="封禁">
              <el-button
                circle
                type="warning"
                :icon="Lock"
                :loading="updatingId === row.id"
                @click="updateStatus(row.id, 'blocked')"
              />
            </el-tooltip>
            <el-tooltip content="过期">
              <el-button
                circle
                :disabled="row.status === 'expired'"
                :icon="Clock"
                :loading="updatingId === row.id"
                @click="updateStatus(row.id, 'expired')"
              />
            </el-tooltip>
            <el-tooltip content="删除">
              <el-button
                circle
                type="danger"
                :disabled="row.status === 'deleted'"
                :icon="Delete"
                :loading="updatingId === row.id"
                @click="updateStatus(row.id, 'deleted')"
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
        @current-change="loadBottles"
      />
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { Clock, Close, Delete, Lock, Refresh, RefreshLeft, Search, Unlock } from "@element-plus/icons-vue";
import type { AdminBottleListItem, AdminBottleStatusUpdateInput, PaginatedList } from "@heart-message/shared";
import { adminRequest } from "../services/api";
import {
  adminPageSizes,
  applyPagination,
  createPaginationState,
  listQuery
} from "../services/pagination";

const bottles = ref<AdminBottleListItem[]>([]);
const loading = ref(false);
const updatingId = ref("");
const selectedRows = ref<AdminBottleListItem[]>([]);
const tableRef = ref<{ clearSelection: () => void } | null>(null);
const pagination = reactive(createPaginationState());
const filters = reactive({
  keyword: "",
  source: "",
  status: ""
});

onMounted(loadBottles);

function indexMethod(index: number) {
  return (pagination.page - 1) * pagination.pageSize + index + 1;
}

function handleSelectionChange(rows: AdminBottleListItem[]) {
  selectedRows.value = rows;
}

function clearSelection() {
  tableRef.value?.clearSelection();
}

async function loadBottles() {
  loading.value = true;

  try {
    const data = await adminRequest<PaginatedList<AdminBottleListItem>>(
      `/bottles?${listQuery(pagination, filters)}`
    );
    bottles.value = data.items;
    applyPagination(pagination, data.pagination);
  } finally {
    loading.value = false;
  }
}

async function applyFilters() {
  pagination.page = 1;
  await loadBottles();
}

async function resetFilters() {
  Object.assign(filters, { keyword: "", source: "", status: "" });
  await applyFilters();
}

async function handleSizeChange() {
  pagination.page = 1;
  await loadBottles();
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
