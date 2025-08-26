const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect('mongodb+srv://vijaypardhu17:OoCtgfS6PsTY94ol@mechlocator.vuygsbf.mongodb.net/?retryWrites=true&w=majority&appName=MechLocator', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Create indexes for better performance
        await createIndexes();
        
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

const createIndexes = async () => {
    try {
        // Create geospatial index for mechanics
        const Mechanic = require('../models/Mechanic');
        await Mechanic.collection.createIndex({ location: '2dsphere' });
        
        // Create indexes for users
        const User = require('../models/User');
        await User.collection.createIndex({ email: 1 }, { unique: true });
        await User.collection.createIndex({ username: 1 }, { unique: true });
        
        // Create indexes for reviews
        const Review = require('../models/Review');
        await Review.collection.createIndex({ user: 1, mechanic: 1 }, { unique: true });
        await Review.collection.createIndex({ mechanic: 1, rating: -1 });
        
        // Create indexes for appointments
        const Appointment = require('../models/Appointment');
        await Appointment.collection.createIndex({ user: 1, appointmentDate: -1 });
        await Appointment.collection.createIndex({ mechanic: 1, appointmentDate: -1 });
        await Appointment.collection.createIndex({ status: 1, appointmentDate: 1 });
        
        // Create indexes for vehicles
        const Vehicle = require('../models/Vehicle');
        await Vehicle.collection.createIndex({ user: 1, isPrimary: 1 });
        await Vehicle.collection.createIndex({ licensePlate: 1 });
        
        console.log('Database indexes created successfully');
    } catch (error) {
        console.error('Error creating indexes:', error);
    }
};

module.exports = connectDB;