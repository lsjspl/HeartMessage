import { createRouter, createWebHistory } from "vue-router";
import DashboardView from "../views/DashboardView.vue";
import SettingsView from "../views/SettingsView.vue";
import AiModelsView from "../views/AiModelsView.vue";
import BottlesView from "../views/BottlesView.vue";
import LoginView from "../views/LoginView.vue";
import LogsView from "../views/LogsView.vue";
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
      path: "/ai-models",
      component: AiModelsView
    },
    {
      path: "/users",
      component: UsersView
    },
    {
      path: "/bottles",
      component: BottlesView
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
