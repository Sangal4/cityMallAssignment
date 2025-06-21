import { v4 as uuidv4 } from 'uuid';
import { getSupabase } from '../config/supabase.js';
import logger from '../utils/logger.js';

// Get updates for a disaster
export const getUpdates = async (req, res) => {
    try {
        const { disaster_id } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('updates')
            .select('*')
            .eq('disaster_id', disaster_id)
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
        if (error) return res.status(500).json({ error: 'Failed to fetch updates' });
        res.json({
            updates: data,
            count: data.length,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        logger.error('Updates GET error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create an update
export const createUpdate = async (req, res) => {
    try {
        const { disaster_id } = req.params;
        const { content, type = 'general' } = req.body;
        const user_id = req.user.id;
        if (!content) return res.status(400).json({ error: 'Content is required' });
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('updates')
            .insert({
                id: uuidv4(),
                disaster_id,
                content,
                type,
                user_id
            })
            .select()
            .single();
        if (error) return res.status(500).json({ error: 'Failed to create update' });
        logger.updateCreated(disaster_id, type);
        req.app.get('io').emit('update_created', { update: data });
        res.status(201).json({ update: data });
    } catch (error) {
        logger.error('Update POST error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete an update
export const deleteUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        const supabase = getSupabase();
        const { data: current, error: fetchError } = await supabase
            .from('updates')
            .select('*')
            .eq('id', id)
            .single();
        if (fetchError || !current) return res.status(404).json({ error: 'Update not found' });
        if (current.user_id !== user_id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized to delete this update' });
        }
        const { error } = await supabase.from('updates').delete().eq('id', id);
        if (error) return res.status(500).json({ error: 'Failed to delete update' });
        req.app.get('io').emit('update_deleted', { update_id: id });
        res.json({ message: 'Update deleted successfully' });
    } catch (error) {
        logger.error('Update DELETE error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}; 