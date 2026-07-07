<template>
  <view v-if="visible" class="bottle-dock">
    <view class="dock-backdrop" @click="closeDock" />
    <view class="dock-panel">
      <view class="dock-sidebar">
        <view class="dock-head">
          <view>
            <text class="dock-title">我的瓶子</text>
            <text class="dock-subtitle">{{ items.length }} 封来信</text>
          </view>
          <button class="icon-button" hover-class="none" @click="refreshDock">刷新</button>
        </view>

        <scroll-view scroll-y class="bottle-list">
          <view
            v-for="item in items"
            :key="`${item.relation}-${item.id}`"
            class="bottle-row"
            :class="{ active: item.id === selectedBottleId }"
            @click="selectBottle(item.id)"
          >
            <view class="row-avatar">
              <image v-if="item.author.avatarUrl" class="avatar-image" :src="item.author.avatarUrl" mode="aspectFill" />
              <text v-else>{{ authorInitial(item.author.nickname) }}</text>
            </view>
            <view class="row-main">
              <view class="row-topline">
                <text class="row-name">{{ item.author.nickname }}</text>
                <text class="row-time">{{ formatTime(item.updatedAt) }}</text>
              </view>
              <text class="row-preview">{{ item.contentPreview }}</text>
              <view class="row-meta">
                <text class="meta-pill">{{ relationLabel(item.relation) }}</text>
                <text v-if="item.source === 'ai'" class="meta-pill ai">AI</text>
                <text v-if="item.conversationId" class="meta-pill chat">聊天中</text>
              </view>
            </view>
          </view>

          <view v-if="listLoading" class="list-state">
            <text>正在捞取瓶子...</text>
          </view>
          <view v-else-if="!items.length" class="list-state empty">
            <text>还没有瓶子</text>
          </view>
        </scroll-view>
      </view>

      <view class="dock-main">
        <view class="main-toolbar">
          <view>
            <text class="main-title">{{ mainTitle }}</text>
            <text class="main-subtitle">{{ mainSubtitle }}</text>
          </view>
          <button class="icon-button close-button" hover-class="none" @click="closeDock">关闭</button>
        </view>

        <view v-if="detailLoading" class="main-state">
          <text>正在打开...</text>
        </view>

        <view v-else-if="!activeItem" class="main-state">
          <text>海面还没有新瓶子</text>
        </view>

        <view v-else-if="activeItem.conversationId" class="chat-pane">
          <view class="chat-head">
            <view class="row-avatar chat-avatar">
              <image v-if="conversation?.peer.avatarUrl" class="avatar-image" :src="conversation.peer.avatarUrl" mode="aspectFill" />
              <text v-else>{{ authorInitial(peerName) }}</text>
            </view>
            <view class="chat-peer">
              <text class="peer-name">{{ peerName }}</text>
              <text class="peer-note">由瓶子开启</text>
            </view>
            <button class="delete-button" hover-class="none" :disabled="isDeleting" @click="removeCurrentChat">删除</button>
          </view>

          <scroll-view scroll-y class="chat-stream">
            <view
              v-for="message in messages"
              :key="message.id"
              class="chat-bubble"
              :class="message.isMine ? 'mine' : 'theirs'"
            >
              <text>{{ message.content }}</text>
            </view>
            <view v-if="!messages.length" class="main-state compact">
              <text>还没有消息</text>
            </view>
          </scroll-view>

          <view class="chat-input-row">
            <input
              class="chat-input"
              v-model="messageContent"
              confirm-type="send"
              placeholder="输入回复..."
              @confirm="sendChat"
            />
            <button class="send-button" hover-class="none" :disabled="isSending || !messageContent.trim()" @click="sendChat">
              发送
            </button>
          </view>
        </view>

        <view v-else class="letter-pane">
          <view v-if="bottle" class="letter-paper">
            <view class="letter-author">
              <view class="row-avatar">
                <image v-if="bottle.author.avatarUrl" class="avatar-image" :src="bottle.author.avatarUrl" mode="aspectFill" />
                <text v-else>{{ authorInitial(bottle.author.nickname) }}</text>
              </view>
              <view>
                <text class="peer-name">{{ bottle.author.nickname }}</text>
                <text class="peer-note">{{ authorMeta }}</text>
              </view>
            </view>
            <text class="letter-content">{{ bottle.content }}</text>
          </view>

          <view v-if="activeItem.relation === 'picked'" class="reply-box">
            <textarea class="reply-input" v-model="replyContent" placeholder="写下你的回复..." />
            <view class="reply-actions">
              <button class="delete-button" hover-class="none" :disabled="isDeleting" @click="removeCurrentBottle">删除</button>
              <button class="send-button wide" hover-class="none" :disabled="isReplying || !replyContent.trim()" @click="replyToBottle">
                {{ isReplying ? "发送中" : "回复" }}
              </button>
            </view>
          </view>

          <view v-else class="main-state compact">
            <text>这封瓶子还在海面上</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { BottleAuthor, BottleView, ChatMessage, ConversationMessages, UserBottleListItem } from "@heart-message/shared";
