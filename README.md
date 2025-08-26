# MechLocator 🚗🔧

A comprehensive mechanic finder application that helps users locate nearby automotive repair shops with real-time geolocation, ratings, and contact information.

## 🌟 Features

### Core Functionality
- **Geolocation-based Search**: Find mechanic shops near your current location
- **Advanced Filtering**: Filter by distance (1km, 5km, 10km, 15km) and ratings
- **One-Click Calling**: Direct phone calls to mechanic shops
- **Real-time Ratings**: View verified customer ratings and reviews
- **Working Hours**: Check shop availability and operating hours
- **Search History**: Track your previous searches (for registered users)

### User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Modern UI**: Beautiful, intuitive interface with smooth animations
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support
- **Cross-browser Support**: Chrome, Firefox, Safari, and Edge

### Admin Features
- **Shop Management**: Add, edit, and delete mechanic shop records
- **Image Upload**: Upload and manage shop photos
- **Analytics Dashboard**: View system statistics and user activity
- **Log Management**: Monitor user actions and system logs

## 🏗️ Architecture

### Backend (Node.js/Express)
- **Framework**: Express.js with middleware for security and validation
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Security**: Helmet, CORS, rate limiting, and input validation
- **File Upload**: Multer for image uploads
- **Logging**: Comprehensive activity logging system

### Frontend (React)
- **Framework**: React 18 with functional components and hooks
- **State Management**: React Context API for global state
- **Styling**: Tailwind CSS with custom components
- **Animations**: Framer Motion for smooth transitions
- **HTTP Client**: Axios with interceptors for authentication
- **Routing**: React Router v6 with protected routes

### Database Design
- **Mechanics Collection**: Shop information with geospatial indexing
- **Users Collection**: User profiles with search history
- **Logs Collection**: Activity tracking and analytics

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mechlocator
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp server/.env.example server/.env
   
   # Edit server/.env with your configuration
   # Set your MongoDB URI, JWT secret, and other variables
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB (if using local instance)
   mongod
   
   # Or use MongoDB Atlas (update connection string in .env)
   ```

5. **Start Development Servers**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually
   npm run server  # Backend on http://localhost:5000
   npm run client  # Frontend on http://localhost:3000
   ```

### Production Deployment

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   ```bash
   NODE_ENV=production
   MONGODB_URI_PROD=your-mongodb-atlas-uri
   JWT_SECRET=your-secure-jwt-secret
   ```

3. **Deploy to your preferred platform**
   - Heroku
   - Vercel
   - AWS
   - DigitalOcean

## 📱 API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1-555-123-4567",
  "password": "SecurePassword123"
}
```

#### POST /api/auth/login
Authenticate user and get JWT token.
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

### Mechanics Endpoints

#### GET /api/mechanics/nearby
Find nearby mechanic shops.
```
Query Parameters:
- longitude: number (required)
- latitude: number (required)
- distance: number (optional, default: 15)
- minRating: number (optional)
- sortBy: "distance" | "rating" (optional)
```

#### GET /api/mechanics/search
Search mechanics by text query.
```
Query Parameters:
- q: string (required)
- longitude: number (optional)
- latitude: number (optional)
- distance: number (optional)
```

### Admin Endpoints

#### POST /api/admin/mechanics
Create a new mechanic shop (admin only).
```json
{
  "name": "ABC Mechanics",
  "address": "123 Main St",
  "contact": "+1-234-567-890",
  "longitude": -73.935242,
  "latitude": 40.730610,
  "rating": 4.5,
  "working_hours": "9 AM - 9 PM",
  "services": ["Oil Change", "Brake Repair"]
}
```

## 🔧 Configuration

### Environment Variables

#### Server (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/mechlocator
MONGODB_URI_PROD=mongodb+srv://username:password@cluster.mongodb.net/mechlocator

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://mechlocator.com
```

### Database Indexes

The application automatically creates the following indexes:

```javascript
// Mechanics collection
mechanicSchema.index({ location: '2dsphere' }); // Geospatial index
mechanicSchema.index({ name: 'text', address: 'text' }); // Text search

// Users collection
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });

// Logs collection
logSchema.index({ user_id: 1, timestamp: -1 });
logSchema.index({ action: 1, timestamp: -1 });
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run backend tests only
cd server && npm test

# Run frontend tests only
cd client && npm test

# Run linting
npm run lint
```

## 📊 Performance & Scalability

### Performance Optimizations
- **Geospatial Indexing**: Fast location-based queries
- **Query Optimization**: Efficient MongoDB aggregation pipelines
- **Caching**: React Query for client-side caching
- **Compression**: Gzip compression for API responses
- **Image Optimization**: Automatic image resizing and compression

### Scalability Features
- **Horizontal Scaling**: Stateless API design
- **Database Sharding**: MongoDB Atlas support
- **CDN Ready**: Static asset optimization
- **Load Balancing**: Rate limiting and request distribution

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: Protection against abuse
- **CORS Configuration**: Controlled cross-origin requests
- **Helmet Security**: HTTP security headers
- **SQL Injection Protection**: Mongoose ORM protection
- **XSS Protection**: Content Security Policy

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📱 Mobile Support

- Responsive design for all screen sizes
- Touch-friendly interface
- Geolocation API support
- Progressive Web App ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Email: support@mechlocator.com
- Documentation: [docs.mechlocator.com](https://docs.mechlocator.com)

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Real-time chat with mechanics
- [ ] Appointment booking system
- [ ] Payment integration
- [ ] Mechanic verification system
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Dark mode theme

---

**Built with ❤️ for the automotive community**