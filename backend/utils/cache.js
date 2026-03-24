import NodeCache from "node-cache";
import logger from "./logger.js";

// El valor por defecto de TTL es 3600 (1 hora)
const localCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

logger.info("[cache] Caché en memoria local (In-Memory) inicializada.");

export const cache = {
  async get(key) {
    try {
      const value = localCache.get(key);
      return value !== undefined ? value : null;
    } catch (err) {
      return null;
    }
  },

  async set(key, value, ttlSeconds = 3600) {
    try {
      localCache.set(key, value, ttlSeconds);
    } catch (err) {
      logger.error("[cache] Error setting key:", err);
    }
  },

  async del(key) {
    try {
      localCache.del(key);
    } catch (err) {
      logger.error("[cache] Error deleting key:", err);
    }
  },

  async delPrefix(prefix) {
    try {
      const keys = localCache.keys();
      const matchingKeys = keys.filter(k => k.startsWith(prefix));
      if (matchingKeys.length > 0) {
        localCache.del(matchingKeys);
      }
    } catch (err) {
      logger.error("[cache] Error deleting prefix:", err);
    }
  }
};

export default localCache;
