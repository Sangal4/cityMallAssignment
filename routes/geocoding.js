import express from 'express';
import { geocodeLocation, reverseGeocode, calculateDistance } from '../controllers/geocodingController.js';

const router = express.Router();

// POST /api/geocode - Forward geocoding (address/location name to coordinates)
router.post('/', geocodeLocation);

// POST /api/geocode/reverse - Reverse geocoding (coordinates to address)
router.post('/reverse', reverseGeocode);

// POST /api/geocode/distance - Calculate distance between two points
router.post('/distance', calculateDistance);

export default router; 