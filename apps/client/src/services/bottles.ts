import type {
  BottleQuota,
  BottleView,
  PickBottleResponse,
  ReplyBottleResponse,
  ThrowBottleInput,
  ThrowBottleResponse
} from "@heart-message/shared";
import { apiRequest } from "./api";

export function fetchBottleQuota() {
  return apiRequest<BottleQuota>("/v1/bottles/quota");
}

export function throwBottle(input: ThrowBottleInput) {
  return apiRequest<ThrowBottleResponse>("/v1/bottles/throw", {
    method: "POST",
    data: input
  });
}

export function pickBottle() {
  return apiRequest<PickBottleResponse>("/v1/bottles/pick", {
    method: "POST"
  });
}

export function fetchBottleDetail(id: string) {
  return apiRequest<BottleView>(`/v1/bottles/${id}`);
}

export function replyBottle(id: string, content: string) {
  return apiRequest<ReplyBottleResponse>(`/v1/bottles/${id}/reply`, {
    method: "POST",
    data: { content }
  });
}

export function deleteBottle(id: string) {
  return apiRequest<{ bottleId: string; deleted: boolean }>(`/v1/bottles/${id}`, {
    method: "DELETE"
  });
}
