<template>
  <section>
    <div class="page-head">
      <div>
        <h1>AI 模型</h1>
        <p>维护模型名称、用途和启用状态。</p>
      </div>
    </div>

    <el-card shadow="never">
      <div class="table-toolbar">
        <div class="table-filters">
          <el-input v-model="filters.keyword" clearable placeholder="模型 ID / 名称" @keyup.enter="applyFilters" />
          <el-select v-model="filters.providerId" clearable placeholder="供应商">
            <el-option v-for="provider in providerOptions" :key="provider.id" :label="provider.name" :value="provider.id" />
          </el-select>
          <el-select v-model="filters.purpose" clearable placeholder="用途">
            <el-option v-for="purpose in purposes" :key="purpose.value" :label="purpose.label" :value="purpose.value" />
          </el-select>
          <el-select v-model="filters.isEnabled" clearable placeholder="启用状态">
            <el-option label="启用" value="true" />
            <el-option label="停用" value="false" />
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
          <el-tooltip content="新增">
            <el-button circle type="primary" :icon="Plus" @click="openCreate" />
          </el-tooltip>
          <el-tooltip content="刷新">
            <el-button circle :loading="loading" :icon="Refresh" @click="loadModels" />
          </el-tooltip>
          <el-tooltip content="取消多选">
            <el-button circle :disabled="!selectedRows.length" :icon="Close" @click="clearSelection" />
          </el-tooltip>
        </div>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="models"
        row-key="id"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column type="index" label="序号" width="76" :index="indexMethod" />
        <el-table-column prop="id" label="模型 ID" min-width="220" show-overflow-tooltip />
        <el-table-column prop="providerName" label="平台" width="140" />
        <el-table-column prop="displayName" label="展示名" min-width="160" />
        <el-table-column prop="modelName" label="模型名" min-width="180" show-overflow-tooltip />
        <el-table-column label="用途" width="170">
          <template #default="{ row }">
            {{ purposeLabel(row.purpose) }}
          </template>
        </el-table-column>
        <el-table-column label="启用" width="90">
          <template #default="{ row }">
            <el-tag :type="row.isEnabled ? 'success' : 'info'">{{ row.isEnabled ? "是" : "否" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="96" fixed="right">
          <template #default="{ row }">
            <el-tooltip content="编辑">
              <el-button circle type="primary" :icon="Edit" @click="openEdit(row)" />
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
        @current-change="loadModels"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="modelForm.id ? '编辑模型' : '新增模型'" width="560px">
      <el-form class="modal-form" label-width="110px">
        <el-form-item label="供应商">
          <el-select v-model="modelForm.providerId">
            <el-option v-for="provider in providerOptions" :key="provider.id" :label="provider.name" :value="provider.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="展示名">
          <el-input v-model="modelForm.displayName" />
        </el-form-item>
        <el-form-item label="模型名">
          <el-input v-model="modelForm.modelName" />
        </el-form-item>
        <el-form-item label="用途类型">
          <el-select v-model="modelForm.purpose">
            <el-option v-for="purpose in purposes" :key="purpose.value" :label="purpose.label" :value="purpose.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="modelForm.isEnabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingModel" @click="saveModel">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { Close, Edit, Plus, Refresh, RefreshLeft, Search } from "@element-plus/icons-vue";
import type {
  AdminAiConfig,
  AdminAiModel,
  AdminAiProvider,
  AiModelPurpose,
  PaginatedList
} from "@heart-message/shared";
import { adminRequest } from "../services/api";
import {
  adminPageSizes,
  applyPagination,
  createPaginationState,
  listQuery
} from "../services/pagination";

const purposes: Array<{ label: string; value: AiModelPurpose }> = [
  { label: "人格生成", value: "persona_generation" },
  { label: "瓶子生成", value: "bottle_generation" },
  { label: "聊天回复", value: "chat_reply" },
  { label: "内容审核", value: "content_moderation" },
  { label: "画像评估", value: "user_profile_evaluation" }
];

const loading = ref(false);
const savingModel = ref(false);
const dialogVisible = ref(false);
const models = ref<AdminAiModel[]>([]);
const providerOptions = ref<AdminAiProvider[]>([]);
const selectedRows = ref<AdminAiModel[]>([]);
const tableRef = ref<{ clearSelection: () => void } | null>(null);
const pagination = reactive(createPaginationState());
const filters = reactive({
  keyword: "",
  providerId: "",
  purpose: "",
  isEnabled: ""
});
const modelForm = reactive({
  id: "",
  providerId: "",
  displayName: "",
  modelName: "",
  purpose: "chat_reply" as AiModelPurpose,
  isEnabled: true,
  configJson: {}
});

onMounted(async () => {
  await loadProviderOptions();
  await loadModels();
});

function purposeLabel(value: AiModelPurpose) {
  return purposes.find((purpose) => purpose.value === value)?.label ?? value;
}

function indexMethod(index: number) {
  return (pagination.page - 1) * pagination.pageSize + index + 1;
}

function handleSelectionChange(rows: AdminAiModel[]) {
  selectedRows.value = rows;
}

function clearSelection() {
  tableRef.value?.clearSelection();
}

function resetModelForm() {
  Object.assign(modelForm, {
    id: "",
    providerId: providerOptions.value[0]?.id ?? "",
    displayName: "",
    modelName: "",
    purpose: "chat_reply",
    isEnabled: true,
    configJson: {}
  });
}

function openCreate() {
  resetModelForm();
  dialogVisible.value = true;
}

function openEdit(row: AdminAiModel) {
  Object.assign(modelForm, {
    id: row.id,
    providerId: row.providerId,
    displayName: row.displayName,
    modelName: row.modelName,
    purpose: row.purpose,
    isEnabled: row.isEnabled,
    configJson: row.configJson
  });
  dialogVisible.value = true;
}

async function loadProviderOptions() {
  const config = await adminRequest<AdminAiConfig>("/ai/config");
  providerOptions.value = config.providers;
}

async function loadModels() {
  loading.value = true;

  try {
    const data = await adminRequest<PaginatedList<AdminAiModel>>(
      `/ai/models?${listQuery(pagination, filters)}`
    );
    models.value = data.items;
    applyPagination(pagination, data.pagination);
  } finally {
    loading.value = false;
  }
}

async function applyFilters() {
  pagination.page = 1;
  await loadModels();
}

async function resetFilters() {
  Object.assign(filters, { keyword: "", providerId: "", purpose: "", isEnabled: "" });
  await applyFilters();
}

async function handleSizeChange() {
  pagination.page = 1;
  await loadModels();
}

async function saveModel() {
  savingModel.value = true;

  try {
    await adminRequest<AdminAiConfig>("/ai/models", {
      method: "POST",
      body: JSON.stringify({
        ...modelForm,
        id: modelForm.id || undefined
      })
    });
    dialogVisible.value = false;
    ElMessage.success("模型已保存");
    await Promise.all([loadProviderOptions(), loadModels()]);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存模型失败");
  } finally {
    savingModel.value = false;
  }
}
</script>
