import express from 'express';
import Contact from '../models/Contact.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// Submit contact form (public)
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and message are required'
            });
        }

        // Validate email format
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address'
            });
        }

        const contact = await Contact.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            phone: phone?.trim() || '',
            message: message.trim(),
            status: 'new'
        });

        console.log(`📩 New contact message from: ${email}`);

        res.status(201).json({
            success: true,
            message: 'Message sent successfully! We\'ll get back to you soon.',
            data: {
                id: contact._id,
                name: contact.name,
                email: contact.email,
                createdAt: contact.createdAt
            }
        });
    } catch (error) {
        console.error('❌ Error saving contact:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again.'
        });
    }
});

// ============================================
// ADMIN ROUTES (Protected)
// ============================================

// Get all contact messages (admin only)
router.get('/', protect, adminOnly, async (req, res) => {
    try {
        const { status, limit = 50, page = 1 } = req.query;

        const query = {};
        if (status && status !== 'all') query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const messages = await Contact.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Contact.countDocuments(query);

        console.log(`📋 Admin fetched ${messages.length} messages`);

        res.json({
            success: true,
            data: messages,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('❌ Error fetching contacts:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get single contact message (admin only)
router.get('/:id', protect, adminOnly, async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Mark as read if it's new
        if (contact.status === 'new') {
            contact.status = 'read';
            await contact.save();
            console.log(`📖 Message ${contact._id} marked as read`);
        }

        res.json({
            success: true,
            data: contact
        });
    } catch (error) {
        console.error('❌ Error fetching contact:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Update message status (admin only)
router.put('/:id/status', protect, adminOnly, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['new', 'read', 'replied', 'archived'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Allowed: new, read, replied, archived'
            });
        }

        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        console.log(`📝 Message ${contact._id} status updated to: ${status}`);

        res.json({
            success: true,
            message: 'Status updated successfully',
            data: contact
        });
    } catch (error) {
        console.error('❌ Error updating status:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Reply to message (admin only)
router.post('/:id/reply', protect, adminOnly, async (req, res) => {
    try {
        const { replyMessage } = req.body;

        if (!replyMessage || !replyMessage.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Reply message is required'
            });
        }

        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            {
                status: 'replied',
                replyMessage: replyMessage.trim(),
                repliedAt: new Date()
            },
            { new: true, runValidators: true }
        );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        console.log(`📧 Reply sent to: ${contact.email}`);

        res.json({
            success: true,
            message: 'Reply sent successfully',
            data: contact
        });
    } catch (error) {
        console.error('❌ Error sending reply:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Delete contact message (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        console.log(`🗑️ Message ${contact._id} deleted by admin`);

        res.json({
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting message:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get message statistics (admin only)
router.get('/stats/summary', protect, adminOnly, async (req, res) => {
    try {
        const stats = await Contact.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const total = await Contact.countDocuments();

        const statsObject = {
            total,
            new: 0,
            read: 0,
            replied: 0,
            archived: 0
        };

        stats.forEach(stat => {
            if (stat._id && statsObject.hasOwnProperty(stat._id)) {
                statsObject[stat._id] = stat.count;
            }
        });

        res.json({
            success: true,
            data: statsObject
        });
    } catch (error) {
        console.error('❌ Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;