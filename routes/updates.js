import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import {
    getUpdates,
    createUpdate,
    deleteUpdate
} from '../controllers/updateController.js';

const router = express.Router();

// GET /api/disasters/:disaster_id/updates
router.get('/:disaster_id/updates', getUpdates);

// POST /api/disasters/:disaster_id/updates
router.post('/:disaster_id/updates', authenticateUser, createUpdate);

// DELETE /api/updates/:id
router.delete('/:id', authenticateUser, deleteUpdate);

export default router; 