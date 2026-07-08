<template>
  <section>
    <div class="page-head">
      <div>
        <h1>系统参数</h1>
        <p>运行环境、访问白名单、用户额度和 AI 策略。</p>
      </div>
      <div class="table-actions">
        <el-tooltip content="重置">
          <el-button circle :loading="loading" :icon="RefreshLeft" @click="loadSettings" />
        </el-tooltip>
        <el-tooltip content="保存">
          <el-button circle type="primary" :loading="saving" :icon="Check" @click="save" />
        </el-tooltip>
      </div>
    </div>

    <div class="settings-stack">
      <section class="settings-panel">
        <div class="settings-panel__head">
          <h2>运行安全</h2>
        </div>
        <el-form class="settings-form" label-width="120px">
          <el-form-item label="运行环境">
            <el-select v-model="settings.runtime.environment">
              <el-option label="本地" value="local" />
              <el-option label="开发" value="development" />
              <el-option label="测试" value="test" />
              <el-option label="生产" value="production" />
            </el-select>
          </el-form-item>
          <el-form-item label="CORS 白名单">
            <el-input
              v-model="corsOriginsText"
              type="textarea"
              :rows="4"
              placeholder="填 * 表示允许所有来源；或每行一个域名"
            />
          </el-form-item>
        </el-form>
      </section>

      <section class="settings-panel">
        <div class="settings-panel__head">
          <h2>用户额度</h2>
        </div>
        <el-form class="settings-form settings-form--inline" label-width="120px">
          <el-form-item label="每日可捡">
            <el-input-number v-model="settings.dailyPickLimit" :min="0" :max="200" />
          </el-form-item>
          <el-form-item label="每日可扔">
            <el-input-number v-model="settings.dailyThrowLimit" :min="0" :max="50" />
          </el-form-item>
        </el-form>
      </section>

      <section class="settings-panel">
        <div class="settings-panel__head">
          <h2>AI 策略</h2>
        </div>
        <el-form class="settings-form settings-form--inline" label-width="120px">
          <el-form-item label="AI 补位">
            <el-switch v-model="settings.aiFallbackEnabled" />
          </el-form-item>
          <el-form-item label="触发条件">
            <el-select v-model="settings.aiTrigger">
              <el-option label="无可捞瓶子" value="empty_pool" />
              <el-option label="低于安全水位" value="low_pool" />
            </el-select>
          </el-form-item>
          <el-form-item label="生成数量">
            <el-input-number v-model="settings.aiBatchSize" :min="1" :max="200" />
          </el-form-item>
          <el-form-item label="画像评估">
            <el-switch v-model="settings.userProfileEvaluation.enabled" />
          </el-form-item>
          <el-form-item label="评估间隔">
            <el-input-number v-model="settings.userProfileEvaluation.intervalHours" :min="1" :max="720" />
          </el-form-item>
          <el-form-item label="每批用户">
            <el-input-number v-model="settings.userProfileEvaluation.batchSize" :min="1" :max="100" />
          </el-form-item>
        </el-form>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { Check, RefreshLeft } from "@element-plus/icons-vue";
import {
  DAILY_PICK_LIMIT,
  DAILY_THROW_LIMIT,
  DEFAULT_CONTENT_SAFETY_SETTINGS,
  type SystemSettings
} from "@heart-message/shared";
import { adminRequest } from "../services/api";

const loading = ref(false);
const saving = ref(false);
const corsOriginsText = ref("");
const settings = reactive<SystemSettings>({
  runtime: {
    environment: "production",
    corsOrigins: ["*"]
  },
  dailyPickLimit: DAILY_PICK_LIMIT,
  dailyThrowLimit: DAILY_THROW_LIMIT,
  bottleExpires: "end_of_day",
  aiTrigger: "empty_pool",
  aiBatchSize: 20,
  aiFallbackEnabled: true,
  aiBindings: {},
  userProfileEvaluation: {
    enabled: true,
    intervalHours: 24,
    batchSize: 20
  },
  contentSafety: DEFAULT_CONTENT_SAFETY_SETTINGS
});

onMounted(loadSettings);

function parseCorsOrigins() {
  return corsOriginsText.value
    .split(/[\n,]+/)
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function loadSettings() {
  loading.value = true;

  try {
    const data = await adminRequest<SystemSettings>("/settings");
    Object.assign(settings, data);
    corsOriginsText.value = data.runtime.corsOrigins.join("\n");
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;

  try {
    const payload: SystemSettings = {
      ...settings,
      runtime: {
        ...settings.runtime,
        corsOrigins: parseCorsOrigins()
      }
    };

    await adminRequest<SystemSettings>("/settings", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    ElMessage.success("配置已保存");
    await loadSettings();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存失败");
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.settings-stack {
  display: grid;
  gap: 12px;
}

.settings-panel {
  padding: 18px 20px;
  background: #ffffff;
  border: 1px solid #dce5ea;
  border-radius: 8px;
}

.settings-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.settings-panel__head h2 {
  margin: 0;
  font-size: 16px;
}

.settings-form {
  max-width: 760px;
}

.settings-form--inline {
  display: grid;
  grid-template-columns: repeat(3, minmax(240px, 1fr));
  column-gap: 18px;
}
</style>
