import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import {
    getAllDisasters,
    getDisasterById,
    createDisaster,
    updateDisaster,
    deleteDisaster
} from '../controllers/disasterController.js';

const router = express.Router();

// GET /api/disasters - Get all disasters with optional filtering
router.get('/', getAllDisasters);

// GET /api/disasters/:id - Get specific disaster
router.get('/:id', getDisasterById);

// POST /api/disasters - Create new disaster
router.post('/', authenticateUser, createDisaster);

// PUT /api/disasters/:id - Update disaster
router.put('/:id', authenticateUser, updateDisaster);

// DELETE /api/disasters/:id - Delete disaster
router.delete('/:id', authenticateUser, deleteDisaster);

export default router; 