import express from 'express';
import { getMockSocialMediaReports } from '../controllers/socialMediaController.js';

const router = express.Router();

// GET /api/social-media?disaster_id=...&keywords=...
router.get('/', getMockSocialMediaReports);

export default router; 