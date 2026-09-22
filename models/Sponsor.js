import mongoose from 'mongoose';

const sponsorSchema = new mongoose.Schema({
    name: String,
    logo: String,
    website: String,
    package: {
        type: String,
        enum: ['3 months', '6 months', '12 months'],
    },
    amount: Number,
    startDate: Date,
    endDate: Date,
    status: {
        type: String,
        enum: ['active', 'expired', 'pending'],
        default: 'pending',
    },
    benefits: [String],
    contactPerson: String,
    contactEmail: String,
});

export default mongoose.model('Sponsor', sponsorSchema);