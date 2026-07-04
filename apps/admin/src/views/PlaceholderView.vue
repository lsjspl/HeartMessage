<template>
  <section>
    <div class="page-head">
      <div>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </div>
      <el-button type="primary">新建</el-button>
    </div>
    <el-card shadow="never">
      <el-empty description="页面框架已预留，等待对应 OpenSpec 变更细化。" />
    </el-card>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
}>();
</script>
