import express from 'express';
import { verifyInformation } from '../controllers/verificationController.js';

const router = express.Router();

// POST /api/verify - Verify information using AI
router.post('/', verifyInformation);

export default router; 