import express from 'express';
import Gallery from '../models/Gallery.js';
import { protect, adminOnly } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: fileFilter
});

// GET all images
router.get('/', async (req, res) => {
    try {
        const images = await Gallery.find({ status: 'published' }).sort({ date: -1 });
        res.json(images);
    } catch (error) {
        console.error('Error fetching gallery:', error);
        res.status(500).json({ message: error.message });
    }
});

// GET single image
router.get('/:id', async (req, res) => {
    try {
        const image = await Gallery.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }
        res.json(image);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// CREATE new image (admin only)
router.post('/', protect, adminOnly, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file uploaded' });
        }

        const { title, location, category } = req.body;

        const galleryItem = await Gallery.create({
            title: title || 'Untitled',
            location: location || '',
            category: category || 'running',
            image: `/uploads/${req.file.filename}`,
            status: 'published',
        });

        console.log(`📸 Image uploaded: ${galleryItem.title}`);
        res.status(201).json({
            success: true,
            message: 'Image uploaded successfully',
            data: galleryItem
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }
        res.status(400).json({ message: error.message });
    }
});

// ============ UPDATE IMAGE (Admin only) - FIXED ============
router.put('/:id', protect, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, location, category } = req.body;

        // Find existing image
        const existingImage = await Gallery.findById(id);
        if (!existingImage) {
            return res.status(404).json({ message: 'Image not found' });
        }

        // Prepare update data
        const updateData = {
            title: title || existingImage.title,
            location: location || existingImage.location,
            category: category || existingImage.category,
        };

        // Update in database
        const updatedImage = await Gallery.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        console.log(`📝 Image updated: ${updatedImage.title}`);
        res.json({
            success: true,
            message: 'Image updated successfully',
            data: updatedImage
        });
    } catch (error) {
        console.error('Error updating image:', error);
        res.status(400).json({ message: error.message });
    }
});

// ============ UPDATE IMAGE WITH NEW FILE (Admin only) ============
router.put('/:id/image', protect, adminOnly, upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, location, category } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'No image file uploaded' });
        }

        // Find existing image
        const existingImage = await Gallery.findById(id);
        if (!existingImage) {
            return res.status(404).json({ message: 'Image not found' });
        }

        // Delete old file
        if (existingImage.image) {
            const oldFilePath = path.join('.', existingImage.image);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
                console.log(`🗑️ Old file deleted: ${oldFilePath}`);
            }
        }

        // Update with new image
        const updateData = {
            title: title || existingImage.title,
            location: location || existingImage.location,
            category: category || existingImage.category,
            image: `/uploads/${req.file.filename}`,
        };

        const updatedImage = await Gallery.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        console.log(`📸 Image updated with new file: ${updatedImage.title}`);
        res.json({
            success: true,
            message: 'Image updated with new file successfully',
            data: updatedImage
        });
    } catch (error) {
        console.error('Error updating image with file:', error);
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }
        res.status(400).json({ message: error.message });
    }
});

// DELETE image (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        const image = await Gallery.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        // Delete the actual file from uploads folder
        if (image.image) {
            const filePath = path.join('.', image.image);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ File deleted: ${filePath}`);
            }
        }

        await Gallery.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;