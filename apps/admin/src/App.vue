<template>
  <router-view v-if="$route.meta.public" />
  <el-container v-else class="admin-shell">
    <el-aside class="admin-sidebar" width="232px">
      <div class="admin-brand">
        <span class="admin-brand__mark">H</span>
        <span>Heart Admin</span>
      </div>
      <el-menu
        :default-active="$route.path"
        :default-openeds="defaultOpeneds"
        router
        background-color="#12353e"
        text-color="#d9eef0"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/">
          <el-icon><DataBoard /></el-icon>
          <span>运营工作台</span>
        </el-menu-item>
        <el-sub-menu index="/system">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统配置</span>
          </template>
          <el-menu-item index="/settings">系统参数</el-menu-item>
          <el-menu-item index="/settings/sensitive">敏感配置</el-menu-item>
          <el-menu-item index="/admin-accounts">管理员管理</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="/users">
          <template #title>
            <el-icon><User /></el-icon>
            <span>用户中心</span>
          </template>
          <el-menu-item index="/users">用户列表</el-menu-item>
          <el-menu-item index="/users/profiles">用户画像</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="/content">
          <template #title>
            <el-icon><MessageBox /></el-icon>
            <span>内容管理</span>
          </template>
          <el-menu-item index="/bottles">瓶子列表</el-menu-item>
          <el-menu-item index="/content/moderation">内容审核</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="/ai">
          <template #title>
            <el-icon><Cpu /></el-icon>
            <span>AI 配置</span>
          </template>
          <el-menu-item index="/ai/providers">供应商</el-menu-item>
          <el-menu-item index="/ai/models">模型</el-menu-item>
          <el-menu-item index="/ai/bindings">用途绑定</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/logs">
          <el-icon><Document /></el-icon>
          <span>日志中心</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main class="admin-main">
      <div class="admin-topbar">
        <span>当前账号：{{ session.name }}</span>
        <el-button size="small" @click="passwordDialogVisible = true">修改密码</el-button>
        <el-button size="small" @click="logout">退出</el-button>
      </div>
      <router-view />
    </el-main>
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="460px">
      <el-form class="modal-form" label-width="110px">
        <el-form-item label="旧密码">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingPassword" @click="changePassword">保存</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup lang="ts">
import { Cpu, DataBoard, Document, MessageBox, Setting, User } from "@element-plus/icons-vue";
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { adminRequest } from "./services/api";
import { useAdminSessionStore } from "./stores/admin-session";

const router = useRouter();
const session = useAdminSessionStore();
const defaultOpeneds = ["/system", "/users", "/content", "/ai"];
const passwordDialogVisible = ref(false);
const savingPassword = ref(false);
const passwordForm = reactive({
  oldPassword: "",
  newPassword: ""
});

async function changePassword() {
  savingPassword.value = true;

  try {
    await adminRequest("/auth/password", {
      method: "PUT",
      body: JSON.stringify(passwordForm)
    });
    Object.assign(passwordForm, { oldPassword: "", newPassword: "" });
    passwordDialogVisible.value = false;
    ElMessage.success("密码已修改，请记住新密码");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "修改密码失败");
  } finally {
    savingPassword.value = false;
  }
}

async function logout() {
  session.logout();
  await router.replace("/login");
}
</script>
