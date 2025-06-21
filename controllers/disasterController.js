import { v4 as uuidv4 } from 'uuid';
import { getSupabase } from '../config/supabase.js';
import logger from '../utils/logger.js';
import geminiService from '../services/geminiService.js';
import geocodingService from '../services/geocodingService.js';

// Get all disasters with optional filtering
export const getAllDisasters = async (req, res) => {
    try {
        const { tag, owner_id, limit = 50, offset = 0 } = req.query;
        const supabase = getSupabase();

        let query = supabase
            .from('disasters')
            .select('*')
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        // Apply filters
        if (tag) {
            query = query.contains('tags', [tag]);
        }

        if (owner_id) {
            query = query.eq('owner_id', owner_id);
        }

        const { data, error } = await query;

        if (error) {
            logger.error('Error fetching disasters:', error.message);
            return res.status(500).json({ error: 'Failed to fetch disasters' });
        }

        logger.info(`Retrieved ${data.length} disasters`);
        res.json({
            disasters: data,
            count: data.length,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        logger.error('Disasters GET error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get specific disaster
export const getDisasterById = async (req, res) => {
    try {
        const { id } = req.params;
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('disasters')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Disaster not found' });
        }

        res.json({ disaster: data });
    } catch (error) {
        logger.error('Disaster GET error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create new disaster
export const createDisaster = async (req, res) => {
    try {
        const { title, location_name, description, tags = [] } = req.body;
        const owner_id = req.user.id;

        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }

        // Extract location using Gemini if not provided
        let finalLocationName = location_name;
        if (!location_name) {
            finalLocationName = await geminiService.extractLocation(description);
        }

        // Geocode the location
        const geocodeResult = await geocodingService.geocode(finalLocationName);

        const disasterId = uuidv4();
        const auditTrail = [{
            action: 'create',
            user_id: owner_id,
            timestamp: new Date().toISOString(),
            changes: { title, location_name: finalLocationName, description, tags }
        }];

        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('disasters')
            .insert({
                id: disasterId,
                title,
                location_name: finalLocationName,
                location: geocodingService.createPostGISPoint(geocodeResult.lat, geocodeResult.lng),
                description,
                tags,
                owner_id,
                audit_trail: auditTrail
            })
            .select()
            .single();

        if (error) {
            logger.error('Error creating disaster:', error.message);
            return res.status(500).json({ error: 'Failed to create disaster' });
        }

        logger.disasterCreated(disasterId, title, finalLocationName);

        // Emit WebSocket event
        req.app.get('io').emit('disaster_created', { disaster: data });

        res.status(201).json({
            disaster: data,
            geocoding: geocodeResult
        });
    } catch (error) {
        logger.error('Disaster POST error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update disaster
export const updateDisaster = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, location_name, description, tags } = req.body;
        const user_id = req.user.id;

        const supabase = getSupabase();

        // Get current disaster
        const { data: currentDisaster, error: fetchError } = await supabase
            .from('disasters')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !currentDisaster) {
            return res.status(404).json({ error: 'Disaster not found' });
        }

        // Check ownership or admin role
        if (currentDisaster.owner_id !== user_id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized to update this disaster' });
        }

        // Prepare update data
        const updateData = {};
        const changes = {};

        if (title !== undefined) {
            updateData.title = title;
            changes.title = { from: currentDisaster.title, to: title };
        }

        if (description !== undefined) {
            updateData.description = description;
            changes.description = { from: currentDisaster.description, to: description };
        }

        if (tags !== undefined) {
            updateData.tags = tags;
            changes.tags = { from: currentDisaster.tags, to: tags };
        }

        // Handle location updates
        if (location_name !== undefined && location_name !== currentDisaster.location_name) {
            const geocodeResult = await geocodingService.geocode(location_name);
            updateData.location_name = location_name;
            updateData.location = geocodingService.createPostGISPoint(geocodeResult.lat, geocodeResult.lng);
            changes.location_name = { from: currentDisaster.location_name, to: location_name };
        }

        // Add to audit trail
        const newAuditEntry = {
            action: 'update',
            user_id,
            timestamp: new Date().toISOString(),
            changes
        };

        updateData.audit_trail = [...currentDisaster.audit_trail, newAuditEntry];

        // Update disaster
        const { data, error } = await supabase
            .from('disasters')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            logger.error('Error updating disaster:', error.message);
            return res.status(500).json({ error: 'Failed to update disaster' });
        }

        logger.disasterUpdated(id, changes);

        // Emit WebSocket event
        req.app.get('io').emit('disaster_updated', { disaster: data });

        res.json({ disaster: data });
    } catch (error) {
        logger.error('Disaster PUT error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete disaster
export const deleteDisaster = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        const supabase = getSupabase();

        // Get current disaster
        const { data: currentDisaster, error: fetchError } = await supabase
            .from('disasters')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !currentDisaster) {
            return res.status(404).json({ error: 'Disaster not found' });
        }

        // Check ownership or admin role
        if (currentDisaster.owner_id !== user_id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized to delete this disaster' });
        }

        // Delete the disaster
        const { error } = await supabase
            .from('disasters')
            .delete()
            .eq('id', id);

        if (error) {
            logger.error('Error deleting disaster:', error.message);
            return res.status(500).json({ error: 'Failed to delete disaster' });
        }

        // Emit WebSocket event
        req.app.get('io').emit('disaster_deleted', { disaster_id: id });

        res.json({ message: 'Disaster deleted successfully' });
    } catch (error) {
        logger.error('Disaster DELETE error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}; 