import { deleteBottle, fetchBottleDetail, fetchMyBottles, replyBottle } from "../../../services/bottles";
import { deleteChat, fetchChatMessages, sendChatMessage } from "../../../services/chats";

const props = defineProps<{
  visible: boolean;
  selectedBottleId?: string;
}>();

const emit = defineEmits<{
  (event: "close"): void;
  (event: "count-change", count: number): void;
}>();

const items = ref<UserBottleListItem[]>([]);
const selectedBottleId = ref("");
const bottle = ref<BottleView | null>(null);
const conversation = ref<ConversationMessages | null>(null);
const listLoading = ref(false);
const detailLoading = ref(false);
const isReplying = ref(false);
const isSending = ref(false);
const isDeleting = ref(false);
const replyContent = ref("");
const messageContent = ref("");

const activeItem = computed(() => items.value.find((item) => item.id === selectedBottleId.value) ?? null);
const messages = computed<ChatMessage[]>(() => conversation.value?.messages ?? []);
const peerName = computed(() => conversation.value?.peer.nickname || activeItem.value?.author.nickname || "漂流瓶用户");
const mainTitle = computed(() => {
  if (!activeItem.value) {
    return "瓶子收件箱";
  }

  return activeItem.value.conversationId ? peerName.value : activeItem.value.author.nickname;
});
const mainSubtitle = computed(() => {
  if (!activeItem.value) {
    return "潮水会把新故事送来";
  }

  return activeItem.value.conversationId ? "聊天窗口" : `${relationLabel(activeItem.value.relation)}的瓶子`;
});
const authorMeta = computed(() => {
  if (!bottle.value) {
    return "";
  }

  const age = bottle.value.author.age ? `${bottle.value.author.age} 岁` : "年龄未知";
  const genderMap = {
    male: "男",
    female: "女",
    unknown: "保密"
  };

  return `${age} · ${genderMap[bottle.value.author.gender]}`;
});

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      await loadBottleList(props.selectedBottleId);
    }
  },
  { immediate: true }
);

watch(
  () => props.selectedBottleId,
  async (id) => {
    if (props.visible && id) {
      await selectBottle(id);
    }
  }
);

async function refreshDock() {
  await loadBottleList(selectedBottleId.value || props.selectedBottleId);
}

async function loadBottleList(preferredId = "") {
  listLoading.value = true;

  try {
    const nextItems = await fetchMyBottles();
    items.value = nextItems;
    emit("count-change", nextItems.length);

    const nextSelectedId =
      findSelectableId(preferredId) || findSelectableId(selectedBottleId.value) || nextItems[0]?.id || "";

    if (nextSelectedId) {
      await selectBottle(nextSelectedId);
    } else {
      resetSelection();
    }
  } catch (error) {
    showToast(getErrorMessage(error, "瓶子列表加载失败"));
  } finally {
    listLoading.value = false;
  }
}

async function refreshBottleListOnly() {
  try {
    const nextItems = await fetchMyBottles();
    items.value = nextItems;
    emit("count-change", nextItems.length);
  } catch (error) {
    showToast(getErrorMessage(error, "瓶子列表刷新失败"));
  }
}

function findSelectableId(id: string) {
  return id && items.value.some((item) => item.id === id) ? id : "";
}

async function selectBottle(id: string) {
  const item = items.value.find((candidate) => candidate.id === id);

  selectedBottleId.value = id;
  replyContent.value = "";
  messageContent.value = "";

  if (item?.conversationId) {
    await loadConversation(item.conversationId);
    return;
  }

  await loadBottle(id);
}

