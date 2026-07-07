export type AvatarCategory = "male" | "female" | "neutral" | "animal_anime";
export type AvatarGender = "male" | "female" | "unknown";

export interface DefaultAvatarPreset {
  id: string;
  label: string;
  path: string;
  category: AvatarCategory;
  gender: AvatarGender;
  aiEligible: boolean;
}

export interface DefaultAvatarGroup {
  title: string;
  options: DefaultAvatarPreset[];
}

function avatarPath(id: string) {
  return `/static/avatars/defaults/${id}.webp`;
}

const maleLabels = [
  "海风少年",
  "港口来信",
  "夜航旅人",
  "雨窗旧友",
  "月下听潮",
  "书店掌柜",
  "晨跑同伴",
  "礁石画手",
  "市集暖声",
  "渡轮邻座",
  "灯塔路人",
  "海轨乘客",
  "晴空同学",
  "码头先生",
  "夏日巴士"
];

const femaleLabels = [
  "风里短发",
  "晨光书页",
  "雨港书店",
  "珊瑚笑意",
  "落日晚风",
  "海边经理",
  "雨衣卷发",
  "紫藤窗光",
  "茶室暖橙",
  "渡口短发",
  "山海辫子",
  "蓝白街角",
  "唱片夜灯",
  "栈桥粉衫",
  "海风白衫"
];

const neutralLabels = [
  "雾蓝写作者",
  "银发靠岸",
  "海边音室",
  "温室眼镜",
  "夜渡灯影",
  "手作日光",
  "海草微风",
  "青墙短发",
  "陶土午后",
  "暮色低潮"
];

const animalLabels = [
  "海盐小猫",
  "雨披小狗",
  "蓝企鹅邮差",
  "贝壳海豹",
  "码头小熊猫",
  "雨帽水獭",
  "云上小鲸",
  "电台小狐",
  "海贝兔子",
  "珊瑚海豚"
];

function createPresets(prefix: string, labels: string[], category: AvatarCategory, gender: AvatarGender, aiEligible: boolean) {
  return labels.map((label, index): DefaultAvatarPreset => {
    const id = `${prefix}-${String(index + 1).padStart(2, "0")}`;

    return {
      id,
      label,
      path: avatarPath(id),
      category,
      gender,
      aiEligible
    };
  });
}

export const DEFAULT_AVATAR_PRESETS: DefaultAvatarPreset[] = [
  ...createPresets("male", maleLabels, "male", "male", true),
  ...createPresets("female", femaleLabels, "female", "female", true),
  ...createPresets("neutral", neutralLabels, "neutral", "unknown", true),
  ...createPresets("animal", animalLabels, "animal_anime", "unknown", false)
];

export const DEFAULT_AVATAR_GROUPS: DefaultAvatarGroup[] = [
  {
    title: "男生",
    options: DEFAULT_AVATAR_PRESETS.filter((avatar) => avatar.category === "male")
  },
  {
    title: "女生",
    options: DEFAULT_AVATAR_PRESETS.filter((avatar) => avatar.category === "female")
  },
  {
    title: "中性风格",
    options: DEFAULT_AVATAR_PRESETS.filter((avatar) => avatar.category === "neutral")
  },
  {
    title: "动物动漫",
    options: DEFAULT_AVATAR_PRESETS.filter((avatar) => avatar.category === "animal_anime")
  }
];

export const AI_PERSONA_AVATAR_PRESETS = DEFAULT_AVATAR_PRESETS.filter((avatar) => avatar.aiEligible);

function hashSeed(seed: string) {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function selectAiPersonaAvatarPath(seed: string, gender: AvatarGender = "unknown") {
  const preferred = AI_PERSONA_AVATAR_PRESETS.filter((avatar) => avatar.gender === gender);
  const pool = preferred.length ? preferred : AI_PERSONA_AVATAR_PRESETS;
  const index = hashSeed(seed || "heart-message-ai-persona") % pool.length;

  return pool[index].path;
}
