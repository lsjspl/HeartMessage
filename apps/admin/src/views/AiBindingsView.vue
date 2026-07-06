<template>
  <section>
    <div class="page-head">
      <div>
        <h1>AI 用途绑定</h1>
        <p>为每个 AI 用途选择对应模型，内容审核和画像评估使用独立用途。</p>
      </div>
      <div>
        <el-button :loading="loading" @click="loadConfig">刷新</el-button>
        <el-button type="primary" :loading="savingBindings" @click="saveBindings">保存绑定</el-button>
      </div>
    </div>

    <el-card shadow="never">
      <el-form label-width="120px" class="bindings-form">
        <el-form-item v-for="purpose in purposes" :key="purpose.value" :label="purpose.label">
          <el-select v-model="bindings[purpose.value]" clearable placeholder="请选择模型">
            <el-option
              v-for="model in modelsForPurpose(purpose.value)"
              :key="model.id"
              :label="model.displayName"
              :value="model.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import type { AdminAiConfig, AiModelPurpose } from "@heart-message/shared";
import { adminRequest } from "../services/api";

const purposes: Array<{ label: string; value: AiModelPurpose }> = [
  { label: "人格生成", value: "persona_generation" },
  { label: "瓶子生成", value: "bottle_generation" },
  { label: "聊天回复", value: "chat_reply" },
  { label: "内容审核", value: "content_moderation" },
  { label: "画像评估", value: "user_profile_evaluation" }
];

const loading = ref(false);
const savingBindings = ref(false);
const config = reactive<AdminAiConfig>({
  providers: [],
  models: [],
  bindings: {}
});
const bindings = reactive<AdminAiConfig["bindings"]>({});

onMounted(loadConfig);

function syncBindings(nextBindings: AdminAiConfig["bindings"]) {
  for (const purpose of purposes) {
    delete bindings[purpose.value];
  }

  Object.assign(bindings, nextBindings);
}

function modelsForPurpose(purpose: AiModelPurpose) {
  return config.models.filter((model) => model.purposes.includes(purpose) && model.isEnabled);
}

async function loadConfig() {
  loading.value = true;

  try {
    const data = await adminRequest<AdminAiConfig>("/ai/config");
    Object.assign(config, data);
    syncBindings(data.bindings);
  } finally {
    loading.value = false;
  }
}

async function saveBindings() {
  savingBindings.value = true;

  try {
    const data = await adminRequest<AdminAiConfig>("/ai/bindings", {
      method: "PUT",
      body: JSON.stringify(bindings)
    });
    Object.assign(config, data);
    syncBindings(data.bindings);
    ElMessage.success("用途绑定已保存");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存绑定失败");
  } finally {
    savingBindings.value = false;
  }
}
</script>

<style scoped>
.bindings-form {
  max-width: 640px;
}
</style>
