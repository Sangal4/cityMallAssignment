import { getSupabase } from '../config/supabase.js';
import logger from './logger.js';

class CacheManager {
    constructor() {
        this.defaultTTL = parseInt(process.env.CACHE_TTL_HOURS) || 1; // 1 hour default
    }

    async get(key) {
        const supabase = getSupabase();
        try {
            const { data, error } = await supabase
                .from('cache')
                .select('value, expires_at')
                .eq('key', key)
                .single();

            if (error || !data) {
                logger.cacheMiss(key);
                return null;
            }

            // Check if cache has expired
            if (new Date() > new Date(data.expires_at)) {
                await this.delete(key);
                logger.cacheMiss(key);
                return null;
            }

            logger.cacheHit(key);
            return data.value;
        } catch (error) {
            logger.error('Cache get error:', error.message);
            return null;
        }
    }

    async set(key, value, ttlHours = null) {
        const supabase = getSupabase();
        try {
            const ttl = ttlHours || this.defaultTTL;
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + ttl);

            const { error } = await supabase
                .from('cache')
                .upsert({
                    key,
                    value,
                    expires_at: expiresAt.toISOString()
                });

            if (error) {
                logger.error('Cache set error:', error.message);
                return false;
            }

            logger.debug('Cache set successfully', { key, expires_at: expiresAt });
            return true;
        } catch (error) {
            logger.error('Cache set error:', error.message);
            return false;
        }
    }

    async delete(key) {
        const supabase = getSupabase();
        try {
            const { error } = await supabase
                .from('cache')
                .delete()
                .eq('key', key);

            if (error) {
                logger.error('Cache delete error:', error.message);
                return false;
            }

            return true;
        } catch (error) {
            logger.error('Cache delete error:', error.message);
            return false;
        }
    }

    async clear() {
        const supabase = getSupabase();
        try {
            const { error } = await supabase
                .from('cache')
                .delete()
                .neq('key', ''); // Delete all records

            if (error) {
                logger.error('Cache clear error:', error.message);
                return false;
            }

            logger.info('Cache cleared successfully');
            return true;
        } catch (error) {
            logger.error('Cache clear error:', error.message);
            return false;
        }
    }

    async cleanup() {
        const supabase = getSupabase();
        try {
            const { error } = await supabase
                .from('cache')
                .delete()
                .lt('expires_at', new Date().toISOString());

            if (error) {
                logger.error('Cache cleanup error:', error.message);
                return false;
            }

            logger.info('Cache cleanup completed');
            return true;
        } catch (error) {
            logger.error('Cache cleanup error:', error.message);
            return false;
        }
    }

    // Helper method to generate cache keys
    generateKey(prefix, ...params) {
        return `${prefix}:${params.join(':')}`;
    }
}

const cacheManager = new CacheManager();
export default cacheManager; 