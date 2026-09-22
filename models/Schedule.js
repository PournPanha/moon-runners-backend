import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true,
        unique: true,
    },
    type: {
        type: String,
        required: true,
    },
    icon: {
        type: String,
        default: 'FaRunning',
    },
    time: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    distance: {
        type: String,
        required: true,
    },
    pace: {
        type: String,
        default: '',
    },
    focus: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    intensity: {
        type: String,
        enum: ['Low', 'Low-Medium', 'Medium', 'Medium-High', 'High', 'None'],
        default: 'Medium',
    },
    calories: {
        type: String,
        default: '',
    },
    isRestDay: {
        type: Boolean,
        default: false,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Pre-save middleware to update timestamp
scheduleSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('Schedule', scheduleSchema);