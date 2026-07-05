import { createRouter, createWebHistory } from "vue-router";
import AdminAccountsView from "../views/AdminAccountsView.vue";
import DashboardView from "../views/DashboardView.vue";
import SettingsView from "../views/SettingsView.vue";
import AiBindingsView from "../views/AiBindingsView.vue";
import AiModelsView from "../views/AiModelsView.vue";
import AiProvidersView from "../views/AiProvidersView.vue";
import BottlesView from "../views/BottlesView.vue";
import ContentModerationView from "../views/ContentModerationView.vue";
import LoginView from "../views/LoginView.vue";
import LogsView from "../views/LogsView.vue";
import SensitiveConfigsView from "../views/SensitiveConfigsView.vue";
import UserProfilesView from "../views/UserProfilesView.vue";
import UsersView from "../views/UsersView.vue";
import { getAdminToken } from "../services/api";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      component: LoginView,
      meta: { public: true }
    },
    {
      path: "/",
      component: DashboardView
    },
    {
      path: "/settings",
      component: SettingsView
    },
    {
      path: "/settings/sensitive",
      component: SensitiveConfigsView
    },
    {
      path: "/admin-accounts",
      component: AdminAccountsView
    },
    {
      path: "/ai-models",
      redirect: "/ai/models"
    },
    {
      path: "/ai/providers",
      component: AiProvidersView
    },
    {
      path: "/ai/models",
      component: AiModelsView
    },
    {
      path: "/ai/bindings",
      component: AiBindingsView
    },
    {
      path: "/users",
      component: UsersView
    },
    {
      path: "/users/profiles",
      component: UserProfilesView
    },
    {
      path: "/bottles",
      component: BottlesView
    },
    {
      path: "/content/moderation",
      component: ContentModerationView
    },
    {
      path: "/logs",
      component: LogsView
    }
  ]
});

router.beforeEach((to) => {
  if (to.meta.public) {
    return true;
  }

  if (!getAdminToken()) {
    return "/login";
  }

  return true;
});
