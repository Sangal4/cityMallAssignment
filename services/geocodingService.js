import axios from 'axios';
import logger from '../utils/logger.js';
import cache from '../utils/cache.js';

class GeocodingService {
    constructor() {
        this.openStreetMapURL = 'https://nominatim.openstreetmap.org/search';
        this.openStreetMapReverseURL = 'https://nominatim.openstreetmap.org/reverse';
        this.googleMapsURL = 'https://maps.googleapis.com/maps/api/geocode/json';
        this.googleMapsKey = process.env.GOOGLE_MAPS_API_KEY;
        this.lastRequestTime = 0;
        this.minRequestInterval = 1000; // 1 second between requests for rate limiting
    }

    async geocode(locationName) {
        if (!locationName || locationName === 'Unknown location') {
            return { lat: null, lng: null, formatted_address: 'Unknown location' };
        }

        const cacheKey = cache.generateKey('geocoding', locationName);
        const cached = await cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            // First try OpenStreetMap
            let result = await this.openStreetMapGeocode(locationName);
            
            // If OpenStreetMap fails and we have Google Maps API key, try that as fallback
            if (!result && this.googleMapsKey) {
                result = await this.googleMapsGeocode(locationName);
            }

            if (result) {
                await cache.set(cacheKey, result);
                return result;
            }

            // Final fallback
            return { lat: null, lng: null, formatted_address: locationName };
        } catch (error) {
            logger.error('Geocoding error:', error.message);
            return { lat: null, lng: null, formatted_address: locationName };
        }
    }

    async reverseGeocode(lat, lng) {
        if (!lat || !lng) {
            return { formatted_address: 'Unknown location' };
        }

        const cacheKey = cache.generateKey('reverse_geocoding', `${lat},${lng}`);
        const cached = await cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            // First try OpenStreetMap
            let result = await this.openStreetMapReverseGeocode(lat, lng);
            
            // If OpenStreetMap fails and we have Google Maps API key, try that as fallback
            if (!result && this.googleMapsKey) {
                result = await this.googleMapsReverseGeocode(lat, lng);
            }

            if (result) {
                await cache.set(cacheKey, result);
                return result;
            }

            return { formatted_address: `${lat}, ${lng}` };
        } catch (error) {
            logger.error('Reverse geocoding error:', error.message);
            return { formatted_address: `${lat}, ${lng}` };
        }
    }

    async enforceRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
            await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
        }
        this.lastRequestTime = Date.now();
    }

    async openStreetMapGeocode(locationName) {
        await this.enforceRateLimit();
        try {
            const response = await axios.get(this.openStreetMapURL, {
                params: {
                    q: locationName,
                    format: 'json',
                    limit: 1
                },
                headers: {
                    'User-Agent': 'DisasterResponsePlatform/1.0'
                }
            });

            if (response.data && response.data.length > 0) {
                const result = response.data[0];
                logger.apiCall('OpenStreetMap', 'geocoding', 'success');
                return {
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon),
                    formatted_address: result.display_name,
                    provider: 'openstreetmap',
                    bounds: result.boundingbox ? {
                        south: parseFloat(result.boundingbox[0]),
                        north: parseFloat(result.boundingbox[1]),
                        west: parseFloat(result.boundingbox[2]),
                        east: parseFloat(result.boundingbox[3])
                    } : null
                };
            }
            logger.apiCall('OpenStreetMap', 'geocoding', 'no_results');
            return null;
        } catch (error) {
            logger.error('OpenStreetMap geocoding error:', error.message);
            logger.apiCall('OpenStreetMap', 'geocoding', 'error');
            return null;
        }
    }

    async openStreetMapReverseGeocode(lat, lng) {
        await this.enforceRateLimit();
        try {
            const response = await axios.get(this.openStreetMapReverseURL, {
                params: {
                    lat,
                    lon: lng,
                    format: 'json'
                },
                headers: {
                    'User-Agent': 'DisasterResponsePlatform/1.0'
                }
            });

            if (response.data && response.data.display_name) {
                logger.apiCall('OpenStreetMap', 'reverse_geocoding', 'success');
                return {
                    formatted_address: response.data.display_name,
                    provider: 'openstreetmap'
                };
            }
            logger.apiCall('OpenStreetMap', 'reverse_geocoding', 'no_results');
            return null;
        } catch (error) {
            logger.error('OpenStreetMap reverse geocoding error:', error.message);
            logger.apiCall('OpenStreetMap', 'reverse_geocoding', 'error');
            return null;
        }
    }

    async googleMapsGeocode(locationName) {
        if (!this.googleMapsKey) return null;
        await this.enforceRateLimit();
        
        try {
            const response = await axios.get(this.googleMapsURL, {
                params: {
                    address: locationName,
                    key: this.googleMapsKey
                }
            });

            if (response.data.results && response.data.results.length > 0) {
                const result = response.data.results[0];
                logger.apiCall('Google Maps', 'geocoding', 'success');
                return {
                    lat: result.geometry.location.lat,
                    lng: result.geometry.location.lng,
                    formatted_address: result.formatted_address,
                    provider: 'google',
                    bounds: result.geometry.viewport ? {
                        south: result.geometry.viewport.southwest.lat,
                        north: result.geometry.viewport.northeast.lat,
                        west: result.geometry.viewport.southwest.lng,
                        east: result.geometry.viewport.northeast.lng
                    } : null
                };
            }
            logger.apiCall('Google Maps', 'geocoding', 'no_results');
            return null;
        } catch (error) {
            logger.error('Google Maps geocoding error:', error.message);
            logger.apiCall('Google Maps', 'geocoding', 'error');
            return null;
        }
    }

    async googleMapsReverseGeocode(lat, lng) {
        if (!this.googleMapsKey) return null;
        await this.enforceRateLimit();

        try {
            const response = await axios.get(this.googleMapsURL, {
                params: {
                    latlng: `${lat},${lng}`,
                    key: this.googleMapsKey
                }
            });

            if (response.data.results && response.data.results.length > 0) {
                const result = response.data.results[0];
                logger.apiCall('Google Maps', 'reverse_geocoding', 'success');
                return {
                    formatted_address: result.formatted_address,
                    provider: 'google'
                };
            }
            logger.apiCall('Google Maps', 'reverse_geocoding', 'no_results');
            return null;
        } catch (error) {
            logger.error('Google Maps reverse geocoding error:', error.message);
            logger.apiCall('Google Maps', 'reverse_geocoding', 'error');
            return null;
        }
    }

    // Helper method to calculate distance between two points
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.deg2rad(lat2 - lat1);
        const dLng = this.deg2rad(lng2 - lng1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in kilometers
        return distance;
    }

    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    // Helper method to create PostGIS point
    createPostGISPoint(lat, lng) {
        if (lat && lng) {
            return `POINT(${lng} ${lat})`;
        }
        return null;
    }
}

const geocodingService = new GeocodingService();
export default geocodingService; 