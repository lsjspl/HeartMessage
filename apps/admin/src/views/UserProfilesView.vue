<template>
  <section>
    <div class="page-head">
      <div>
        <h1>用户画像</h1>
        <p>查看 AI 评估的人物画像状态，并手动触发单个用户画像评估。</p>
      </div>
    </div>

    <el-card shadow="never">
      <div class="table-toolbar">
        <div class="table-filters">
          <el-input v-model="filters.keyword" clearable placeholder="用户 ID / 昵称 / 摘要" @keyup.enter="applyFilters" />
          <el-select v-model="filters.status" clearable placeholder="画像状态">
            <el-option label="评估中" value="pending" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="failed" />
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
            <el-button circle :loading="loading" :icon="Refresh" @click="loadProfiles" />
          </el-tooltip>
          <el-tooltip content="取消多选">
            <el-button circle :disabled="!selectedRows.length" :icon="Close" @click="clearSelection" />
          </el-tooltip>
        </div>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="profiles"
        row-key="userId"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column type="index" label="序号" width="76" :index="indexMethod" />
        <el-table-column prop="userId" label="用户 ID" min-width="220" show-overflow-tooltip />
        <el-table-column label="用户" min-width="150">
          <template #default="{ row }">
            {{ row.nickname || "未完善资料" }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="summary" label="画像摘要" min-width="260" show-overflow-tooltip />
        <el-table-column label="兴趣标签" min-width="220">
          <template #default="{ row }">
            <el-tag v-for="tag in row.interestTags.slice(0, 4)" :key="tag" class="tag-gap" effect="light">
              {{ tag }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="素材量" width="120">
          <template #default="{ row }">
            {{ row.sourceBottleCount }} 瓶 / {{ row.sourceMessageCount }} 消息
          </template>
        </el-table-column>
        <el-table-column label="评估时间" width="190">
          <template #default="{ row }">
            {{ row.evaluatedAt ? formatTime(row.evaluatedAt) : "未评估" }}
          </template>
        </el-table-column>
        <el-table-column prop="lastErrorMessage" label="错误" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="96" fixed="right">
          <template #default="{ row }">
            <el-tooltip content="评估">
              <el-button
                circle
                type="primary"
                :icon="Refresh"
                :loading="evaluatingId === row.userId"
                @click="evaluate(row.userId)"
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
        @current-change="loadProfiles"
      />
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { Close, Refresh, RefreshLeft, Search } from "@element-plus/icons-vue";
import type {
  AdminUserProfileInsightItem,
  PaginatedList,
  UserProfileEvaluationStatus
} from "@heart-message/shared";
import { adminRequest } from "../services/api";
import {
  adminPageSizes,
  applyPagination,
  createPaginationState,
  listQuery
} from "../services/pagination";

const loading = ref(false);
const evaluatingId = ref("");
const profiles = ref<AdminUserProfileInsightItem[]>([]);
const selectedRows = ref<AdminUserProfileInsightItem[]>([]);
const tableRef = ref<{ clearSelection: () => void } | null>(null);
const pagination = reactive(createPaginationState());
const filters = reactive({
  keyword: "",
  status: ""
});

onMounted(loadProfiles);

function indexMethod(index: number) {
  return (pagination.page - 1) * pagination.pageSize + index + 1;
}

function handleSelectionChange(rows: AdminUserProfileInsightItem[]) {
  selectedRows.value = rows;
}

function clearSelection() {
  tableRef.value?.clearSelection();
}

function statusText(status?: UserProfileEvaluationStatus) {
  if (status === "completed") {
    return "已完成";
  }

  if (status === "failed") {
    return "失败";
  }

  if (status === "pending") {
    return "评估中";
  }

  return "未评估";
}

function statusType(status?: UserProfileEvaluationStatus) {
  if (status === "completed") {
    return "success";
  }

  if (status === "failed") {
    return "danger";
  }

  if (status === "pending") {
    return "warning";
  }

  return "info";
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}

async function loadProfiles() {
  loading.value = true;

  try {
    const data = await adminRequest<PaginatedList<AdminUserProfileInsightItem>>(
      `/user-profile-insights?${listQuery(pagination, filters)}`
    );
    profiles.value = data.items;
    applyPagination(pagination, data.pagination);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "加载用户画像失败");
  } finally {
    loading.value = false;
  }
}

async function applyFilters() {
  pagination.page = 1;
  await loadProfiles();
}

async function resetFilters() {
  Object.assign(filters, { keyword: "", status: "" });
  await applyFilters();
}

async function handleSizeChange() {
  pagination.page = 1;
  await loadProfiles();
}

async function evaluate(userId: string) {
  evaluatingId.value = userId;

  try {
    await adminRequest<AdminUserProfileInsightItem>(`/user-profile-insights/${userId}/evaluate`, {
      method: "POST"
    });
    ElMessage.success("用户画像已评估");
    await loadProfiles();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "用户画像评估失败");
    await loadProfiles();
  } finally {
    evaluatingId.value = "";
  }
}
</script>

<style scoped>
.tag-gap {
  margin-right: 6px;
}
</style>
