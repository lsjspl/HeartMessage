import { createRouter, createWebHistory } from "vue-router";
import DashboardView from "../views/DashboardView.vue";
import PlaceholderView from "../views/PlaceholderView.vue";
import SettingsView from "../views/SettingsView.vue";
import AiModelsView from "../views/AiModelsView.vue";
import UsersView from "../views/UsersView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
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
      component: PlaceholderView,
      props: { title: "瓶子管理", description: "审核瓶子、查看生命周期、处理删除和拦截记录。" }
    },
    {
      path: "/logs",
      component: PlaceholderView,
      props: { title: "日志中心", description: "查询管理操作、AI 调用、接口错误和风控事件。" }
    }
  ]
});
