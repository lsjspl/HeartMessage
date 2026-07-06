<template>
  <section>
    <div class="page-head">
      <div>
        <h1>AI 供应商</h1>
        <p>维护 OpenAI 兼容供应商，API Key 只写入敏感配置，不回显明文。</p>
      </div>
    </div>

    <el-card shadow="never">
      <div class="table-toolbar">
        <div class="table-filters">
          <el-input v-model="filters.keyword" clearable placeholder="供应商 ID / 名称 / URL" @keyup.enter="applyFilters" />
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
            <el-button circle :loading="loading" :icon="Refresh" @click="loadProviders" />
          </el-tooltip>
          <el-tooltip content="取消多选">
            <el-button circle :disabled="!selectedRows.length" :icon="Close" @click="clearSelection" />
          </el-tooltip>
        </div>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="providers"
        row-key="id"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column type="index" label="序号" width="76" :index="indexMethod" />
        <el-table-column prop="id" label="供应商 ID" min-width="220" show-overflow-tooltip />
        <el-table-column prop="name" label="名称" min-width="160" />
        <el-table-column prop="adapterType" label="适配器" width="150" />
        <el-table-column prop="baseUrl" label="Base URL" min-width="220" show-overflow-tooltip />
        <el-table-column label="API Key" width="120">
          <template #default="{ row }">
            <el-tag :type="row.apiKeyConfigured ? 'success' : 'danger'">
              {{ row.apiKeyConfigured ? "已设置" : "未设置" }}
            </el-tag>
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
        @current-change="loadProviders"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="providerForm.id ? '编辑供应商' : '新增供应商'" width="560px">
      <el-form class="modal-form" label-width="110px">
        <el-form-item label="名称">
          <el-input v-model="providerForm.name" placeholder="OpenAI / DeepSeek / 通义千问" />
        </el-form-item>
        <el-form-item label="适配器">
          <el-select v-model="providerForm.adapterType">
            <el-option label="OpenAI 兼容" value="openai_compatible" />
          </el-select>
        </el-form-item>
        <el-form-item label="Base URL">
          <el-input v-model="providerForm.baseUrl" placeholder="https://api.example.com/v1" />
        </el-form-item>
        <el-form-item label="API Key 配置">
          <el-select
            v-model="providerForm.apiKeySecretName"
            clearable
            filterable
            placeholder="选择已有敏感配置，留空则自动创建"
          >
            <el-option-group v-for="group in sensitiveConfigGroups" :key="group.name" :label="group.name">
              <el-option
                v-for="config in group.items"
                :key="config.key"
                :label="configOptionLabel(config)"
                :value="config.key"
              />
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item label="新 API Key">
          <el-input
            v-model="providerForm.apiKey"
            type="password"
            show-password
            placeholder="填写后保存，留空则不修改"
          />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="providerForm.isEnabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingProvider" @click="saveProvider">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { Close, Edit, Plus, Refresh, RefreshLeft, Search } from "@element-plus/icons-vue";
import type { AdminAiConfig, AdminAiProvider, PaginatedList, SensitiveConfigItem } from "@heart-message/shared";
import { adminRequest } from "../services/api";
import {
  adminPageSizes,
  applyPagination,
  createPaginationState,
  listQuery
} from "../services/pagination";

const loading = ref(false);
const savingProvider = ref(false);
const dialogVisible = ref(false);
const providers = ref<AdminAiProvider[]>([]);
const sensitiveConfigs = ref<SensitiveConfigItem[]>([]);
const selectedRows = ref<AdminAiProvider[]>([]);
const tableRef = ref<{ clearSelection: () => void } | null>(null);
const pagination = reactive(createPaginationState());
const filters = reactive({
  keyword: "",
  isEnabled: ""
});
const providerForm = reactive({
  id: "",
  name: "",
  adapterType: "openai_compatible",
  baseUrl: "",
  apiKeySecretName: "",
  apiKey: "",
  isEnabled: true
});

const sensitiveConfigGroups = computed(() => {
  const groups = new Map<string, SensitiveConfigItem[]>();

  for (const config of sensitiveConfigs.value) {
    const name = config.groupName || "自定义";
    groups.set(name, [...(groups.get(name) ?? []), config]);
  }

  return [...groups.entries()].map(([name, items]) => ({
    name,
    items: items.sort((left, right) => left.label.localeCompare(right.label) || left.key.localeCompare(right.key))
  }));
});

onMounted(async () => {
  await Promise.all([loadProviders(), loadSensitiveConfigs()]);
});

function configOptionLabel(config: SensitiveConfigItem) {
  return `${config.label} (${config.key})`;
}

function indexMethod(index: number) {
  return (pagination.page - 1) * pagination.pageSize + index + 1;
}

function handleSelectionChange(rows: AdminAiProvider[]) {
  selectedRows.value = rows;
}

function clearSelection() {
  tableRef.value?.clearSelection();
}

function resetProviderForm() {
  Object.assign(providerForm, {
    id: "",
    name: "",
    adapterType: "openai_compatible",
    baseUrl: "",
    apiKeySecretName: "",
    apiKey: "",
    isEnabled: true
  });
}

function openCreate() {
  resetProviderForm();
  dialogVisible.value = true;
}

function openEdit(row: AdminAiProvider) {
  Object.assign(providerForm, {
    id: row.id,
    name: row.name,
    adapterType: row.adapterType,
    baseUrl: row.baseUrl || "",
    apiKeySecretName: row.apiKeySecretName || "",
    apiKey: "",
    isEnabled: row.isEnabled
  });
  dialogVisible.value = true;
}

async function loadProviders() {
  loading.value = true;

  try {
    const data = await adminRequest<PaginatedList<AdminAiProvider>>(
      `/ai/providers?${listQuery(pagination, filters)}`
    );
    providers.value = data.items;
    applyPagination(pagination, data.pagination);
  } finally {
    loading.value = false;
  }
}

async function loadSensitiveConfigs() {
  sensitiveConfigs.value = await adminRequest<SensitiveConfigItem[]>("/settings/sensitive");
}

async function applyFilters() {
  pagination.page = 1;
  await loadProviders();
}

async function resetFilters() {
  Object.assign(filters, { keyword: "", isEnabled: "" });
  await applyFilters();
}

async function handleSizeChange() {
  pagination.page = 1;
  await loadProviders();
}

async function saveProvider() {
  savingProvider.value = true;

  try {
    await adminRequest<AdminAiConfig>("/ai/providers", {
      method: "POST",
      body: JSON.stringify({
        ...providerForm,
        id: providerForm.id || undefined,
        baseUrl: providerForm.baseUrl || undefined,
        apiKeySecretName: providerForm.apiKeySecretName || undefined,
        apiKey: providerForm.apiKey || undefined
      })
    });
    dialogVisible.value = false;
    ElMessage.success("供应商已保存");
    await Promise.all([loadProviders(), loadSensitiveConfigs()]);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存供应商失败");
  } finally {
    savingProvider.value = false;
  }
}
</script>
