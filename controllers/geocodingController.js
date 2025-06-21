import geminiService from '../services/geminiService.js';
import geocodingService from '../services/geocodingService.js';
import logger from '../utils/logger.js';

export const geocodeLocation = async (req, res) => {
    try {
        const { description, location_name } = req.body;
        let locName = location_name;

        // Extract location from description if no explicit location provided
        if (!locName && description) {
            locName = await geminiService.extractLocation(description);
        }

        // Validate input
        if (!locName) {
            return res.status(400).json({ 
                error: 'No location or description provided',
                message: 'Please provide either a location_name or a description containing location information'
            });
        }

        // Perform geocoding
        const geo = await geocodingService.geocode(locName);
        
        // Return detailed response
        res.json({
            location_name: locName,
            geocoding: geo,
            success: !!(geo.lat && geo.lng),
            provider: geo.provider || 'none'
        });
    } catch (error) {
        logger.error('Geocoding endpoint error:', error.message);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'An error occurred while processing your request'
        });
    }
};

export const reverseGeocode = async (req, res) => {
    try {
        const { lat, lng } = req.body;

        // Validate input
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({
                error: 'Invalid coordinates',
                message: 'Please provide valid latitude and longitude values'
            });
        }

        // Validate coordinate ranges
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({
                error: 'Invalid coordinate range',
                message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
            });
        }

        // Perform reverse geocoding
        const result = await geocodingService.reverseGeocode(lat, lng);

        // Return detailed response
        res.json({
            coordinates: { lat, lng },
            geocoding: result,
            success: !!result.formatted_address,
            provider: result.provider || 'none'
        });
    } catch (error) {
        logger.error('Reverse geocoding endpoint error:', error.message);
        res.status(500).json({
            error: 'Internal server error',
            message: 'An error occurred while processing your request'
        });
    }
};

export const calculateDistance = async (req, res) => {
    try {
        const { point1, point2 } = req.body;

        // Validate input
        if (!point1 || !point2 || !point1.lat || !point1.lng || !point2.lat || !point2.lng) {
            return res.status(400).json({
                error: 'Invalid points',
                message: 'Please provide two points with valid latitude and longitude values'
            });
        }

        // Calculate distance
        const distance = geocodingService.calculateDistance(
            point1.lat,
            point1.lng,
            point2.lat,
            point2.lng
        );

        res.json({
            point1,
            point2,
            distance: {
                kilometers: distance,
                miles: distance * 0.621371
            }
        });
    } catch (error) {
        logger.error('Distance calculation endpoint error:', error.message);
        res.status(500).json({
            error: 'Internal server error',
            message: 'An error occurred while processing your request'
        });
    }
}; 