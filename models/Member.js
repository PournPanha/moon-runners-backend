import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    role: String,
    badge: {
        type: String,
        enum: ['Elite', 'Advanced', 'Intermediate', 'Beginner'],
    },
    miles: Number,
    runs: Number,
    achievements: Number,
    avatar: String,
    quote: String,
    phone: String,
    email: String,
    joinDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
});

export default mongoose.model('Member', memberSchema);