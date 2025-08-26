const mongoose = require('mongoose');
const Mechanic = require('./models/Mechanic');
require('dotenv').config();

const sampleMechanics = [
  {
    name: "AutoCare Pro",
    address: "123 Main Street, Downtown",
    phone: "+1-555-0101",
    email: "info@autocarepro.com",
    location: {
      type: "Point",
      coordinates: [-73.935242, 40.730610] // New York coordinates
    },
    rating: 4.5,
    totalRatings: 127,
    services: ["Oil Change", "Brake Repair", "Engine Diagnostics", "Tire Service"],
    hours: {
      monday: { open: "8:00 AM", close: "6:00 PM" },
      tuesday: { open: "8:00 AM", close: "6:00 PM" },
      wednesday: { open: "8:00 AM", close: "6:00 PM" },
      thursday: { open: "8:00 AM", close: "6:00 PM" },
      friday: { open: "8:00 AM", close: "6:00 PM" },
      saturday: { open: "9:00 AM", close: "4:00 PM" },
      sunday: { open: "Closed", close: "Closed" }
    },
    isOpen: true,
    description: "Professional auto repair services with certified mechanics"
  },
  {
    name: "Quick Fix Garage",
    address: "456 Oak Avenue, Midtown",
    phone: "+1-555-0102",
    email: "service@quickfixgarage.com",
    location: {
      type: "Point",
      coordinates: [-73.985242, 40.750610]
    },
    rating: 4.2,
    totalRatings: 89,
    services: ["Quick Repairs", "Emergency Service", "Battery Replacement", "AC Repair"],
    hours: {
      monday: { open: "7:00 AM", close: "7:00 PM" },
      tuesday: { open: "7:00 AM", close: "7:00 PM" },
      wednesday: { open: "7:00 AM", close: "7:00 PM" },
      thursday: { open: "7:00 AM", close: "7:00 PM" },
      friday: { open: "7:00 AM", close: "7:00 PM" },
      saturday: { open: "8:00 AM", close: "5:00 PM" },
      sunday: { open: "9:00 AM", close: "3:00 PM" }
    },
    isOpen: true,
    description: "Fast and reliable automotive repairs"
  },
  {
    name: "Elite Motors",
    address: "789 Park Boulevard, Uptown",
    phone: "+1-555-0103",
    email: "contact@elitemotors.com",
    location: {
      type: "Point",
      coordinates: [-73.975242, 40.780610]
    },
    rating: 4.8,
    totalRatings: 203,
    services: ["Luxury Car Service", "Performance Tuning", "Body Work", "Paint Jobs"],
    hours: {
      monday: { open: "9:00 AM", close: "5:00 PM" },
      tuesday: { open: "9:00 AM", close: "5:00 PM" },
      wednesday: { open: "9:00 AM", close: "5:00 PM" },
      thursday: { open: "9:00 AM", close: "5:00 PM" },
      friday: { open: "9:00 AM", close: "5:00 PM" },
      saturday: { open: "10:00 AM", close: "3:00 PM" },
      sunday: { open: "Closed", close: "Closed" }
    },
    isOpen: true,
    description: "Premium automotive service for luxury and performance vehicles"
  },
  {
    name: "Neighborhood Auto",
    address: "321 Elm Street, Suburbia",
    phone: "+1-555-0104",
    email: "hello@neighborhoodauto.com",
    location: {
      type: "Point",
      coordinates: [-73.945242, 40.700610]
    },
    rating: 4.0,
    totalRatings: 156,
    services: ["General Repairs", "Maintenance", "Inspections", "Towing"],
    hours: {
      monday: { open: "8:30 AM", close: "5:30 PM" },
      tuesday: { open: "8:30 AM", close: "5:30 PM" },
      wednesday: { open: "8:30 AM", close: "5:30 PM" },
      thursday: { open: "8:30 AM", close: "5:30 PM" },
      friday: { open: "8:30 AM", close: "5:30 PM" },
      saturday: { open: "9:00 AM", close: "2:00 PM" },
      sunday: { open: "Closed", close: "Closed" }
    },
    isOpen: true,
    description: "Trusted neighborhood auto repair shop"
  },
  {
    name: "24/7 Emergency Auto",
    address: "654 Emergency Lane, Industrial District",
    phone: "+1-555-0105",
    email: "emergency@247auto.com",
    location: {
      type: "Point",
      coordinates: [-73.955242, 40.720610]
    },
    rating: 3.8,
    totalRatings: 67,
    services: ["Emergency Repairs", "Roadside Assistance", "Towing", "Jump Starts"],
    hours: {
      monday: { open: "24 Hours", close: "24 Hours" },
      tuesday: { open: "24 Hours", close: "24 Hours" },
      wednesday: { open: "24 Hours", close: "24 Hours" },
      thursday: { open: "24 Hours", close: "24 Hours" },
      friday: { open: "24 Hours", close: "24 Hours" },
      saturday: { open: "24 Hours", close: "24 Hours" },
      sunday: { open: "24 Hours", close: "24 Hours" }
    },
    isOpen: true,
    description: "Round-the-clock emergency automotive services"
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mechlocator', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await Mechanic.deleteMany({});
    console.log('Cleared existing mechanic data');

    // Insert sample data
    const createdMechanics = await Mechanic.insertMany(sampleMechanics);
    console.log(`Successfully seeded ${createdMechanics.length} mechanics`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;