export interface Env {
  DB: D1Database;
  CONFIG_KV: KVNamespace;
  MEDIA_BUCKET: R2Bucket;
  AI_QUEUE: Queue;
  LOG_QUEUE: Queue;
}
