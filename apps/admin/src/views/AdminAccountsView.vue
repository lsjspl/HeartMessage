<template>
  <section>
    <div class="page-head">
      <div>
        <h1>管理员管理</h1>
        <p>维护后台管理员、超级管理员和账号状态。</p>
      </div>
    </div>

    <el-card shadow="never">
      <div class="table-toolbar">
        <div class="table-filters">
          <el-input v-model="filters.keyword" clearable placeholder="管理员 ID / 账号 / 名称" @keyup.enter="applyFilters" />
          <el-select v-model="filters.role" clearable placeholder="角色">
            <el-option label="超级管理员" value="super_admin" />
            <el-option label="管理员" value="admin" />
          </el-select>
          <el-select v-model="filters.status" clearable placeholder="状态">
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
          <div class="filter-actions">
            <el-tooltip content="搜索">
              <el-button circle :icon="Search" @click="applyFilters" />
            </el-tooltip>
            <el-tooltip content="重置筛选">
              <el-button circle :icon="RefreshLeft" @click="resetFilters" />
            </el-tooltip>
          </div>
        </div>
        <div class="table-actions">
          <el-tooltip content="新增">
            <el-button circle type="primary" :icon="Plus" @click="openCreate" />
          </el-tooltip>
          <el-tooltip content="刷新">
            <el-button circle :loading="loading" :icon="Refresh" @click="loadAccounts" />
          </el-tooltip>
          <el-tooltip content="取消多选">
            <el-button circle :disabled="!selectedRows.length" :icon="Close" @click="clearSelection" />
          </el-tooltip>
        </div>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="accounts"
        row-key="id"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column type="index" label="序号" width="76" :index="indexMethod" />
        <el-table-column prop="id" label="管理员 ID" min-width="220" show-overflow-tooltip />
        <el-table-column prop="username" label="账号" min-width="150" />
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column label="角色" width="140">
          <template #default="{ row }">
            <el-tag :type="row.role === 'super_admin' ? 'warning' : 'info'">
              {{ roleText(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === "active" ? "正常" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="190">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-tooltip content="编辑">
              <el-button circle type="primary" :icon="Edit" @click="openEdit(row)" />
            </el-tooltip>
            <el-tooltip content="重置密码">
              <el-button circle :icon="Key" @click="openPassword(row)" />
            </el-tooltip>
            <el-tooltip v-if="row.status === 'active'" content="禁用">
              <el-button circle type="warning" :icon="Lock" @click="toggleStatus(row, 'disabled')" />
            </el-tooltip>
            <el-tooltip v-else content="恢复">
              <el-button circle type="success" :icon="Unlock" @click="toggleStatus(row, 'active')" />
            </el-tooltip>
            <el-tooltip content="删除">
              <el-button circle type="danger" :icon="Delete" @click="deleteAccount(row)" />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        class="table-pagination"
        :page-sizes="adminPageSizes"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="loadAccounts"
      />
    </el-card>

    <el-dialog v-model="accountDialogVisible" :title="accountForm.id ? '编辑管理员' : '新增管理员'" width="540px">
      <el-form class="modal-form" label-width="110px">
        <el-form-item label="账号">
          <el-input v-model="accountForm.username" :disabled="Boolean(accountForm.id)" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="accountForm.name" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="accountForm.role">
            <el-option label="超级管理员" value="super_admin" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="accountForm.status">
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!accountForm.id" label="初始密码">
          <el-input v-model="accountForm.password" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="accountDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveAccount">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="passwordDialogVisible" title="重置密码" width="460px">
      <el-form class="modal-form" label-width="110px">
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.password" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="resetPassword">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Close,
  Delete,
  Edit,
  Key,
  Lock,
  Plus,
  Refresh,
  RefreshLeft,
  Search,
  Unlock
} from "@element-plus/icons-vue";
import type {
  AdminAccountListItem,
  AdminAccountRole,
  AdminAccountStatus,
  PaginatedList
} from "@heart-message/shared";
import { adminRequest } from "../services/api";
import {
  adminPageSizes,
  applyPagination,
  createPaginationState,
  listQuery
} from "../services/pagination";

const loading = ref(false);
const saving = ref(false);
const accountDialogVisible = ref(false);
const passwordDialogVisible = ref(false);
const accounts = ref<AdminAccountListItem[]>([]);
const selectedRows = ref<AdminAccountListItem[]>([]);
const tableRef = ref<{ clearSelection: () => void } | null>(null);
const pagination = reactive(createPaginationState());
const filters = reactive({
  keyword: "",
  role: "",
  status: ""
});
const accountForm = reactive({
  id: "",
  username: "",
  name: "",
  role: "admin" as AdminAccountRole,
  status: "active" as AdminAccountStatus,
  password: ""
});
const passwordForm = reactive({
  id: "",
  password: ""
});

onMounted(loadAccounts);

function roleText(role: AdminAccountRole) {
  return role === "super_admin" ? "超级管理员" : "管理员";
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}

function indexMethod(index: number) {
  return (pagination.page - 1) * pagination.pageSize + index + 1;
}

function handleSelectionChange(rows: AdminAccountListItem[]) {
  selectedRows.value = rows;
}

function clearSelection() {
  tableRef.value?.clearSelection();
}

function resetAccountForm() {
  Object.assign(accountForm, {
    id: "",
    username: "",
    name: "",
    role: "admin",
    status: "active",
    password: ""
  });
}

function openCreate() {
  resetAccountForm();
  accountDialogVisible.value = true;
}

function openEdit(row: AdminAccountListItem) {
  Object.assign(accountForm, {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
    status: row.status,
    password: ""
  });
  accountDialogVisible.value = true;
}

function openPassword(row: AdminAccountListItem) {
  Object.assign(passwordForm, {
    id: row.id,
    password: ""
  });
  passwordDialogVisible.value = true;
}

async function loadAccounts() {
  loading.value = true;

  try {
    const data = await adminRequest<PaginatedList<AdminAccountListItem>>(
      `/accounts?${listQuery(pagination, filters)}`
    );
    accounts.value = data.items;
    applyPagination(pagination, data.pagination);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "加载管理员失败");
  } finally {
    loading.value = false;
  }
}

async function applyFilters() {
  pagination.page = 1;
  await loadAccounts();
}

async function resetFilters() {
  Object.assign(filters, { keyword: "", role: "", status: "" });
  await applyFilters();
}

async function handleSizeChange() {
  pagination.page = 1;
  await loadAccounts();
}

async function saveAccount() {
  saving.value = true;

  try {
    if (accountForm.id) {
      await adminRequest<AdminAccountListItem>(`/accounts/${accountForm.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: accountForm.name,
          role: accountForm.role,
          status: accountForm.status
        })
      });
    } else {
      await adminRequest<AdminAccountListItem>("/accounts", {
        method: "POST",
        body: JSON.stringify({
          username: accountForm.username,
          name: accountForm.name,
          role: accountForm.role,
          status: accountForm.status,
          password: accountForm.password
        })
      });
    }

    accountDialogVisible.value = false;
    ElMessage.success("管理员已保存");
    await loadAccounts();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存管理员失败");
  } finally {
    saving.value = false;
  }
}

async function resetPassword() {
  saving.value = true;

  try {
    await adminRequest(`/accounts/${passwordForm.id}/password`, {
      method: "PUT",
      body: JSON.stringify({ password: passwordForm.password })
    });
    passwordDialogVisible.value = false;
    ElMessage.success("密码已重置");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "重置密码失败");
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(row: AdminAccountListItem, status: AdminAccountStatus) {
  try {
    await adminRequest<AdminAccountListItem>(`/accounts/${row.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: row.name,
        role: row.role,
        status
      })
    });
    ElMessage.success(status === "active" ? "管理员已恢复" : "管理员已禁用");
    await loadAccounts();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "更新管理员状态失败");
  }
}

async function deleteAccount(row: AdminAccountListItem) {
  try {
    await ElMessageBox.confirm(`确认删除管理员「${row.username}」吗？`, "删除管理员", {
      type: "warning"
    });
    await adminRequest(`/accounts/${row.id}`, { method: "DELETE" });
    ElMessage.success("管理员已删除");
    await loadAccounts();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error(error instanceof Error ? error.message : "删除管理员失败");
    }
  }
}
</script>
