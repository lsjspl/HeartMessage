<template>
  <section>
    <div class="page-head">
      <div>
        <h1>系统参数配置</h1>
        <p>控制每日额度、瓶子有效期、AI 补位策略和安全开关。</p>
      </div>
      <div>
        <el-button :loading="loading" @click="loadSettings">重置</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存配置</el-button>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card shadow="never">
          <h2 class="panel-title">用户额度</h2>
          <el-form label-width="120px">
            <el-form-item label="每日可捡">
              <el-input-number v-model="settings.dailyPickLimit" :min="0" />
            </el-form-item>
            <el-form-item label="每日可扔">
              <el-input-number v-model="settings.dailyThrowLimit" :min="0" />
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <h2 class="panel-title">AI 补位</h2>
          <el-form label-width="120px">
            <el-form-item label="触发条件">
              <el-select v-model="settings.aiTrigger">
                <el-option label="无可捞瓶子" value="empty_pool" />
                <el-option label="低于安全水位" value="low_pool" />
              </el-select>
            </el-form-item>
            <el-form-item label="生成数量">
              <el-input-number v-model="settings.aiBatchSize" :min="1" />
            </el-form-item>
            <el-form-item label="AI 补位">
              <el-switch v-model="settings.aiFallbackEnabled" />
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { DAILY_PICK_LIMIT, DAILY_THROW_LIMIT, type SystemSettings } from "@heart-message/shared";
import { adminRequest } from "../services/api";

const loading = ref(false);
const saving = ref(false);
const settings = reactive({
  dailyPickLimit: DAILY_PICK_LIMIT,
  dailyThrowLimit: DAILY_THROW_LIMIT,
  bottleExpires: "end_of_day",
  aiTrigger: "empty_pool",
  aiBatchSize: 20,
  aiFallbackEnabled: true,
  aiBindings: {}
});

onMounted(loadSettings);

async function loadSettings() {
  loading.value = true;

  try {
    Object.assign(settings, await adminRequest<SystemSettings>("/settings"));
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;

  try {
    await adminRequest<SystemSettings>("/settings", {
      method: "PUT",
      body: JSON.stringify(settings)
    });
    ElMessage.success("配置已保存");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存失败");
  } finally {
    saving.value = false;
  }
}
</script>
