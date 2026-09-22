import express from 'express';
import Sponsor from '../models/Sponsor.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Get all sponsors
router.get('/', async (req, res) => {
    try {
        const sponsors = await Sponsor.find({ status: 'active' });
        res.json(sponsors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create sponsor (admin only)
router.post('/', protect, adminOnly, async (req, res) => {
    try {
        const sponsor = await Sponsor.create(req.body);
        res.status(201).json(sponsor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update sponsor (admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
    try {
        const sponsor = await Sponsor.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(sponsor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;