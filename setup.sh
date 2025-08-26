#!/bin/bash

echo "🚗 Welcome to MechLocator Setup! 🔧"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v14 or higher."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed or not in PATH."
    echo "Please install MongoDB v4.4 or higher."
    echo "Visit: https://docs.mongodb.com/manual/installation/"
    echo ""
    echo "After installation, make sure MongoDB is running:"
    echo "  - macOS: brew services start mongodb-community"
    echo "  - Ubuntu: sudo systemctl start mongod"
    echo "  - Windows: net start MongoDB"
    echo ""
    read -p "Press Enter to continue anyway..."
fi

echo "✅ Prerequisites check completed!"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm run install-all

# Create .env file if it doesn't exist
if [ ! -f "server/.env" ]; then
    echo ""
    echo "🔧 Creating environment configuration..."
    cp server/.env.example server/.env
    echo "✅ Environment file created at server/.env"
    echo "⚠️  Please edit server/.env with your MongoDB connection and other settings"
fi

# Check if Google Maps API key is configured
echo ""
echo "🗺️  Google Maps API Key Check..."
if grep -q "YOUR_GOOGLE_MAPS_API_KEY" public/index.html; then
    echo "⚠️  Please replace 'YOUR_GOOGLE_MAPS_API_KEY' in public/index.html with your actual API key"
    echo "   Get your API key from: https://console.cloud.google.com/"
else
    echo "✅ Google Maps API key appears to be configured"
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "Next steps:"
echo "1. Edit server/.env with your MongoDB connection"
echo "2. Add your Google Maps API key to public/index.html"
echo "3. Start MongoDB service"
echo "4. Run 'npm run dev' to start the application"
echo ""
echo "The application will be available at:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:5000"
echo ""
echo "Happy coding! 🚀"