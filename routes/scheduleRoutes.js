import express from 'express';
import Schedule from '../models/Schedule.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Default schedule data
const defaultSchedule = [
    {
        day: "Monday",
        type: "Easy Run",
        icon: "FaCloudSun",
        time: "6:00 PM - 7:30 PM",
        location: "Diamond Island",
        distance: "5KM",
        pace: "Relaxed pace (7-8 min/km)",
        focus: "Recovery & Endurance",
        description: "Start the week with a comfortable run to build base endurance",
        intensity: "Low",
        calories: "300-400",
        isRestDay: false,
    },
    {
        day: "Tuesday",
        type: "Interval Training",
        icon: "FaBolt",
        time: "6:30 PM - 8:00 PM",
        location: "Olympic Stadium",
        distance: "6KM (with intervals)",
        pace: "Fast intervals (4-5 min/km)",
        focus: "Speed & Power",
        description: "High-intensity intervals to improve speed and stamina",
        intensity: "High",
        calories: "500-600",
        isRestDay: false,
    },
    {
        day: "Wednesday",
        type: "Tempo Run",
        icon: "FaHeartbeat",
        time: "6:00 PM - 7:30 PM",
        location: "Riverside",
        distance: "8KM",
        pace: "Moderate (5:30-6:30 min/km)",
        focus: "Threshold & Pace",
        description: "Sustained effort to improve lactate threshold",
        intensity: "Medium-High",
        calories: "450-550",
        isRestDay: false,
    },
    {
        day: "Thursday",
        type: "Fun Run",
        icon: "FaRunning",
        time: "6:30 PM - 8:00 PM",
        location: "Botanic Garden",
        distance: "4KM - 6KM",
        pace: "Social pace (any pace welcome)",
        focus: "Community & Enjoyment",
        description: "Social run with games and team bonding activities",
        intensity: "Low-Medium",
        calories: "250-350",
        isRestDay: false,
    },
    {
        day: "Friday",
        type: "Long Run",
        icon: "FaMoon",
        time: "7:00 PM - 9:00 PM",
        location: "Wat Phnom Area",
        distance: "10KM - 15KM",
        pace: "Steady pace (6-7 min/km)",
        focus: "Distance & Endurance",
        description: "Build endurance with longer distance night runs",
        intensity: "Medium",
        calories: "600-800",
        isRestDay: false,
    },
    {
        day: "Saturday",
        type: "Park Run + HIIT",
        icon: "FaDumbbell",
        time: "5:30 PM - 7:30 PM",
        location: "Freedom Park",
        distance: "5KM + HIIT",
        pace: "Mixed (running + strength)",
        focus: "Strength & Conditioning",
        description: "Combine running with bodyweight exercises",
        intensity: "High",
        calories: "550-700",
        isRestDay: false,
    },
    {
        day: "Sunday",
        type: "Rest Day",
        icon: "FaPray",
        time: "Holy Day - No Training",
        location: "Recovery & Reflection",
        distance: "Complete Rest",
        pace: "Stretching & Meditation",
        focus: "Recovery & Mental Health",
        description: "Rest day for recovery, stretching, and family time",
        intensity: "None",
        calories: "Active Recovery",
        isRestDay: true,
    },
];

// Initialize default schedule if empty
const initializeSchedule = async () => {
    try {
        const count = await Schedule.countDocuments();
        if (count === 0) {
            console.log('📋 Initializing default schedule...');
            await Schedule.insertMany(defaultSchedule);
            console.log('✅ Default schedule created');
        }
    } catch (error) {
        console.error('❌ Error initializing schedule:', error);
    }
};

// Call initialization
initializeSchedule();

// ============ GET SCHEDULE (Public) ============
router.get('/', async (req, res) => {
    try {
        let schedule = await Schedule.find();

        // If no schedule exists, return default
        if (!schedule || schedule.length === 0) {
            return res.json(defaultSchedule);
        }

        // Sort manually by day order
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        schedule.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

        res.json(schedule);
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json({ message: error.message });
    }
});

// ============ GET SINGLE DAY (Public) ============
router.get('/:day', async (req, res) => {
    try {
        const schedule = await Schedule.findOne({ day: req.params.day });

        if (!schedule) {
            // Return default if not found
            const defaultDay = defaultSchedule.find(d => d.day === req.params.day);
            if (defaultDay) {
                return res.json(defaultDay);
            }
            return res.status(404).json({ message: 'Schedule not found' });
        }

        res.json(schedule);
    } catch (error) {
        console.error('Error fetching schedule day:', error);
        res.status(500).json({ message: error.message });
    }
});

// ============ UPDATE OR CREATE SCHEDULE (Admin only) ============
router.put('/:day', protect, adminOnly, async (req, res) => {
    try {
        const { day } = req.params;
        const updateData = req.body;

        // Validate day
        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        if (!validDays.includes(day)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid day. Must be Monday-Sunday'
            });
        }

        // Ensure required fields for non-rest days
        if (!updateData.isRestDay) {
            const requiredFields = ['type', 'time', 'location', 'distance', 'focus', 'description'];
            for (const field of requiredFields) {
                if (!updateData[field]) {
                    return res.status(400).json({
                        success: false,
                        message: `Missing required field: ${field}`
                    });
                }
            }
        }

        const schedule = await Schedule.findOneAndUpdate(
            { day },
            {
                ...updateData,
                updatedAt: new Date()
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        console.log(`📝 Schedule updated for ${day}`);

        res.json({
            success: true,
            message: `Schedule for ${day} updated successfully`,
            data: schedule
        });
    } catch (error) {
        console.error('Error updating schedule:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// ============ RESET SCHEDULE TO DEFAULT (Admin only) ============
router.post('/reset', protect, adminOnly, async (req, res) => {
    try {
        await Schedule.deleteMany({});
        await Schedule.insertMany(defaultSchedule);

        console.log('🔄 Schedule reset to default');
        res.json({
            success: true,
            message: 'Schedule reset to default successfully'
        });
    } catch (error) {
        console.error('Error resetting schedule:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;