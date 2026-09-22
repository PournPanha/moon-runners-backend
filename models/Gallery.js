import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema({
    title: String,
    location: String,
    category: String,
    image: String,
    likes: {
        type: Number,
        default: 0,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['published', 'draft'],
        default: 'published',
    },
});

export default mongoose.model('Gallery', gallerySchema);