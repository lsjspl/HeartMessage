<template>
  <main class="login-screen">
    <section class="login-panel">
      <h1>Heart Admin</h1>
      <p>登录后台管理漂流瓶、AI 模型和系统参数。</p>
      <el-form label-position="top" @submit.prevent>
        <el-form-item label="账号">
          <el-input v-model="form.username" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" autocomplete="current-password" show-password />
        </el-form-item>
        <el-button type="primary" :loading="loading" class="login-button" @click="submit">登录</el-button>
      </el-form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useAdminSessionStore } from "../stores/admin-session";

const router = useRouter();
const session = useAdminSessionStore();
const loading = ref(false);
const form = reactive({
  username: "local-admin",
  password: "local-admin-password-change-before-production"
});

async function submit() {
  loading.value = true;

  try {
    await session.login(form);
    await router.replace("/");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "登录失败");
  } finally {
    loading.value = false;
  }
}
</script>
