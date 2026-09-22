import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function fixPassword() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const users = db.collection('users');

        // Find the admin user
        const admin = await users.findOne({ email: 'admin@moonrunners.com' });

        if (admin) {
            console.log('Found admin user');
            console.log('Current password value:', admin.password);

            // Hash the password
            const hashedPassword = await bcrypt.hash('Admin123456', 10);
            console.log('New hashed password:', hashedPassword);

            // Update the user
            const result = await users.updateOne(
                { email: 'admin@moonrunners.com' },
                { $set: { password: hashedPassword } }
            );

            console.log('Update result:', result.modifiedCount > 0 ? 'Success' : 'Failed');
        } else {
            console.log('Admin user not found, creating new one...');

            const hashedPassword = await bcrypt.hash('Admin123456', 10);
            await users.insertOne({
                name: 'Administrator',
                email: 'admin@moonrunners.com',
                password: hashedPassword,
                role: 'admin',
                createdAt: new Date()
            });
            console.log('Admin created with hashed password');
        }

        // Verify the fix
        const updatedAdmin = await users.findOne({ email: 'admin@moonrunners.com' });
        console.log('Updated password hash:', updatedAdmin.password);

        // Test the password
        const isMatch = await bcrypt.compare('Admin123456', updatedAdmin.password);
        console.log('Password verification test:', isMatch ? 'SUCCESS ✅' : 'FAILED ❌');

        await mongoose.disconnect();
        console.log('Done!');
    } catch (error) {
        console.error('Error:', error);
    }
}

fixPassword();