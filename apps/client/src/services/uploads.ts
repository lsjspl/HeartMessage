import type { ApiResult, AvatarUploadTicket } from "@heart-message/shared";
import { apiRequest, getApiBaseUrl, getAuthToken } from "./api";

const supportedTypes = ["image/jpeg", "image/png", "image/webp"] as const;
type SupportedAvatarType = (typeof supportedTypes)[number];

function parseUploadResponse(data: string) {
  const body = JSON.parse(data) as ApiResult<AvatarUploadTicket>;

  if (!body.ok) {
    throw new Error(body.error.message);
  }

  return body.data;
}

export function resolveAvatarContentType(fileName: string, explicitType?: string): SupportedAvatarType {
  if (supportedTypes.includes(explicitType as SupportedAvatarType)) {
    return explicitType as SupportedAvatarType;
  }

  const normalizedName = fileName.toLowerCase();

  if (normalizedName.endsWith(".png")) {
    return "image/png";
  }

  if (normalizedName.endsWith(".webp")) {
    return "image/webp";
  }

  return "image/jpeg";
}

export async function requestAvatarUploadTicket(fileName: string, contentType: SupportedAvatarType) {
  return apiRequest<AvatarUploadTicket>("/v1/uploads/avatar", {
    method: "POST",
    data: {
      fileName,
      contentType
    }
  });
}

export async function uploadAvatarFile(filePath: string, fileName: string, contentType: SupportedAvatarType) {
  const ticket = await requestAvatarUploadTicket(fileName, contentType);
  const token = getAuthToken();

  return new Promise<AvatarUploadTicket>((resolve, reject) => {
    uni.uploadFile({
      url: `${getApiBaseUrl()}${ticket.uploadUrl}`,
      filePath,
      name: "file",
      header: {
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      success(response) {
        try {
          if (response.statusCode >= 400) {
            const body = response.data ? (JSON.parse(response.data) as ApiResult<never>) : null;
            reject(new Error(body?.ok === false ? body.error.message : `上传失败：${response.statusCode}`));
            return;
          }

          resolve(parseUploadResponse(response.data));
        } catch (error) {
          reject(error instanceof Error ? error : new Error("头像上传失败"));
        }
      },
      fail(error) {
        reject(new Error(error.errMsg));
      }
    });
  });
}