async function loadBottle(id: string) {
  detailLoading.value = true;
  conversation.value = null;

  try {
    bottle.value = await fetchBottleDetail(id);
  } catch (error) {
    bottle.value = null;
    showToast(getErrorMessage(error, "瓶子打开失败"));
  } finally {
    detailLoading.value = false;
  }
}

async function loadConversation(conversationId: string) {
  detailLoading.value = true;
  bottle.value = null;

  try {
    conversation.value = await fetchChatMessages(conversationId);
  } catch (error) {
    conversation.value = null;
    showToast(getErrorMessage(error, "聊天加载失败"));
  } finally {
    detailLoading.value = false;
  }
}

async function replyToBottle() {
  if (!bottle.value || isReplying.value || !replyContent.value.trim()) {
    return;
  }

  isReplying.value = true;

  try {
    const result = await replyBottle(bottle.value.id, replyContent.value.trim());
    replyContent.value = "";
    await refreshBottleListOnly();
    selectedBottleId.value = result.bottleId;
    await loadConversation(result.conversationId);
  } catch (error) {
    showToast(getErrorMessage(error, "回复失败"));
  } finally {
    isReplying.value = false;
  }
}

async function sendChat() {
  const conversationId = activeItem.value?.conversationId;

  if (!conversationId || isSending.value || !messageContent.value.trim()) {
    return;
  }

  isSending.value = true;

  try {
    await sendChatMessage(conversationId, messageContent.value.trim());
    messageContent.value = "";
    await loadConversation(conversationId);
    await refreshBottleListOnly();
  } catch (error) {
    showToast(getErrorMessage(error, "发送失败"));
  } finally {
    isSending.value = false;
  }
}

async function removeCurrentBottle() {
  if (!bottle.value || activeItem.value?.relation !== "picked" || isDeleting.value) {
    return;
  }

  isDeleting.value = true;

  try {
    await deleteBottle(bottle.value.id);
    showToast("已删除", "success");
    await loadBottleList();
  } catch (error) {
    showToast(getErrorMessage(error, "删除失败"));
  } finally {
    isDeleting.value = false;
  }
}

async function removeCurrentChat() {
  const conversationId = activeItem.value?.conversationId;

  if (!conversationId || isDeleting.value) {
    return;
  }

  isDeleting.value = true;

  try {
    await deleteChat(conversationId);
    showToast("已删除", "success");
    await loadBottleList(selectedBottleId.value);
  } catch (error) {
    showToast(getErrorMessage(error, "删除失败"));
  } finally {
    isDeleting.value = false;
  }
}

function resetSelection() {
  selectedBottleId.value = "";
  bottle.value = null;
  conversation.value = null;
  replyContent.value = "";
  messageContent.value = "";
}

function closeDock() {
  emit("close");
}

function relationLabel(relation: UserBottleListItem["relation"]) {
  return relation === "picked" ? "捡到" : "扔出";
}

function authorInitial(name: string) {
  return name.trim().slice(0, 1) || "瓶";
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");

  return `${month}/${day} ${hour}:${minute}`;
}

function showToast(title: string, icon: "none" | "success" = "none") {
  uni.showToast({
    title,
    icon
  });
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}
</script>

<style scoped lang="scss">
.bottle-dock {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 34rpx;
  box-sizing: border-box;
  pointer-events: auto;
}

.dock-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(10, 31, 44, 0.34);
  backdrop-filter: blur(10px);
}

.dock-panel {
  position: relative;
  display: grid;
  grid-template-columns: 320rpx minmax(0, 1fr);
  width: min(96vw, 1180px);
  height: min(82vh, 720px);
  overflow: hidden;
  background: #f7fbf8;
  border: 1rpx solid rgba(255, 255, 255, 0.72);
  border-radius: 24rpx;
  box-shadow: 0 34rpx 90rpx rgba(13, 48, 72, 0.3);
}

.dock-sidebar {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #edf4f2;
  border-right: 1rpx solid rgba(19, 56, 82, 0.1);
}

.dock-head,
.main-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  padding: 24rpx;
  box-sizing: border-box;
}

.dock-title,
.dock-subtitle,
.main-title,
.main-subtitle,
.row-name,
.row-time,
.row-preview,
.peer-name,
.peer-note,
.letter-content {
  display: block;
}

