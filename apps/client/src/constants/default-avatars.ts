export { DEFAULT_AVATAR_GROUPS } from "@heart-message/shared";

export function toDefaultAvatarUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  if (typeof window === "undefined" || !window.location?.origin) {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}

export function toAvatarPath(url: string) {
  if (!url) {
    return "";
  }

  try {
    return new URL(url, typeof window === "undefined" ? undefined : window.location.origin).pathname;
  } catch {
    return url;
  }
}
