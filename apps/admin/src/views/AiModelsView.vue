<template>
  <section>
    <div class="page-head">
      <div>
        <h1>AI 模型管理</h1>
        <p>维护供应商、模型、用途和各用途绑定，不保存真实 API Key。</p>
      </div>
      <el-button :loading="loading" @click="loadConfig">刷新</el-button>
    </div>

    <div class="panel-grid">
      <el-card shadow="never">
        <h2 class="panel-title">供应商</h2>
        <el-form label-width="120px">
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
          <el-form-item label="密钥变量">
            <el-input v-model="providerForm.apiKeySecretName" placeholder="OPENAI_API_KEY" />
          </el-form-item>
          <el-form-item label="启用">
            <el-switch v-model="providerForm.isEnabled" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="savingProvider" @click="saveProvider">保存供应商</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="config.providers" stripe>
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="adapterType" label="适配器" width="150" />
          <el-table-column prop="apiKeySecretName" label="密钥变量" />
          <el-table-column label="启用" width="90">
            <template #default="{ row }">
              <el-tag :type="row.isEnabled ? 'success' : 'info'">{{ row.isEnabled ? "是" : "否" }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card shadow="never">
        <h2 class="panel-title">用途绑定</h2>
        <el-form label-width="110px">
          <el-form-item label="人格生成">
            <el-select v-model="bindings.persona_generation" clearable>
              <el-option v-for="model in config.models" :key="model.id" :label="model.displayName" :value="model.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="瓶子生成">
            <el-select v-model="bindings.bottle_generation" clearable>
              <el-option v-for="model in config.models" :key="model.id" :label="model.displayName" :value="model.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="聊天回复">
            <el-select v-model="bindings.chat_reply" clearable>
              <el-option v-for="model in config.models" :key="model.id" :label="model.displayName" :value="model.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="内容审核">
            <el-select v-model="bindings.content_moderation" clearable>
              <el-option v-for="model in config.models" :key="model.id" :label="model.displayName" :value="model.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="savingBindings" @click="saveBindings">保存绑定</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <el-card shadow="never" class="model-panel">
      <h2 class="panel-title">模型</h2>
      <el-form class="model-form" label-width="110px">
        <el-form-item label="供应商">
          <el-select v-model="modelForm.providerId">
            <el-option v-for="provider in config.providers" :key="provider.id" :label="provider.name" :value="provider.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="展示名">
          <el-input v-model="modelForm.displayName" />
        </el-form-item>
        <el-form-item label="模型名">
          <el-input v-model="modelForm.modelName" />
        </el-form-item>
        <el-form-item label="用途">
          <el-select v-model="modelForm.purpose">
            <el-option label="人格生成" value="persona_generation" />
            <el-option label="瓶子生成" value="bottle_generation" />
            <el-option label="聊天回复" value="chat_reply" />
            <el-option label="内容审核" value="content_moderation" />
          </el-select>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="modelForm.isEnabled" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="savingModel" @click="saveModel">保存模型</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="config.models" stripe>
        <el-table-column prop="providerName" label="平台" width="130" />
        <el-table-column prop="displayName" label="展示名" />
        <el-table-column prop="modelName" label="模型名" />
        <el-table-column prop="purpose" label="用途" width="160" />
        <el-table-column label="启用" width="90">
          <template #default="{ row }">
            <el-tag :type="row.isEnabled ? 'success' : 'info'">{{ row.isEnabled ? "是" : "否" }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import type { AdminAiConfig, AiModelPurpose } from "@heart-message/shared";
import { adminRequest } from "../services/api";

const loading = ref(false);
const savingProvider = ref(false);
const savingModel = ref(false);
const savingBindings = ref(false);
const config = reactive<AdminAiConfig>({
  providers: [],
  models: [],
  bindings: {}
});
const providerForm = reactive({
  name: "",
  adapterType: "openai_compatible",
  baseUrl: "",
  apiKeySecretName: "",
  isEnabled: true
});
const modelForm = reactive({
  providerId: "",
  displayName: "",
  modelName: "",
  purpose: "chat_reply" as AiModelPurpose,
  isEnabled: true,
  configJson: {}
});
const bindings = reactive<AdminAiConfig["bindings"]>({});

onMounted(loadConfig);

async function loadConfig() {
  loading.value = true;

  try {
    const data = await adminRequest<AdminAiConfig>("/ai/config");
    Object.assign(config, data);
    Object.assign(bindings, data.bindings);
  } finally {
    loading.value = false;
  }
}

async function saveProvider() {
  savingProvider.value = true;

  try {
    const data = await adminRequest<AdminAiConfig>("/ai/providers", {
      method: "POST",
      body: JSON.stringify({
        ...providerForm,
        baseUrl: providerForm.baseUrl || undefined
      })
    });
    Object.assign(config, data);
    Object.assign(providerForm, {
      name: "",
      adapterType: "openai_compatible",
      baseUrl: "",
      apiKeySecretName: "",
      isEnabled: true
    });
    ElMessage.success("供应商已保存");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存供应商失败");
  } finally {
    savingProvider.value = false;
  }
}

async function saveModel() {
  savingModel.value = true;

  try {
    const data = await adminRequest<AdminAiConfig>("/ai/models", {
      method: "POST",
      body: JSON.stringify(modelForm)
    });
    Object.assign(config, data);
    Object.assign(modelForm, {
      providerId: "",
      displayName: "",
      modelName: "",
      purpose: "chat_reply",
      isEnabled: true,
      configJson: {}
    });
    ElMessage.success("模型已保存");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存模型失败");
  } finally {
    savingModel.value = false;
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
    ElMessage.success("用途绑定已保存");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存绑定失败");
  } finally {
    savingBindings.value = false;
  }
}
</script>

<style scoped>
.model-panel {
  margin-top: 16px;
}

.model-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0 16px;
}
</style>
