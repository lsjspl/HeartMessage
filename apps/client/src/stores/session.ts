import { defineStore } from "pinia";
import {
  type BottleQuota,
  DAILY_PICK_LIMIT,
  DAILY_THROW_LIMIT,
  type AuthSession,
  type AuthUser,
  type CurrentUser,
  type ProfileUpsertInput,
  type UserProfile
} from "@heart-message/shared";
import { apiRequest, clearAuthToken, getAuthToken, setAuthToken } from "../services/api";

export const useSessionStore = defineStore("session", {
  state: () => ({
    token: getAuthToken(),
    user: null as AuthUser | null,
    profile: null as UserProfile | null,
    quotas: {
      pickRemaining: DAILY_PICK_LIMIT,
      throwRemaining: DAILY_THROW_LIMIT
    }
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token),
    hasProfile: (state) => Boolean(state.profile?.nickname)
  },
  actions: {
    setToken(token: string) {
      this.token = token;
    },
    setProfile(profile: UserProfile) {
      this.profile = profile;
    },
    applyCurrentUser(current: CurrentUser) {
      this.user = current.user;
      this.profile = current.profile;
    },
    setQuotas(pickRemaining: number, throwRemaining: number) {
      this.quotas = {
        pickRemaining,
        throwRemaining
      };
    },
    applyQuota(quota: BottleQuota) {
      this.setQuotas(quota.pickRemaining, quota.throwRemaining);
    },
    async loginWithWechatCode(code: string) {
      const session = await apiRequest<AuthSession>("/v1/auth/wechat", {
        method: "POST",
        data: { code }
      });

      this.token = session.token;
      this.user = session.user;
      this.profile = session.profile;
      setAuthToken(session.token);

      return session;
    },
    async fetchCurrentUser() {
      if (!this.token) {
        return null;
      }

      const current = await apiRequest<CurrentUser>("/v1/me");
      this.applyCurrentUser(current);
      return current;
    },
    async saveProfile(input: ProfileUpsertInput) {
      const profile = await apiRequest<UserProfile>("/v1/me/profile", {
        method: "PUT",
        data: input
      });

      this.profile = profile;
      return profile;
    },
    logout() {
      this.token = "";
      this.user = null;
      this.profile = null;
      clearAuthToken();
    }
  }
});
