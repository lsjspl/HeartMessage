<template>
  <section>
    <div class="page-head">
      <div>
        <h1>内容审核</h1>
        <p>查看 AI 和硬规则拦截的用户发言。</p>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="content-tabs">
      <el-tab-pane label="事件列表" name="events">
        <el-card shadow="never">
      <div class="table-toolbar">
        <div class="table-filters">
          <el-input v-model="filters.keyword" clearable placeholder="事件 ID / 用户 / 原因 / 预览" @keyup.enter="applyFilters" />
          <el-select v-model="filters.source" clearable placeholder="来源">
            <el-option label="扔瓶" value="bottle_throw" />
            <el-option label="回瓶" value="bottle_reply" />
            <el-option label="聊天" value="chat_message" />
          </el-select>
          <el-select v-model="filters.category" clearable placeholder="类别">
            <el-option label="广告" value="advertisement" />
            <el-option label="色情" value="sexual" />
            <el-option label="联系方式" value="contact_info" />
            <el-option label="骚扰" value="abuse" />
            <el-option label="违法诈骗" value="illegal" />
          </el-select>
          <el-select v-model="filters.severity" clearable placeholder="程度">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
          </el-select>
          <el-select v-model="filters.decision" clearable placeholder="决策">
            <el-option label="已拦截" value="blocked" />
            <el-option label="观察记录" value="allowed_logged" />
          </el-select>
          <el-select v-model="filters.status" clearable placeholder="处理状态">
            <el-option label="待处理" value="pending" />
            <el-option label="确认违规" value="confirmed" />
            <el-option label="误判" value="dismissed" />
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
            <el-button circle :loading="loading" :icon="Refresh" @click="loadEvents" />
          </el-tooltip>
          <el-tooltip content="取消多选">
            <el-button circle :disabled="!selectedRows.length" :icon="Close" @click="clearSelection" />
          </el-tooltip>
        </div>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="events"
        row-key="id"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="44" />
        <el-table-column type="index" label="序号" width="64" :index="indexMethod" />
        <el-table-column label="用户" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="main-line">{{ row.nickname || "未命名用户" }}</div>
            <div class="muted-line">{{ row.userId }}</div>
          </template>
        </el-table-column>
        <el-table-column label="来源" width="80">
          <template #default="{ row }">
            {{ sourceText(row.source) }}
          </template>
        </el-table-column>
        <el-table-column label="类别" width="110">
          <template #default="{ row }">
            <el-tag v-for="category in row.categories" :key="category" class="tag-gap" type="warning">
              {{ categoryText(category) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="程度" width="82">
          <template #default="{ row }">
            <el-tag :type="severityTagType(row.highestSeverity)">
              {{ severityText(row.highestSeverity) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="决策" width="96">
          <template #default="{ row }">
            {{ decisionText(row.decision) }}
          </template>
        </el-table-column>
        <el-table-column label="内容" min-width="270" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="main-line">{{ row.contentPreview }}</div>
            <div class="muted-line">{{ row.reason }}</div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="145">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-tooltip content="详情">
              <el-button circle :icon="View" @click="openDetail(row)" />
            </el-tooltip>
            <el-tooltip content="确认违规">
              <el-button circle type="warning" :icon="Check" @click="openReview(row, 'confirmed')" />
            </el-tooltip>
            <el-tooltip content="标记误判">
              <el-button circle type="success" :icon="Close" @click="openReview(row, 'dismissed')" />
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
        @current-change="loadEvents"
      />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="策略配置" name="settings">
        <el-card shadow="never">
          <div class="policy-head">
            <el-form class="policy-form" label-width="110px">
              <el-form-item label="内容安全">
                <el-switch v-model="policySettings.enabled" />
              </el-form-item>
              <el-form-item label="观察日志">
                <el-switch v-model="policySettings.logAllowedFindings" />
              </el-form-item>
            </el-form>
            <div class="table-actions">
              <el-tooltip content="重置">
                <el-button circle :loading="policyLoading" :icon="RefreshLeft" @click="loadPolicySettings" />
              </el-tooltip>
              <el-tooltip content="保存">
                <el-button circle type="primary" :loading="savingPolicy" :icon="Check" @click="savePolicySettings" />
              </el-tooltip>
            </div>
          </div>

          <el-table v-loading="policyLoading" :data="policyRows" row-key="value" stripe>
            <el-table-column label="分类" width="120">
              <template #default="{ row }">
                {{ row.label }}
              </template>
            </el-table-column>
            <el-table-column label="启用" width="90">
              <template #default="{ row }">
                <el-switch v-model="row.policy.enabled" />
              </template>
            </el-table-column>
            <el-table-column label="默认拦截" min-width="150">
              <template #default="{ row }">
                <el-select v-model="row.policy.blockAt">
                  <el-option v-for="option in severityOptions" :key="option.value" :label="option.label" :value="option.value" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="硬规则" width="100">
              <template #default="{ row }">
                <el-switch
                  v-if="row.value === 'contact_info'"
                  v-model="policySettings.categories.contact_info.hardRuleEnabled"
                />
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="回瓶拦截" min-width="150">
              <template #default="{ row }">
                <el-select v-model="row.replyPolicy.blockAt" clearable>
                  <el-option v-for="option in severityOptions" :key="option.value" :label="option.label" :value="option.value" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="聊天拦截" min-width="150">
              <template #default="{ row }">
                <el-select v-model="row.chatPolicy.blockAt" clearable>
                  <el-option v-for="option in severityOptions" :key="option.value" :label="option.label" :value="option.value" />
                </el-select>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="detailVisible" title="审核详情" width="680px">
      <el-descriptions v-if="currentEvent" :column="2" border>
        <el-descriptions-item label="事件 ID" :span="2">{{ currentEvent.id }}</el-descriptions-item>
        <el-descriptions-item label="用户 ID">{{ currentEvent.userId }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ currentEvent.nickname || "-" }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ sourceText(currentEvent.source) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusText(currentEvent.status) }}</el-descriptions-item>
        <el-descriptions-item label="程度">{{ severityText(currentEvent.highestSeverity) }}</el-descriptions-item>
        <el-descriptions-item label="决策">{{ decisionText(currentEvent.decision) }}</el-descriptions-item>
        <el-descriptions-item label="类别" :span="2">
          <el-tag v-for="category in currentEvent.categories" :key="category" class="tag-gap" type="warning">
            {{ categoryText(category) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="原因" :span="2">{{ currentEvent.reason }}</el-descriptions-item>
        <el-descriptions-item label="预览" :span="2">{{ currentEvent.contentPreview }}</el-descriptions-item>
        <el-descriptions-item label="模型 ID">{{ currentEvent.modelId || "-" }}</el-descriptions-item>
        <el-descriptions-item label="文本长度">{{ currentEvent.contentLength }}</el-descriptions-item>
        <el-descriptions-item label="决策来源">{{ ruleSourceText(currentEvent.ruleSource) }}</el-descriptions-item>
        <el-descriptions-item label="策略版本">{{ currentEvent.policyVersion || "-" }}</el-descriptions-item>
        <el-descriptions-item label="风险发现" :span="2">
          <div v-for="finding in currentEvent.findings" :key="`${finding.category}-${finding.severity}`" class="finding-line">
            <el-tag class="tag-gap" :type="severityTagType(finding.severity)">
              {{ severityText(finding.severity) }}
            </el-tag>
            <span>{{ categoryText(finding.category) }}</span>
            <span class="muted-inline">{{ finding.reason || "-" }}</span>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="处理备注" :span="2">{{ currentEvent.reviewNote || "-" }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="reviewVisible" :title="reviewTitle" width="520px">
      <el-form class="modal-form" label-width="110px">
        <el-form-item label="处理状态">
          <el-select v-model="reviewForm.status">
            <el-option label="待处理" value="pending" />
            <el-option label="确认违规" value="confirmed" />
            <el-option label="误判" value="dismissed" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="reviewForm.note" type="textarea" :rows="3" placeholder="填写处理备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingReview" @click="saveReview">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { Check, Close, Refresh, RefreshLeft, Search, View } from "@element-plus/icons-vue";
import {
  DEFAULT_CONTENT_SAFETY_SETTINGS,
  type AdminContentModerationItem,
  type AdminContentModerationStatusUpdateInput,
  type ContentModerationCategory,
  type ContentModerationDecision,
  type ContentModerationEventStatus,
  type ContentModerationRuleSource,
  type ContentModerationSeverity,
  type ContentModerationSource,
  type ContentSafetySettings,
  type PaginatedList
} from "@heart-message/shared";
import { adminRequest } from "../services/api";
import {
  adminPageSizes,
  applyPagination,
  createPaginationState,
  listQuery
} from "../services/pagination";

const events = ref<AdminContentModerationItem[]>([]);
const loading = ref(false);
const savingReview = ref(false);
const policyLoading = ref(false);
const savingPolicy = ref(false);
const activeTab = ref("events");
const selectedRows = ref<AdminContentModerationItem[]>([]);
const tableRef = ref<{ clearSelection: () => void } | null>(null);
const currentEvent = ref<AdminContentModerationItem | null>(null);
const detailVisible = ref(false);
const reviewVisible = ref(false);
const pagination = reactive(createPaginationState());
const filters = reactive({
  keyword: "",
  source: "",
  category: "",
  severity: "",
  decision: "",
  status: ""
});
const categoryOptions: Array<{ label: string; value: ContentModerationCategory }> = [
  { label: "联系方式", value: "contact_info" },
  { label: "广告", value: "advertisement" },
  { label: "色情", value: "sexual" },
  { label: "骚扰", value: "abuse" },
  { label: "违法诈骗", value: "illegal" }
];
const severityOptions: Array<{ label: string; value: ContentModerationSeverity }> = [
  { label: "低", value: "low" },
  { label: "中", value: "medium" },
  { label: "高", value: "high" }
];
const policySettings = reactive<ContentSafetySettings>(
  createPolicySettings(DEFAULT_CONTENT_SAFETY_SETTINGS)
);
const reviewForm = reactive<AdminContentModerationStatusUpdateInput & { id: string }>({
  id: "",
  status: "pending",
  note: ""
});

const reviewTitle = computed(() => {
  return reviewForm.status === "confirmed"
    ? "确认违规"
    : reviewForm.status === "dismissed"
      ? "标记误判"
      : "处理审核";
});
const policyRows = computed(() => {
  return categoryOptions.map((option) => ({
    ...option,
    policy: policySettings.categories[option.value],
    replyPolicy: policySettings.sourceOverrides.bottle_reply[option.value],
    chatPolicy: policySettings.sourceOverrides.chat_message[option.value]
  }));
});

onMounted(() => {
  void loadEvents();
  void loadPolicySettings();
});

function createPolicySettings(input: ContentSafetySettings): ContentSafetySettings {
  const cloned = JSON.parse(JSON.stringify(input)) as ContentSafetySettings;

  cloned.sourceOverrides.bottle_throw = cloned.sourceOverrides.bottle_throw ?? {};
  cloned.sourceOverrides.bottle_reply = cloned.sourceOverrides.bottle_reply ?? {};
  cloned.sourceOverrides.chat_message = cloned.sourceOverrides.chat_message ?? {};

  for (const option of categoryOptions) {
    cloned.sourceOverrides.bottle_throw[option.value] = cloned.sourceOverrides.bottle_throw[option.value] ?? {};
    cloned.sourceOverrides.bottle_reply[option.value] = cloned.sourceOverrides.bottle_reply[option.value] ?? {};
    cloned.sourceOverrides.chat_message[option.value] = cloned.sourceOverrides.chat_message[option.value] ?? {};
  }

  return cloned;
}

function indexMethod(index: number) {
  return (pagination.page - 1) * pagination.pageSize + index + 1;
}

function sourceText(source: ContentModerationSource) {
  return {
    bottle_throw: "扔瓶",
    bottle_reply: "回瓶",
    chat_message: "聊天"
  }[source];
}

function categoryText(category: ContentModerationCategory) {
  return {
    advertisement: "广告",
    sexual: "色情",
    contact_info: "联系方式",
    abuse: "骚扰",
    illegal: "违法诈骗"
  }[category];
}

function severityText(severity: ContentModerationSeverity) {
  return {
    low: "低",
    medium: "中",
    high: "高"
  }[severity];
}

function decisionText(decision: ContentModerationDecision) {
  return {
    blocked: "已拦截",
    allowed_logged: "观察记录"
  }[decision];
}

function ruleSourceText(ruleSource: ContentModerationRuleSource) {
  return {
    hard_rule: "硬规则",
    ai_model: "AI 模型",
    mixed: "混合"
  }[ruleSource];
}

function statusText(status: ContentModerationEventStatus) {
  return {
    pending: "待处理",
    confirmed: "确认违规",
    dismissed: "误判"
  }[status];
}

function statusTagType(status: ContentModerationEventStatus) {
  return {
    pending: "warning",
    confirmed: "danger",
    dismissed: "success"
  }[status];
}

function severityTagType(severity: ContentModerationSeverity) {
  return {
    low: "info",
    medium: "warning",
    high: "danger"
  }[severity];
}

function handleSelectionChange(rows: AdminContentModerationItem[]) {
  selectedRows.value = rows;
}

function clearSelection() {
  tableRef.value?.clearSelection();
}

async function loadEvents() {
  loading.value = true;

  try {
    const data = await adminRequest<PaginatedList<AdminContentModerationItem>>(
      `/content-moderation?${listQuery(pagination, filters)}`
    );
    events.value = data.items;
    applyPagination(pagination, data.pagination);
  } finally {
    loading.value = false;
  }
}

async function applyFilters() {
  pagination.page = 1;
  await loadEvents();
}

async function resetFilters() {
  Object.assign(filters, { keyword: "", source: "", category: "", severity: "", decision: "", status: "" });
  await applyFilters();
}

async function handleSizeChange() {
  pagination.page = 1;
  await loadEvents();
}

function openDetail(row: AdminContentModerationItem) {
  currentEvent.value = row;
  detailVisible.value = true;
}

function openReview(row: AdminContentModerationItem, status: ContentModerationEventStatus) {
  Object.assign(reviewForm, {
    id: row.id,
    status,
    note: row.reviewNote || ""
  });
  reviewVisible.value = true;
}

async function saveReview() {
  savingReview.value = true;

  try {
    await adminRequest<AdminContentModerationItem>(`/content-moderation/${reviewForm.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status: reviewForm.status,
        note: reviewForm.note || undefined
      })
    });
    reviewVisible.value = false;
    ElMessage.success("审核状态已更新");
    await loadEvents();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "更新审核状态失败");
  } finally {
    savingReview.value = false;
  }
}

async function loadPolicySettings() {
  policyLoading.value = true;

  try {
    const data = await adminRequest<ContentSafetySettings>("/content-moderation/settings");
    Object.assign(policySettings, createPolicySettings(data));
  } finally {
    policyLoading.value = false;
  }
}

async function savePolicySettings() {
  savingPolicy.value = true;

  try {
    const data = await adminRequest<ContentSafetySettings>("/content-moderation/settings", {
      method: "PUT",
      body: JSON.stringify(createPolicySettings(policySettings))
    });
    Object.assign(policySettings, createPolicySettings(data));
    ElMessage.success("内容安全策略已保存");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存内容安全策略失败");
  } finally {
    savingPolicy.value = false;
  }
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    hour12: false
  });
}
</script>

<style scoped>
.content-tabs {
  --el-tabs-header-height: 44px;
}

.policy-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.policy-form {
  display: flex;
  flex-wrap: wrap;
  column-gap: 18px;
}

.tag-gap {
  margin-right: 6px;
}

.main-line {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.muted-line {
  overflow: hidden;
  color: #7a8a9e;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.finding-line {
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 28px;
}

.muted-inline {
  color: #7a8a9e;
  font-size: 12px;
}
</style>
