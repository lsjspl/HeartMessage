import type { BottleAuthor, ChatListItem, ChatMessage, ConversationMessages, SendMessageInput } from "@heart-message/shared";
import { AppError } from "../errors";
import type { Env } from "../env";
import { generateAiReplyForConversation } from "./ai-companion";
import { moderateUserContent } from "./content-safety";

interface ConversationRow {
  id: string;
  bottle_id: string;
  participant_a_id: string | null;
  participant_b_id: string | null;
  status: "active" | "deleted" | "blocked";
  deleted_by_participant_a_at: number | null;
  deleted_by_participant_b_at: number | null;
  updated_at: number;
  peer_id: string | null;
  peer_nickname: string | null;
  peer_avatar_url: string | null;
  peer_age: number | null;
  peer_gender: "male" | "female" | "unknown" | null;
  ai_persona_id: string | null;
  ai_display_name: string | null;
  ai_bio: string | null;
  ai_age: number | null;
  ai_gender: "male" | "female" | "unknown" | null;
}

interface ChatListRow extends ConversationRow {
  preview: string | null;
  unread_count: number;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  sender_type: "user" | "ai" | "system";
  content: string;
  created_at: number;
}

function currentUserDeleteColumn(row: ConversationRow, userId: string) {
  return row.participant_a_id === userId ? "deleted_by_participant_a_at" : "deleted_by_participant_b_at";
}

function peerAuthor(row: ConversationRow): BottleAuthor {
  if (row.ai_persona_id) {
    return {
      id: row.ai_persona_id,
      nickname: row.ai_display_name || "潮汐来信",
      bio: row.ai_bio || undefined,
      age: row.ai_age || undefined,
      gender: row.ai_gender || "unknown"
    };
  }

  return {
    id: row.peer_id || undefined,
    nickname: row.peer_nickname || "漂流瓶用户",
    avatarUrl: row.peer_avatar_url || undefined,
    age: row.peer_age || undefined,
    gender: row.peer_gender || "unknown"
  };
}

async function getVisibleConversation(env: Env, userId: string, conversationId: string) {
  const row = await env.DB.prepare(
    `SELECT
       conversations.*,
       CASE
         WHEN conversations.participant_a_id = ? THEN conversations.participant_b_id
         ELSE conversations.participant_a_id
       END AS peer_id,
       user_profiles.nickname AS peer_nickname,
       user_profiles.avatar_url AS peer_avatar_url,
       user_profiles.age AS peer_age,
       user_profiles.gender AS peer_gender,
       ai_personas.id AS ai_persona_id,
       ai_personas.display_name AS ai_display_name,
       ai_personas.bio AS ai_bio,
       ai_personas.age AS ai_age,
       ai_personas.gender AS ai_gender
     FROM conversations
     JOIN bottles ON bottles.id = conversations.bottle_id
     LEFT JOIN user_profiles ON user_profiles.user_id = CASE
       WHEN conversations.participant_a_id = ? THEN conversations.participant_b_id
       ELSE conversations.participant_a_id
     END
     LEFT JOIN ai_personas ON ai_personas.id = bottles.ai_persona_id
     WHERE conversations.id = ?
       AND conversations.status = 'active'
       AND (conversations.participant_a_id = ? OR conversations.participant_b_id = ?)`
  )
    .bind(userId, userId, conversationId, userId, userId)
    .first<ConversationRow>();

  if (!row) {
    throw new AppError(404, "CONVERSATION_NOT_FOUND", "没有找到这个会话");
  }

  const deletedAt = row[currentUserDeleteColumn(row, userId) as keyof ConversationRow];

  if (deletedAt) {
    throw new AppError(404, "CONVERSATION_NOT_FOUND", "没有找到这个会话");
  }

  return row;
}

