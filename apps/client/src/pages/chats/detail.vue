<template>
  <view class="screen chat-screen">
    <view class="chat-head card">
      <view class="avatar">
        <image v-if="peerAvatar" class="avatar-image" :src="peerAvatar" mode="aspectFill" />
        <text v-else>{{ peerName.slice(0, 1) }}</text>
      </view>
      <view>
        <text class="message-name">{{ peerName }}</text>
        <text class="message-preview">{{ peerBio }}</text>
      </view>
      <button class="danger-button delete-button" @click="removeChat">删</button>
    </view>

    <view class="chat-stream">
      <view
        v-for="message in messages"
        :key="message.id"
        class="message-row"
        :class="message.isMine ? 'right' : 'left'"
      >
        <view v-if="!message.isMine" class="message-avatar">
          <image v-if="peerAvatar" class="avatar-image" :src="peerAvatar" mode="aspectFill" />
          <text v-else>{{ peerName.slice(0, 1) }}</text>
        </view>
        <view class="bubble" :class="message.isMine ? 'right' : 'left'">
          {{ message.content }}
        </view>
      </view>
      <view v-if="!messages.length" class="empty-text">还没有消息。</view>
    </view>

    <view class="chat-input">
      <input class="input" v-model="content" placeholder="输入回复..." />
      <button class="primary-button send-button" :disabled="isSending || !content.trim()" @click="send">发</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import type { ChatMessage, ConversationMessages } from "@heart-message/shared";
import { deleteChat, fetchChatMessages, sendChatMessage } from "../../services/chats";

const conversationId = ref("");
const conversation = ref<ConversationMessages | null>(null);
const messages = ref<ChatMessage[]>([]);
const content = ref("");
const isSending = ref(false);

const peerName = computed(() => conversation.value?.peer.nickname || "漂流瓶用户");
const peerAvatar = computed(() => conversation.value?.peer.avatarUrl || "");
const peerBio = computed(() => conversation.value?.peer.bio || "由瓶子开启");

onLoad(async (query) => {
  conversationId.value = typeof query?.id === "string" ? query.id : "";

  if (conversationId.value) {
    await loadMessages();
  }
});

async function loadMessages() {
  try {
    const result = await fetchChatMessages(conversationId.value);
    conversation.value = result;
    messages.value = result.messages;
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "消息加载失败",
      icon: "none"
    });
  }
}

async function send() {
  if (!conversationId.value || isSending.value || !content.value.trim()) {
    return;
  }

  isSending.value = true;

  try {
    await sendChatMessage(conversationId.value, content.value);
    content.value = "";
    await loadMessages();
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "发送失败",
      icon: "none"
    });
  } finally {
    isSending.value = false;
  }
}

async function removeChat() {
  if (!conversationId.value) {
    return;
  }

  try {
    await deleteChat(conversationId.value);
    uni.showToast({
      title: "已删除",
      icon: "success"
    });
    uni.switchTab({
      url: "/pages/chats/index"
    });
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "删除失败",
      icon: "none"
    });
  }
}
</script>

<style scoped lang="scss">
.chat-screen {
  padding-bottom: 132rpx;
}

.chat-head {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.chat-head > view:nth-child(2) {
  flex: 1;
  min-width: 0;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  overflow: hidden;
  color: #ffffff;
  background: #0f8f8c;
  border-radius: 999rpx;
  font-weight: 900;
}

.avatar-image {
  width: 100%;
  height: 100%;
  display: block;
}

.message-name,
.message-preview {
  display: block;
}

.message-name {
  font-size: 28rpx;
  font-weight: 800;
}

.message-preview {
  margin-top: 6rpx;
  color: #65758b;
  font-size: 22rpx;
  line-height: 1.35;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.chat-stream {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 28rpx;
}

.empty-text {
  color: #65758b;
  font-size: 26rpx;
  text-align: center;
}

.message-row {
  display: flex;
  align-items: flex-end;
  gap: 12rpx;
}

.message-row.right {
  justify-content: flex-end;
}

.message-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 56rpx;
  height: 56rpx;
  overflow: hidden;
  color: #ffffff;
  background: #0f8f8c;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 900;
}

.bubble {
  max-width: 520rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  line-height: 1.6;
}

.bubble.left {
  color: #283747;
  background: #ffffff;
  border: 1rpx solid #d9e4e7;
}

.bubble.right {
  align-self: flex-end;
  color: #ffffff;
  background: #0f8f8c;
}

.chat-input {
  position: fixed;
  right: 24rpx;
  bottom: 24rpx;
  left: 24rpx;
  display: flex;
  gap: 16rpx;
}

.chat-input .input {
  flex: 1;
}

.send-button {
  width: 96rpx;
  height: 84rpx;
}

.delete-button {
  width: 72rpx;
  height: 64rpx;
  font-size: 24rpx;
}
</style>
