export interface Env {
  DB: D1Database;
  CONFIG_KV: KVNamespace;
  MEDIA_BUCKET: R2Bucket;
  AI_QUEUE: Queue;
  LOG_QUEUE: Queue;
  ENVIRONMENT: string;
  CORS_ORIGINS?: string;
  AUTH_TOKEN_SECRET?: string;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
  WECHAT_APP_ID?: string;
  WECHAT_APP_SECRET?: string;
}
