<template>
  <section>
    <div class="page-head">
      <div>
        <h1>日志中心</h1>
        <p>查看后台操作和关键业务事件，不展示敏感密钥或完整隐私内容。</p>
      </div>
    </div>

    <el-card shadow="never">
      <div class="table-toolbar">
        <div class="table-filters">
          <el-input v-model="filters.keyword" clearable placeholder="关键字" @keyup.enter="applyFilters" />
          <el-input v-model="filters.action" clearable placeholder="动作" @keyup.enter="applyFilters" />
          <el-input v-model="filters.targetType" clearable placeholder="目标类型" @keyup.enter="applyFilters" />
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
            <el-button circle :loading="loading" :icon="Refresh" @click="loadLogs" />
          </el-tooltip>
          <el-tooltip content="取消多选">
            <el-button circle :disabled="!selectedRows.length" :icon="Close" @click="clearSelection" />
          </el-tooltip>
        </div>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="logs"
        row-key="id"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column type="index" label="序号" width="76" :index="indexMethod" />
        <el-table-column prop="id" label="日志 ID" min-width="220" show-overflow-tooltip />
        <el-table-column prop="action" label="动作" width="190" show-overflow-tooltip />
        <el-table-column prop="targetType" label="目标类型" width="150" />
        <el-table-column prop="targetId" label="目标 ID" min-width="180" show-overflow-tooltip />
        <el-table-column label="摘要" min-width="260" show-overflow-tooltip>
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
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        class="table-pagination"
        :page-sizes="adminPageSizes"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="loadLogs"
      />
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { Close, Refresh, RefreshLeft, Search } from "@element-plus/icons-vue";
import type { OperationLogItem, PaginatedList } from "@heart-message/shared";
import { adminRequest } from "../services/api";
import {
  adminPageSizes,
  applyPagination,
  createPaginationState,
  listQuery
} from "../services/pagination";

const loading = ref(false);
const logs = ref<OperationLogItem[]>([]);
const selectedRows = ref<OperationLogItem[]>([]);
const tableRef = ref<{ clearSelection: () => void } | null>(null);
const pagination = reactive(createPaginationState());
const filters = reactive({
  keyword: "",
  action: "",
  targetType: ""
});

onMounted(loadLogs);

function indexMethod(index: number) {
  return (pagination.page - 1) * pagination.pageSize + index + 1;
}

function handleSelectionChange(rows: OperationLogItem[]) {
  selectedRows.value = rows;
}

function clearSelection() {
  tableRef.value?.clearSelection();
}

async function loadLogs() {
  loading.value = true;

  try {
    const data = await adminRequest<PaginatedList<OperationLogItem>>(
      `/logs?${listQuery(pagination, filters)}`
    );
    logs.value = data.items;
    applyPagination(pagination, data.pagination);
  } finally {
    loading.value = false;
  }
}

async function applyFilters() {
  pagination.page = 1;
  await loadLogs();
}

async function resetFilters() {
  Object.assign(filters, { keyword: "", action: "", targetType: "" });
  await applyFilters();
}

async function handleSizeChange() {
  pagination.page = 1;
  await loadLogs();
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
</script>
