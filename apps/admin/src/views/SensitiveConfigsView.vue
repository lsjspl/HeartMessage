<template>
  <section>
    <div class="page-head">
      <div>
        <h1>敏感配置</h1>
        <p>Token 密钥、微信配置、AI Key 等敏感值。</p>
      </div>
    </div>

    <el-card shadow="never">
      <div class="table-toolbar">
        <div class="table-filters">
          <el-input v-model="filters.keyword" clearable placeholder="配置键 / 名称" @keyup.enter="applyFilters" />
          <el-select v-model="filters.source" clearable placeholder="来源">
            <el-option label="后台配置" value="custom" />
            <el-option label="本地默认" value="local_default" />
            <el-option label="未配置" value="missing" />
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
            <el-button circle :loading="loading" :icon="Refresh" @click="loadConfigs" />
          </el-tooltip>
          <el-tooltip content="取消多选">
            <el-button circle :disabled="!selectedRows.length" :icon="Close" @click="clearSelection" />
          </el-tooltip>
        </div>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="pagedConfigs"
        row-key="key"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column type="index" label="序号" width="76" :index="indexMethod" />
        <el-table-column prop="key" label="配置键" min-width="220" show-overflow-tooltip />
        <el-table-column prop="label" label="名称" min-width="180" />
        <el-table-column label="来源" width="120">
          <template #default="{ row }">
            <el-tag :type="sourceTagType(row.source)">{{ sourceText(row.source) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.configured ? 'success' : 'danger'">{{ row.configured ? "已配置" : "未配置" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="valuePreview" label="预览" min-width="130" />
        <el-table-column label="更新时间" width="190">
          <template #default="{ row }">
            {{ row.updatedAt ? formatTime(row.updatedAt) : "-" }}
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
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.locked ? '编辑敏感配置' : '新增敏感配置'" width="560px">
      <el-form class="modal-form" label-width="110px">
        <el-form-item label="配置键">
          <el-input v-model="form.key" :disabled="form.locked" placeholder="OPENAI_API_KEY" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="form.label" disabled />
        </el-form-item>
        <el-form-item label="配置值">
          <el-input v-model="form.value" type="password" show-password placeholder="输入新的配置值" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveConfig">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watchEffect } from "vue";
import { ElMessage } from "element-plus";
import { Close, Edit, Plus, Refresh, RefreshLeft, Search } from "@element-plus/icons-vue";
import type { SensitiveConfigItem, SensitiveConfigSource } from "@heart-message/shared";
import { adminRequest } from "../services/api";
import { adminPageSizes, createPaginationState } from "../services/pagination";

const loading = ref(false);
const saving = ref(false);
const configs = ref<SensitiveConfigItem[]>([]);
const selectedRows = ref<SensitiveConfigItem[]>([]);
const tableRef = ref<{ clearSelection: () => void } | null>(null);
const dialogVisible = ref(false);
const pagination = reactive(createPaginationState());
const filters = reactive({
  keyword: "",
  source: ""
});
const form = reactive({
  key: "",
  label: "",
  value: "",
  locked: false
});

const filteredConfigs = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase();

  return configs.value.filter((item) => {
    const matchesKeyword =
      !keyword ||
      item.key.toLowerCase().includes(keyword) ||
      item.label.toLowerCase().includes(keyword);
    const matchesSource = !filters.source || item.source === filters.source;

    return matchesKeyword && matchesSource;
  });
});

const pagedConfigs = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize;

  return filteredConfigs.value.slice(start, start + pagination.pageSize);
});

watchEffect(() => {
  pagination.total = filteredConfigs.value.length;
  pagination.pageCount = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));

  if (pagination.page > pagination.pageCount) {
    pagination.page = pagination.pageCount;
  }
});

onMounted(loadConfigs);

function indexMethod(index: number) {
  return (pagination.page - 1) * pagination.pageSize + index + 1;
}

function sourceText(source: SensitiveConfigSource) {
  return {
    custom: "后台配置",
    local_default: "本地默认",
    missing: "未配置"
  }[source];
}

function sourceTagType(source: SensitiveConfigSource) {
  return {
    custom: "success",
    local_default: "warning",
    missing: "danger"
  }[source];
}

function handleSelectionChange(rows: SensitiveConfigItem[]) {
  selectedRows.value = rows;
}

function clearSelection() {
  tableRef.value?.clearSelection();
}

async function loadConfigs() {
  loading.value = true;

  try {
    configs.value = await adminRequest<SensitiveConfigItem[]>("/settings/sensitive");
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  pagination.page = 1;
  clearSelection();
}

function resetFilters() {
  Object.assign(filters, { keyword: "", source: "" });
  pagination.page = 1;
  clearSelection();
}

function handleSizeChange() {
  pagination.page = 1;
}

function openCreate() {
  Object.assign(form, {
    key: "",
    label: "自定义敏感配置",
    value: "",
    locked: false
  });
  dialogVisible.value = true;
}

function openEdit(row: SensitiveConfigItem) {
  Object.assign(form, {
    key: row.key,
    label: row.label,
    value: "",
    locked: true
  });
  dialogVisible.value = true;
}

async function saveConfig() {
  if (!form.key || !form.value) {
    ElMessage.warning("请填写配置键和配置值");
    return;
  }

  saving.value = true;

  try {
    configs.value = await adminRequest<SensitiveConfigItem[]>(
      `/settings/sensitive/${encodeURIComponent(form.key)}`,
      {
        method: "PUT",
        body: JSON.stringify({
          key: form.key,
          value: form.value
        })
      }
    );
    dialogVisible.value = false;
    ElMessage.success("敏感配置已保存");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存敏感配置失败");
  } finally {
    saving.value = false;
  }
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    hour12: false
  });
}
</script>
