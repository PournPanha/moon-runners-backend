import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Import routes
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import galleryRoutes from './routes/galleryRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import sponsorRoutes from './routes/sponsorRoutes.js';
import contactRoutes from './routes/contactRoutes.js'; // ADD THIS

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware - Enhanced CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// Database connection
const connectDB = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        console.log('📁 Database:', process.env.MONGODB_URI.split('/').pop().split('?')[0] || 'default');

        const conn = await mongoose.connect(process.env.MONGODB_URI);

        console.log(`✅ MongoDB connected successfully`);
        console.log(`📁 Host: ${conn.connection.host}`);
        console.log(`📁 Database: ${conn.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.error('\n🔧 Troubleshooting:');
        console.error('1. Check your MongoDB Atlas username and password');
        console.error('2. Verify Network Access includes your IP (0.0.0.0/0 for testing)');
        console.error('3. Or switch to local MongoDB: mongodb://localhost:27017/moonrunners');
        process.exit(1);
    }
};

connectDB();

// ============ ROUTES ============
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/contact', contactRoutes); // ADD CONTACT ROUTES

// ============ HEALTH CHECK ============
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Moon-Runners API is healthy',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// ============ ROOT ROUTE ============
app.get('/', (req, res) => {
    res.json({
        message: 'Moon-Runners API is running',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            events: '/api/events',
            members: '/api/members',
            gallery: '/api/gallery',
            schedule: '/api/schedule',
            sponsors: '/api/sponsors',
            contact: '/api/contact'
        }
    });
});

// ============ 404 HANDLER ============
app.use((req, res) => {
    res.status(404).json({
        message: `Route not found: ${req.method} ${req.url}`,
        availableEndpoints: [
            'GET /',
            'GET /api/health',
            'POST /api/auth/login',
            'GET /api/auth/setup-admin',
            'GET /api/auth/check',
            'GET /api/events',
            'POST /api/events',
            'GET /api/members',
            'POST /api/members',
            'GET /api/gallery',
            'POST /api/gallery',
            'GET /api/schedule',
            'PUT /api/schedule/:day',
            'GET /api/sponsors',
            'POST /api/sponsors',
            'POST /api/contact',
            'GET /api/contact',
            'GET /api/contact/stats/summary'
        ]
    });
});

// ============ ERROR HANDLER ============
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 API URL: http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Setup admin: http://localhost:${PORT}/api/auth/setup-admin`);
    console.log(`📩 Contact API: http://localhost:${PORT}/api/contact\n`);
});