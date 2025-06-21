import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger.js';

let supabase = null;

const initializeSupabase = () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        logger.error('Missing Supabase configuration. Please check your environment variables.');
        throw new Error('Supabase configuration required');
    }

    supabase = createClient(supabaseUrl, supabaseKey);
    logger.info('Supabase client initialized successfully');

    return supabase;
};

const getSupabase = () => {
    if (!supabase) {
        throw new Error('Supabase not initialized. Call initializeSupabase() first.');
    }
    return supabase;
};

const setupDatabase = async () => {
    const client = getSupabase();

    try {
        // Create tables if they don't exist
        const { error: disastersError } = await client.rpc('create_disasters_table_if_not_exists');
        if (disastersError) {
            logger.warn('Disasters table setup:', disastersError.message);
        }

        const { error: reportsError } = await client.rpc('create_reports_table_if_not_exists');
        if (reportsError) {
            logger.warn('Reports table setup:', reportsError.message);
        }

        const { error: resourcesError } = await client.rpc('create_resources_table_if_not_exists');
        if (resourcesError) {
            logger.warn('Resources table setup:', resourcesError.message);
        }

        const { error: cacheError } = await client.rpc('create_cache_table_if_not_exists');
        if (cacheError) {
            logger.warn('Cache table setup:', cacheError.message);
        }

        logger.info('Database setup completed');
    } catch (error) {
        logger.error('Database setup error:', error.message);
    }
};

export {
    initializeSupabase,
    getSupabase,    
    setupDatabase
}; 