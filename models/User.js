import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'editor', 'viewer'],
        default: 'viewer',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// IMPORTANT: Use function() not arrow function - and ensure it runs
userSchema.pre('save', function (next) {
    const user = this;

    console.log('🔐 pre-save hook triggered');
    console.log('Password modified:', user.isModified('password'));

    if (!user.isModified('password')) {
        console.log('Password not modified, skipping hash');
        return next();
    }

    console.log('Hashing password...');
    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            console.error('Salt generation error:', err);
            return next(err);
        }

        bcrypt.hash(user.password, salt, (err, hash) => {
            if (err) {
                console.error('Hash generation error:', err);
                return next(err);
            }
            user.password = hash;
            console.log('Password hashed successfully');
            next();
        });
    });
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    console.log('Comparing passwords...');
    console.log('Stored hash:', this.password);
    const result = await bcrypt.compare(candidatePassword, this.password);
    console.log('Comparison result:', result);
    return result;
};

export default mongoose.model('User', userSchema);