import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// CREATE ADMIN USER - FIXED
router.get('/setup-admin', async (req, res) => {
    try {
        console.log('🔧 Setup admin route called');

        // Check if admin already exists
        const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });

        if (adminExists) {
            console.log('✅ Admin already exists:', adminExists.email);
            return res.json({
                success: true,
                message: 'Admin already exists',
                admin: {
                    id: adminExists._id,
                    email: adminExists.email,
                    role: adminExists.role
                }
            });
        }

        // Create new admin - Make sure password is set correctly
        const adminData = {
            name: 'Administrator',
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD, // This will trigger pre-save hook
            role: 'admin',
        };

        console.log('Creating admin with email:', adminData.email);
        console.log('Password will be hashed by pre-save hook');

        const admin = await User.create(adminData);

        console.log('🎉 Admin created successfully:', admin.email);
        console.log('Password is hashed:', admin.password !== process.env.ADMIN_PASSWORD);

        res.json({
            success: true,
            message: 'Admin created successfully',
            admin: {
                id: admin._id,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// LOGIN ROUTE
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('🔐 Login attempt for:', email);

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        console.log('User found, comparing passwords...');

        // Use the comparePassword method
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role,
                name: user.name
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        console.log('✅ Login successful for:', email);
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET CURRENT USER
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('❌ Get user error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// CHECK IF USERS EXIST
router.get('/check', async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        res.json({
            success: true,
            hasUsers: userCount > 0,
            userCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;