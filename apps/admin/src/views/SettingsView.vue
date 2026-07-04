<template>
  <section>
    <div class="page-head">
      <div>
        <h1>系统参数配置</h1>
        <p>控制每日额度、瓶子有效期、AI 补位策略和安全开关。</p>
      </div>
      <div>
        <el-button>重置</el-button>
        <el-button type="primary">保存配置</el-button>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card shadow="never">
          <h2 class="panel-title">用户额度</h2>
          <el-form label-width="120px">
            <el-form-item label="每日可捡">
              <el-input-number v-model="settings.pickLimit" :min="0" />
            </el-form-item>
            <el-form-item label="每日可扔">
              <el-input-number v-model="settings.throwLimit" :min="0" />
            </el-form-item>
            <el-form-item label="重置时间">
              <el-time-select v-model="settings.resetTime" start="00:00" step="00:30" end="23:30" />
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
            <el-form-item label="失败降级">
              <el-switch v-model="settings.aiFallback" />
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </section>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { DAILY_PICK_LIMIT, DAILY_THROW_LIMIT } from "@heart-message/shared";

const settings = reactive({
  pickLimit: DAILY_PICK_LIMIT,
  throwLimit: DAILY_THROW_LIMIT,
  resetTime: "00:00",
  aiTrigger: "empty_pool",
  aiBatchSize: 30,
  aiFallback: true
});
</script>
