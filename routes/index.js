import express from 'express';
import disasters from './disasters.js';
import resources from './resources.js';
import updates from './updates.js';
import verification from './verification.js';
import geocoding from './geocoding.js';
import socialMedia from './socialMedia.js';

const router = express.Router();

router.use('/disasters', disasters);
router.use('/resources', resources);
router.use('/updates', updates);
router.use('/verification', verification);
router.use('/geocode', geocoding);
router.use('/social-media', socialMedia);

export default router; 