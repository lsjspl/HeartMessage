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
            <div class="purpose-tags">
              <el-tag v-for="purpose in row.purposes" :key="purpose" size="small">
                {{ purposeLabel(purpose) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="启用" width="90">
          <template #default="{ row }">
            <el-tag :type="row.isEnabled ? 'success' : 'info'">{{ row.isEnabled ? "是" : "否" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="136" fixed="right">
          <template #default="{ row }">
            <el-tooltip content="编辑">
              <el-button circle type="primary" :icon="Edit" @click="openEdit(row)" />
            </el-tooltip>
            <el-tooltip content="删除">
              <el-button circle type="danger" :icon="Delete" @click="deleteModel(row)" />
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

    <el-dialog v-model="dialogVisible" :title="modelForm.id ? '编辑模型' : '新增模型'" width="640px">
      <el-form class="modal-form" label-width="110px">
        <el-form-item label="供应商">
          <el-select v-model="modelForm.providerId" @change="handleProviderChange">
            <el-option v-for="provider in providerOptions" :key="provider.id" :label="provider.name" :value="provider.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="展示名">
          <el-input v-model="modelForm.displayName" @input="handleDisplayNameInput" />
        </el-form-item>
        <el-form-item label="模型名">
          <div class="model-name-control">
            <el-select
              v-model="modelForm.modelName"
              allow-create
              clearable
              default-first-option
              filterable
              placeholder="输入或选择模型名"
              @change="handleModelNameChange"
            >
              <el-option v-for="model in providerModels" :key="model.id" :label="model.id" :value="model.id">
                <div class="model-option">
                  <span>{{ model.id }}</span>
                  <small v-if="model.owner" class="model-option-owner">{{ model.owner }}</small>
                </div>
              </el-option>
            </el-select>
            <el-tooltip content="拉取当前供应商模型">
              <el-button circle :icon="Download" :loading="loadingProviderModels" @click="fetchProviderModels" />
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item label="用途类型">
          <el-select v-model="modelForm.purposes" multiple collapse-tags collapse-tags-tooltip>
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
import { onMounted, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Close, Delete, Download, Edit, Plus, Refresh, RefreshLeft, Search } from "@element-plus/icons-vue";
import type {
  AdminAiConfig,
  AdminAiModel,
  AdminAiProviderModelOption,
  AdminAiProviderModels,
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
const loadingProviderModels = ref(false);
const dialogVisible = ref(false);
const models = ref<AdminAiModel[]>([]);
const providerOptions = ref<AdminAiProvider[]>([]);
const providerModels = ref<AdminAiProviderModelOption[]>([]);
const selectedRows = ref<AdminAiModel[]>([]);
const tableRef = ref<{ clearSelection: () => void } | null>(null);
const displayNameEdited = ref(false);
const lastAutoDisplayName = ref("");
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
  purposes: ["chat_reply"] as AiModelPurpose[],
  isEnabled: true,
  configJson: {}
});

onMounted(async () => {
  await loadProviderOptions();
  await loadModels();
});

watch(
  () => modelForm.purposes.join(","),
  () => syncDefaultDisplayName()
);

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
  providerModels.value = [];
  displayNameEdited.value = false;
  lastAutoDisplayName.value = "";
  Object.assign(modelForm, {
    id: "",
    providerId: providerOptions.value[0]?.id ?? "",
    displayName: "",
    modelName: "",
    purposes: ["chat_reply"],
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
    purposes: [...row.purposes],
    isEnabled: row.isEnabled,
    configJson: row.configJson
  });
  providerModels.value = [];
  lastAutoDisplayName.value = buildDefaultDisplayName();
  displayNameEdited.value = row.displayName !== lastAutoDisplayName.value;
  dialogVisible.value = true;
}

function buildDefaultDisplayName() {
  const modelName = (modelForm.modelName || "").trim();
  const purposeText = modelForm.purposes.map(purposeLabel).join("/");

  return modelName && purposeText ? `${purposeText} ${modelName}` : "";
}

function syncDefaultDisplayName(force = false) {
  const nextDisplayName = buildDefaultDisplayName();

  if (!nextDisplayName) {
    return;
  }

  const currentDisplayName = modelForm.displayName.trim();

  if (force || !displayNameEdited.value || !currentDisplayName || currentDisplayName === lastAutoDisplayName.value) {
    modelForm.displayName = nextDisplayName;
    displayNameEdited.value = false;
  }

  lastAutoDisplayName.value = nextDisplayName;
}

function handleDisplayNameInput() {
  displayNameEdited.value = modelForm.displayName.trim() !== lastAutoDisplayName.value;
}

function handleModelNameChange() {
  syncDefaultDisplayName();
}

function handleProviderChange() {
  providerModels.value = [];
}

async function loadProviderOptions() {
  const config = await adminRequest<AdminAiConfig>("/ai/config");
  providerOptions.value = config.providers;
}

async function fetchProviderModels() {
  if (!modelForm.providerId) {
    ElMessage.warning("先选择供应商");
    return;
  }

  loadingProviderModels.value = true;

  try {
    const data = await adminRequest<AdminAiProviderModels>(
      `/ai/providers/${encodeURIComponent(modelForm.providerId)}/models`
    );
    providerModels.value = data.models;

    if (data.models.length) {
      ElMessage.success(`已拉取 ${data.models.length} 个模型`);
    } else {
      ElMessage.warning("供应商没有返回可选模型");
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "拉取模型失败");
  } finally {
    loadingProviderModels.value = false;
  }
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
  if (!modelForm.providerId) {
    ElMessage.warning("先选择供应商");
    return;
  }

  const modelName = (modelForm.modelName || "").trim();

  if (!modelName) {
    ElMessage.warning("请选择或输入模型名");
    return;
  }

  if (!modelForm.purposes.length) {
    ElMessage.warning("请选择至少一个用途");
    return;
  }

  if (!modelForm.displayName.trim()) {
    syncDefaultDisplayName(true);
  }

  const displayName = modelForm.displayName.trim();

  if (!displayName) {
    ElMessage.warning("请填写展示名");
    return;
  }

  savingModel.value = true;

  try {
    await adminRequest<AdminAiConfig>("/ai/models", {
      method: "POST",
      body: JSON.stringify({
        ...modelForm,
        id: modelForm.id || undefined,
        displayName,
        modelName,
        purposes: modelForm.purposes
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

async function deleteModel(row: AdminAiModel) {
  try {
    await ElMessageBox.confirm(`确认删除模型「${row.displayName}」？`, "删除模型", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning"
    });
  } catch {
    return;
  }

  try {
    await adminRequest(`/ai/models/${encodeURIComponent(row.id)}`, {
      method: "DELETE"
    });
    ElMessage.success("模型已删除");
    await loadModels();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "删除模型失败");
  }
}
</script>

<style scoped>
.model-name-control {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.model-name-control .el-select {
  flex: 1;
}

.model-option {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.model-option-owner {
  color: #8a94a6;
  font-size: 12px;
}

.purpose-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
