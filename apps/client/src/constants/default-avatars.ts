export interface DefaultAvatarOption {
  id: string;
  label: string;
  path: string;
}

export interface DefaultAvatarGroup {
  title: string;
  options: DefaultAvatarOption[];
}

export const DEFAULT_AVATAR_GROUPS: DefaultAvatarGroup[] = [
  {
    title: "男生",
    options: [
      { id: "male-01", label: "海风少年", path: "/static/avatars/defaults/male-01.png" },
      { id: "male-02", label: "晴空旅人", path: "/static/avatars/defaults/male-02.png" },
      { id: "male-03", label: "银发信客", path: "/static/avatars/defaults/male-03.png" },
      { id: "male-04", label: "码头笑脸", path: "/static/avatars/defaults/male-04.png" }
    ]
  },
  {
    title: "女生",
    options: [
      { id: "female-01", label: "日落来信", path: "/static/avatars/defaults/female-01.png" },
      { id: "female-02", label: "云边短发", path: "/static/avatars/defaults/female-02.png" },
      { id: "female-03", label: "浪花卷发", path: "/static/avatars/defaults/female-03.png" },
      { id: "female-04", label: "海边书页", path: "/static/avatars/defaults/female-04.png" }
    ]
  },
  {
    title: "动物动漫",
    options: [
      { id: "animal-01", label: "海浪小猫", path: "/static/avatars/defaults/animal-01.png" },
      { id: "animal-02", label: "蓝色企鹅", path: "/static/avatars/defaults/animal-02.png" },
      { id: "animal-03", label: "瓶边海豹", path: "/static/avatars/defaults/animal-03.png" }
    ]
  }
];

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
