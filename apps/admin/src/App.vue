<template>
  <router-view v-if="$route.meta.public" />
  <el-container v-else class="admin-shell">
    <el-aside class="admin-sidebar" width="232px">
      <div class="admin-brand">
        <span class="admin-brand__mark">H</span>
        <span>Heart Admin</span>
      </div>
      <el-menu :default-active="$route.path" router background-color="#12353e" text-color="#d9eef0" active-text-color="#ffffff">
        <el-menu-item index="/">
          <el-icon><DataBoard /></el-icon>
          <span>运营工作台</span>
        </el-menu-item>
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <span>系统参数</span>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/bottles">
          <el-icon><MessageBox /></el-icon>
          <span>瓶子管理</span>
        </el-menu-item>
        <el-menu-item index="/ai-models">
          <el-icon><Cpu /></el-icon>
          <span>AI 模型</span>
        </el-menu-item>
        <el-menu-item index="/logs">
          <el-icon><Document /></el-icon>
          <span>日志中心</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main class="admin-main">
      <div class="admin-topbar">
        <span>当前账号：{{ session.name }}</span>
        <el-button size="small" @click="logout">退出</el-button>
      </div>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { Cpu, DataBoard, Document, MessageBox, Setting, User } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import { useAdminSessionStore } from "./stores/admin-session";

const router = useRouter();
const session = useAdminSessionStore();

async function logout() {
  session.logout();
  await router.replace("/login");
}
</script>
