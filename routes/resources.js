import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import {
    getResources,
    createResource,
    updateResource,
    deleteResource
} from '../controllers/resourceController.js';

const router = express.Router();

// GET /api/resources?lat=...&lon=...&radius=... - Geospatial query for resources
router.get('/', getResources);

// POST /api/resources - Create a resource
router.post('/', authenticateUser, createResource);

// PUT /api/resources/:id - Update a resource
router.put('/:id', authenticateUser, updateResource);

// DELETE /api/resources/:id - Delete a resource
router.delete('/:id', authenticateUser, deleteResource);

export default router; 