.dock-title,
.main-title {
  color: #123852;
  font-size: 30rpx;
  font-weight: 900;
  line-height: 1.2;
}

.dock-subtitle,
.main-subtitle {
  margin-top: 6rpx;
  color: rgba(18, 56, 82, 0.58);
  font-size: 22rpx;
  font-weight: 800;
}

.icon-button,
.delete-button,
.send-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 58rpx;
  margin: 0;
  padding: 0 20rpx;
  border: 0;
  border-radius: 12rpx;
  font-size: 22rpx;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 58rpx;
}

.icon-button {
  color: #17606a;
  background: rgba(255, 255, 255, 0.72);
}

.close-button {
  color: #ffffff;
  background: #123852;
}

.delete-button {
  color: #ffffff;
  background: #e5525c;
}

.send-button {
  color: #ffffff;
  background: #0b7d89;
}

.send-button[disabled],
.delete-button[disabled] {
  opacity: 0.55;
}

.bottle-list {
  flex: 1;
  min-height: 0;
  padding: 0 12rpx 18rpx;
  box-sizing: border-box;
}

.bottle-row {
  display: flex;
  gap: 16rpx;
  min-height: 126rpx;
  padding: 18rpx 16rpx;
  margin-bottom: 10rpx;
  background: rgba(255, 255, 255, 0.58);
  border: 1rpx solid transparent;
  border-radius: 14rpx;
  box-sizing: border-box;
}

.bottle-row.active {
  background: #ffffff;
  border-color: rgba(11, 125, 137, 0.28);
  box-shadow: 0 12rpx 30rpx rgba(13, 78, 93, 0.12);
}

.row-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 58rpx;
  height: 58rpx;
  overflow: hidden;
  color: #ffffff;
  background: linear-gradient(135deg, #0b7d89, #ef7653);
  border-radius: 999rpx;
  font-size: 24rpx;
  font-weight: 900;
}

.avatar-image {
  width: 100%;
  height: 100%;
}

.row-main {
  min-width: 0;
  flex: 1;
}

.row-topline {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.row-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: #123852;
  font-size: 24rpx;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-time {
  flex: 0 0 auto;
  color: rgba(18, 56, 82, 0.48);
  font-size: 18rpx;
  font-weight: 800;
}

.row-preview {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 8rpx;
  color: rgba(18, 56, 82, 0.68);
  font-size: 22rpx;
  line-height: 1.36;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.row-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 10rpx;
}

.meta-pill {
  padding: 4rpx 9rpx;
  color: #17606a;
  background: #dcefed;
  border-radius: 999rpx;
  font-size: 17rpx;
  font-weight: 900;
  line-height: 1.1;
}

.meta-pill.ai {
  color: #8a4d22;
  background: #ffe9d2;
}

.meta-pill.chat {
  color: #ffffff;
  background: #123852;
}

.list-state,
.main-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180rpx;
  color: rgba(18, 56, 82, 0.58);
  font-size: 24rpx;
  font-weight: 800;
  text-align: center;
}

.list-state.empty {
  min-height: 280rpx;
}

.dock-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: linear-gradient(180deg, #fbfcf8 0%, #eef7f4 100%);
}

.main-toolbar {
  border-bottom: 1rpx solid rgba(19, 56, 82, 0.08);
}

.chat-pane,
.letter-pane {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  padding: 24rpx;
  box-sizing: border-box;
}

