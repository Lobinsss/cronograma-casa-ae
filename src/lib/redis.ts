import { Redis } from "@upstash/redis";

const url =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null = null;
if (url && token) {
  redis = new Redis({ url, token });
}

// Fallback en memoria para desarrollo local sin credenciales de Redis.
// OJO: esto no persiste entre despliegues serverless distintos; solo sirve
// para `npm run dev` local. En Vercel siempre debe haber Redis configurado.
const memoryStore = new Map<string, unknown>();

export async function kvGet<T>(key: string): Promise<T | null> {
  if (redis) {
    const val = await redis.get<T>(key);
    return val ?? null;
  }
  return (memoryStore.get(key) as T) ?? null;
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  if (redis) {
    await redis.set(key, value);
    return;
  }
  memoryStore.set(key, value);
}

export function isRedisConfigured(): boolean {
  return redis !== null;
}
