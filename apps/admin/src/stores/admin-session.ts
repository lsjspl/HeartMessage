import { defineStore } from "pinia";
import type { AdminLoginInput, AdminSession } from "@heart-message/shared";
import { adminRequest, clearAdminToken, getAdminToken, setAdminToken } from "../services/api";

export const useAdminSessionStore = defineStore("admin-session", {
  state: () => ({
    token: getAdminToken(),
    name: "管理员",
    expiresAt: ""
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token)
  },
  actions: {
    setToken(token: string) {
      this.token = token;
      setAdminToken(token);
    },
    async login(input: AdminLoginInput) {
      const session = await adminRequest<AdminSession>("/auth/login", {
        method: "POST",
        body: JSON.stringify(input)
      });

      this.token = session.token;
      this.name = session.name;
      this.expiresAt = session.expiresAt;
      setAdminToken(session.token);
    },
    logout() {
      this.token = "";
      this.name = "管理员";
      this.expiresAt = "";
      clearAdminToken();
    }
  }
});