.chat-head,
.letter-author {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.chat-head {
  padding: 18rpx;
  background: rgba(255, 255, 255, 0.72);
  border: 1rpx solid rgba(19, 56, 82, 0.08);
  border-radius: 16rpx;
}

.chat-avatar {
  width: 64rpx;
  height: 64rpx;
}

.chat-peer {
  min-width: 0;
  flex: 1;
}

.peer-name {
  overflow: hidden;
  color: #123852;
  font-size: 27rpx;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.peer-note {
  margin-top: 5rpx;
  color: rgba(18, 56, 82, 0.58);
  font-size: 21rpx;
  font-weight: 800;
}

.chat-stream {
  flex: 1;
  min-height: 0;
  padding: 24rpx 4rpx;
  box-sizing: border-box;
}

.chat-bubble {
  max-width: 70%;
  padding: 18rpx 22rpx;
  margin-bottom: 16rpx;
  border-radius: 16rpx;
  font-size: 25rpx;
  line-height: 1.58;
  word-break: break-word;
}

.chat-bubble.mine {
  margin-left: auto;
  color: #ffffff;
  background: #0b7d89;
}

.chat-bubble.theirs {
  color: #263d4f;
  background: #ffffff;
  border: 1rpx solid rgba(19, 56, 82, 0.08);
}

.chat-input-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding-top: 12rpx;
}

.chat-input,
.reply-input {
  width: 100%;
  color: #123852;
  background: #ffffff;
  border: 1rpx solid rgba(19, 56, 82, 0.12);
  border-radius: 14rpx;
  font-size: 25rpx;
  box-sizing: border-box;
}

.chat-input {
  flex: 1;
  height: 66rpx;
  padding: 0 20rpx;
}

.letter-paper {
  flex: 1;
  min-height: 0;
  padding: 30rpx;
  overflow: auto;
  background: #fffaf0;
  border: 1rpx solid #ecd9bd;
  border-radius: 18rpx;
  box-sizing: border-box;
}

.letter-content {
  margin-top: 30rpx;
  color: #3b4558;
  font-size: 29rpx;
  line-height: 1.86;
  white-space: pre-wrap;
  word-break: break-word;
}

.reply-box {
  padding-top: 18rpx;
}

.reply-input {
  min-height: 132rpx;
  padding: 18rpx 20rpx;
  line-height: 1.55;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12rpx;
  margin-top: 14rpx;
}

.send-button.wide {
  min-width: 140rpx;
}

.main-state.compact {
  min-height: 90rpx;
}

@media screen and (min-width: 900px) {
  .bottle-dock {
    padding: 24px;
  }

  .dock-panel {
    grid-template-columns: 330px minmax(0, 1fr);
    border-radius: 14px;
  }

  .dock-head,
  .main-toolbar {
    padding: 18px;
  }

  .dock-title,
  .main-title {
    font-size: 19px;
  }

  .dock-subtitle,
  .main-subtitle {
    font-size: 13px;
  }

  .icon-button,
  .delete-button,
  .send-button {
    height: 34px;
    padding: 0 14px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 34px;
  }

  .bottle-list {
    padding: 0 10px 14px;
  }

  .bottle-row {
    min-height: 84px;
    gap: 10px;
    padding: 12px 10px;
    margin-bottom: 8px;
    border-radius: 10px;
  }

  .row-avatar {
    width: 38px;
    height: 38px;
    font-size: 15px;
  }

  .row-name {
    font-size: 14px;
  }

  .row-time,
  .meta-pill {
    font-size: 11px;
  }

  .row-preview {
    font-size: 13px;
  }

  .chat-pane,
  .letter-pane {
    padding: 18px;
  }

  .chat-head {
    padding: 12px;
    border-radius: 10px;
  }

  .chat-avatar {
    width: 42px;
    height: 42px;
  }

  .peer-name {
    font-size: 16px;
  }

  .peer-note {
    font-size: 12px;
  }

  .chat-stream {
    padding: 18px 4px;
  }

  .chat-bubble {
    padding: 11px 14px;
    margin-bottom: 10px;
    border-radius: 10px;
    font-size: 14px;
  }

  .chat-input {
    height: 40px;
    padding: 0 14px;
    border-radius: 8px;
    font-size: 14px;
  }

  .letter-paper {
    padding: 24px;
    border-radius: 12px;
  }

  .letter-content {
    margin-top: 22px;
    font-size: 16px;
  }

  .reply-input {
    min-height: 96px;
    padding: 12px 14px;
    border-radius: 8px;
    font-size: 14px;
  }
}

@media screen and (max-width: 620px) {
  .bottle-dock {
    align-items: stretch;
    padding: 18rpx;
  }

  .dock-panel {
    grid-template-columns: 1fr;
    grid-template-rows: 330rpx minmax(0, 1fr);
    width: 100%;
    height: 92vh;
  }

  .dock-sidebar {
    border-right: 0;
    border-bottom: 1rpx solid rgba(19, 56, 82, 0.1);
  }

  .bottle-list {
    display: flex;
    overflow: auto;
    white-space: nowrap;
  }

  .bottle-row {
    display: inline-flex;
    width: 390rpx;
    margin-right: 10rpx;
    vertical-align: top;
    white-space: normal;
  }

  .chat-bubble {
    max-width: 82%;
  }
}
</style>