export async function listChats(env: Env, userId: string): Promise<ChatListItem[]> {
  const result = await env.DB.prepare(
    `SELECT
       conversations.*,
       CASE
         WHEN conversations.participant_a_id = ? THEN conversations.participant_b_id
         ELSE conversations.participant_a_id
       END AS peer_id,
       user_profiles.nickname AS peer_nickname,
       user_profiles.avatar_url AS peer_avatar_url,
       user_profiles.age AS peer_age,
       user_profiles.gender AS peer_gender,
       ai_personas.id AS ai_persona_id,
       ai_personas.display_name AS ai_display_name,
       ai_personas.bio AS ai_bio,
       ai_personas.age AS ai_age,
       ai_personas.gender AS ai_gender,
       (
         SELECT messages.content
         FROM messages
         WHERE messages.conversation_id = conversations.id AND messages.status = 'sent'
         ORDER BY messages.created_at DESC
         LIMIT 1
       ) AS preview,
       (
         SELECT COUNT(*)
         FROM messages
         WHERE messages.conversation_id = conversations.id
           AND messages.status = 'sent'
           AND (messages.sender_id IS NULL OR messages.sender_id <> ?)
           AND messages.read_at IS NULL
       ) AS unread_count
     FROM conversations
     JOIN bottles ON bottles.id = conversations.bottle_id
     LEFT JOIN user_profiles ON user_profiles.user_id = CASE
       WHEN conversations.participant_a_id = ? THEN conversations.participant_b_id
       ELSE conversations.participant_a_id
     END
     LEFT JOIN ai_personas ON ai_personas.id = bottles.ai_persona_id
     WHERE conversations.status = 'active'
       AND (
         (conversations.participant_a_id = ? AND conversations.deleted_by_participant_a_at IS NULL)
         OR
         (conversations.participant_b_id = ? AND conversations.deleted_by_participant_b_at IS NULL)
       )
     ORDER BY conversations.updated_at DESC
     LIMIT 100`
  )
    .bind(userId, userId, userId, userId, userId)
    .all<ChatListRow>();

  return result.results.map((row) => ({
    id: row.id,
    bottleId: row.bottle_id,
    peer: peerAuthor(row),
    preview: row.preview || "由瓶子开启的聊天",
    unreadCount: Number(row.unread_count || 0),
    updatedAt: new Date(row.updated_at).toISOString()
  }));
}

export async function getConversationMessages(
  env: Env,
  userId: string,
  conversationId: string
): Promise<ConversationMessages> {
  const conversation = await getVisibleConversation(env, userId, conversationId);

  await env.DB.prepare(
    `UPDATE messages
     SET read_at = ?
     WHERE conversation_id = ?
       AND read_at IS NULL
       AND (sender_id IS NULL OR sender_id <> ?)`
  )
    .bind(Date.now(), conversationId, userId)
    .run();

  const result = await env.DB.prepare(
    `SELECT id, conversation_id, sender_id, sender_type, content, created_at
     FROM messages
     WHERE conversation_id = ? AND status = 'sent'
     ORDER BY created_at ASC
     LIMIT 200`
  )
    .bind(conversationId)
    .all<MessageRow>();

  return {
    conversationId,
    peer: peerAuthor(conversation),
    messages: result.results.map((row): ChatMessage => ({
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id || undefined,
      senderType: row.sender_type,
      content: row.content,
      isMine: row.sender_id === userId,
      createdAt: new Date(row.created_at).toISOString()
    }))
  };
}

export async function sendChatMessage(env: Env, userId: string, input: SendMessageInput) {
  const conversation = await getVisibleConversation(env, userId, input.conversationId);

  if (conversation.deleted_by_participant_a_at || conversation.deleted_by_participant_b_at) {
    throw new AppError(409, "CONVERSATION_CLOSED", "对方已经删除了这个瓶子关系，不能继续发送消息");
  }

  await moderateUserContent(env, input.content, {
    userId,
    source: "chat_message",
    targetId: input.conversationId
  });

  const now = Date.now();
  const messageId = crypto.randomUUID();

  await env.DB.prepare(
    `INSERT INTO messages
       (id, conversation_id, sender_id, sender_type, content, status, created_at)
     VALUES (?, ?, ?, 'user', ?, 'sent', ?)`
  )
    .bind(messageId, input.conversationId, userId, input.content, now)
    .run();

  await env.DB.prepare("UPDATE conversations SET updated_at = ? WHERE id = ?")
    .bind(now, input.conversationId)
    .run();

  await generateAiReplyForConversation(env, userId, input.conversationId);

  return {
    id: messageId,
    conversationId: input.conversationId,
    senderId: userId,
    senderType: "user" as const,
    content: input.content,
    isMine: true,
    createdAt: new Date(now).toISOString()
  };
}

export async function deleteConversation(env: Env, userId: string, conversationId: string) {
  const conversation = await getVisibleConversation(env, userId, conversationId);
  const now = Date.now();

  if (conversation.participant_a_id === userId) {
    await env.DB.prepare(
      `UPDATE conversations
       SET deleted_by_participant_a_at = ?, updated_at = ?
       WHERE id = ?`
    )
      .bind(now, now, conversationId)
      .run();
  } else {
    await env.DB.prepare(
      `UPDATE conversations
       SET deleted_by_participant_b_at = ?, updated_at = ?
       WHERE id = ?`
    )
      .bind(now, now, conversationId)
      .run();

    await env.DB.prepare(
      `UPDATE bottle_pickups
       SET status = 'deleted', deleted_at = ?
       WHERE id = (SELECT pickup_id FROM conversations WHERE id = ?)`
    )
      .bind(now, conversationId)
      .run();
  }

  return {
    conversationId,
    deleted: true
  };
}
