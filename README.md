# MechLocator

A modern web application for discovering nearby mechanic shops with real-time location services, built with HTML, Tailwind CSS, Node.js, Express, and MongoDB.

## Features

### 🗺️ **Location-Based Discovery**
- Automatic geolocation detection
- Interactive Google Maps integration
- Real-time nearby mechanic search within customizable radius (5-20 km)

### 📱 **User-Friendly Interface**
- Modern, responsive design with Tailwind CSS
- Futuristic UI with smooth animations
- Mobile-optimized layout
- One-click call integration via tel: URI scheme

### 🔍 **Advanced Filtering**
- Distance-based filtering (5, 10, 15, 20 km)
- Rating-based sorting (3+, 4+, 4.5+ stars)
- Status filtering (Open/Closed/All)

### ⚙️ **Admin Panel**
- Complete CRUD operations for mechanic records
- Add, edit, and delete mechanic shops
- Bulk data management
- Real-time data updates

### 🗄️ **Backend Features**
- RESTful API with Express.js
- MongoDB with geospatial indexing
- Rate limiting and security middleware
- Comprehensive error handling

## Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **Tailwind CSS** - Utility-first CSS framework
- **Vanilla JavaScript** - Modern ES6+ features
- **Google Maps API** - Interactive mapping

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **Google Maps API Key** (for mapping functionality)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mechlocator
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cd server
   cp .env.example .env
   ```
   
   Edit the `.env` file with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/mechlocator
   PORT=5000
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

4. **Get Google Maps API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Maps JavaScript API
   - Create credentials (API Key)
   - Replace `YOUR_GOOGLE_MAPS_API_KEY` in `public/index.html`

5. **Start MongoDB**
   ```bash
   # On macOS with Homebrew
   brew services start mongodb-community
   
   # On Ubuntu/Debian
   sudo systemctl start mongod
   
   # On Windows
   net start MongoDB
   ```

6. **Seed the database (optional)**
   ```bash
   cd server
   node seed.js
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend server on `http://localhost:3000`

### Production Mode
```bash
# Start backend only
cd server
npm start
```

## API Endpoints

### Mechanics
- `GET /api/mechanics/nearby` - Get nearby mechanics
- `GET /api/mechanics` - Get all mechanics with pagination
- `GET /api/mechanics/:id` - Get mechanic by ID
- `PATCH /api/mechanics/:id/rating` - Update mechanic rating

### Admin
- `GET /api/admin/mechanics` - Get all mechanics (admin view)
- `POST /api/admin/mechanics` - Create new mechanic
- `PUT /api/admin/mechanics/:id` - Update mechanic
- `DELETE /api/admin/mechanics/:id` - Delete mechanic
- `POST /api/admin/mechanics/bulk` - Bulk create mechanics

## Database Schema

### Mechanic Model
```javascript
{
  name: String (required),
  address: String (required),
  phone: String (required),
  email: String,
  location: {
    type: "Point",
    coordinates: [longitude, latitude]
  },
  rating: Number (0-5),
  totalRatings: Number,
  services: [String],
  hours: Object,
  isOpen: Boolean,
  description: String,
  images: [String],
  createdAt: Date,
  updatedAt: Date
}
```

## Project Structure

```
mechlocator/
├── public/                 # Frontend files
│   ├── index.html         # Main HTML file
│   └── js/
│       └── app.js         # Main JavaScript file
├── server/                # Backend files
│   ├── models/
│   │   └── Mechanic.js    # MongoDB model
│   ├── routes/
│   │   ├── mechanics.js   # Public API routes
│   │   └── admin.js       # Admin API routes
│   ├── index.js           # Server entry point
│   ├── seed.js            # Database seeder
│   └── package.json       # Backend dependencies
├── package.json           # Root package.json
└── README.md             # This file
```

## Usage

### For Users
1. Open the application in your browser
2. Click "Use My Location" to get your current position
3. Adjust filters (distance, rating, status) as needed
4. Browse nearby mechanics on the map
5. Click on markers or "View Details" for more information
6. Use "Call Now" to contact mechanics directly

### For Administrators
1. Navigate to the Admin panel
2. Add new mechanics using the form
3. View all mechanics in the list
4. Edit or delete existing records
5. Manage mechanic data as needed

## Features in Detail

### Geolocation
- Uses HTML5 Geolocation API
- High-accuracy positioning
- Fallback error handling
- User consent management

### Google Maps Integration
- Interactive map with custom markers
- User location indicator
- Mechanic shop markers with click events
- Responsive map container

### Real-time Search
- Geospatial queries using MongoDB
- Distance-based filtering
- Rating-based sorting
- Dynamic results updates

### Responsive Design
- Mobile-first approach
- Tailwind CSS utilities
- Smooth animations and transitions
- Cross-browser compatibility

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Roadmap

- [ ] User authentication and profiles
- [ ] Advanced search filters
- [ ] Mechanic reviews and ratings
- [ ] Appointment booking system
- [ ] Push notifications
- [ ] Offline support
- [ ] Multi-language support
- [ ] Advanced analytics dashboard

---

**MechLocator** - Making it easier to find trusted mechanics in your area! 🚗🔧