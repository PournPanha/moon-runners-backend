import express from 'express';
import Member from '../models/Member.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Get all members
router.get('/', async (req, res) => {
    try {
        const members = await Member.find({ status: 'active' }).sort({ miles: -1 });
        res.json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create member (admin only)
router.post('/', protect, adminOnly, async (req, res) => {
    try {
        const member = await Member.create(req.body);
        res.status(201).json(member);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update member (admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
    try {
        const member = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(member);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete member (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        await Member.findByIdAndDelete(req.params.id);
        res.json({ message: 'Member deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;