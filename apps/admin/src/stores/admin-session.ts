import { defineStore } from "pinia";

export const useAdminSessionStore = defineStore("admin-session", {
  state: () => ({
    token: "",
    name: "管理员"
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token)
  },
  actions: {
    setToken(token: string) {
      this.token = token;
    }
  }
});
