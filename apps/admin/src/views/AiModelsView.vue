<template>
  <section>
    <div class="page-head">
      <div>
        <h1>AI 模型管理</h1>
        <p>统一维护供应商、模型、用途、密钥状态、调用日志和成本。</p>
      </div>
      <div>
        <el-button>调用日志</el-button>
        <el-button type="primary">新增模型</el-button>
      </div>
    </div>

    <div class="panel-grid">
      <el-card shadow="never">
        <h2 class="panel-title">模型列表</h2>
        <el-table :data="models" stripe>
          <el-table-column prop="provider" label="平台" width="120" />
          <el-table-column prop="name" label="模型" />
          <el-table-column prop="purpose" label="用途" width="140" />
          <el-table-column label="启用" width="100">
            <template #default="{ row }">
              <el-switch v-model="row.enabled" />
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card shadow="never">
        <h2 class="panel-title">用途绑定</h2>
        <el-form label-width="110px">
          <el-form-item label="人格生成">
            <el-select v-model="bindings.persona">
              <el-option label="DeepSeek Chat" value="deepseek-chat" />
            </el-select>
          </el-form-item>
          <el-form-item label="瓶子生成">
            <el-select v-model="bindings.bottle">
              <el-option label="DeepSeek Chat" value="deepseek-chat" />
            </el-select>
          </el-form-item>
          <el-form-item label="聊天回复">
            <el-select v-model="bindings.reply">
              <el-option label="GPT-4.1 mini" value="gpt-4.1-mini" />
            </el-select>
          </el-form-item>
          <el-form-item label="内容审核">
            <el-select v-model="bindings.moderation">
              <el-option label="Qwen Plus" value="qwen-plus" />
            </el-select>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive } from "vue";

const models = reactive([
  { provider: "OpenAI", name: "GPT-4.1 mini", purpose: "聊天回复", enabled: true },
  { provider: "DeepSeek", name: "deepseek-chat", purpose: "人格/瓶子", enabled: true },
  { provider: "Moonshot", name: "kimi-k2", purpose: "长上下文", enabled: true },
  { provider: "通义千问", name: "qwen-plus", purpose: "内容审核", enabled: true }
]);

const bindings = reactive({
  persona: "deepseek-chat",
  bottle: "deepseek-chat",
  reply: "gpt-4.1-mini",
  moderation: "qwen-plus"
});
</script>
