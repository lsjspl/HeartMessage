<template>
  <section>
    <div class="page-head">
      <div>
        <h1>运营工作台</h1>
        <p>今日瓶子流转、聊天增长、AI 补位和内容安全概览。</p>
      </div>
      <div>
        <el-button>导出</el-button>
        <el-button type="primary">新建公告</el-button>
      </div>
    </div>

    <div class="metric-grid">
      <el-card v-for="metric in metrics" :key="metric.label" class="metric-card" shadow="never">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
        <el-tag :type="metric.type" effect="light">{{ metric.note }}</el-tag>
      </el-card>
    </div>

    <div class="panel-grid">
      <el-card shadow="never">
        <h2 class="panel-title">实时瓶子队列</h2>
        <el-table :data="bottles" stripe>
          <el-table-column prop="id" label="瓶子" width="120" />
          <el-table-column prop="user" label="用户" width="120" />
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.type">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="expiresAt" label="有效期" />
          <el-table-column label="操作" width="100">
            <el-button link type="primary">查看</el-button>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card shadow="never">
        <h2 class="panel-title">待处理事项</h2>
        <el-timeline>
          <el-timeline-item timestamp="12:35">3 个瓶子等待审核</el-timeline-item>
          <el-timeline-item timestamp="12:18">AI 补位队列生成完成</el-timeline-item>
          <el-timeline-item timestamp="11:42">1 条举报进入人工复核</el-timeline-item>
        </el-timeline>
      </el-card>
    </div>
  </section>
</template>

<script setup lang="ts">
const metrics = [
  { label: "今日扔瓶", value: "1,284", note: "较昨日 +12%", type: "success" as const },
  { label: "今日捡瓶", value: "8,936", note: "额度健康", type: "success" as const },
  { label: "开启聊天", value: "624", note: "转化率 7.0%", type: "primary" as const },
  { label: "AI 补位", value: "118", note: "无瓶时触发", type: "warning" as const }
];

const bottles = [
  { id: "#B10291", user: "乔木", status: "投放中", type: "success", expiresAt: "今天 23:59" },
  { id: "#B10288", user: "夏迟", status: "待审核", type: "warning", expiresAt: "今天 23:59" },
  { id: "#B10280", user: "海雾电台", status: "AI 生成", type: "success", expiresAt: "今天 23:59" },
  { id: "#B10275", user: "匿名用户", status: "已拦截", type: "danger", expiresAt: "已结束" }
];
</script>
