# 🚗 MechLocator - Advanced Automotive Service Platform

[![Django](https://img.shields.io/badge/Django-4.2.7-green.svg)](https://www.djangoproject.com/)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)](https://github.com/Vijayapardhu/MechLocator)

A comprehensive, full-stack Django web application for connecting users with nearby mechanic shops. MechLocator provides real-time location services, advanced search capabilities, and a complete user management system with OTP authentication.

## 🌟 Features

### 🔍 Core Features
- **Real-time Location Services**: Find mechanics based on GPS location with distance calculations
- **Advanced Search & Filtering**: Filter by rating, distance, services, and availability
- **Interactive Google Maps**: Custom markers, directions, and location picker
- **User Authentication**: Secure JWT-based authentication with OTP verification
- **Profile Management**: Comprehensive user profiles with activity tracking
- **Admin Dashboard**: Enhanced Django admin with analytics and bulk operations
- **Image Gallery**: Support for multiple mechanic and shop photos
- **Customer Feedback**: Review system with images and ratings
- **Supabase Integration**: Optional cloud storage for images via Supabase

### 🛡️ Security Features
- **OTP Authentication**: Email-based two-factor authentication
- **Session Management**: Secure login tracking and account lockout
- **CSRF Protection**: Built-in Django security features
- **Input Validation**: Comprehensive form validation and sanitization
- **Activity Logging**: Track user actions and admin operations

### 📱 User Experience
- **Responsive Design**: Mobile-first design with Bootstrap 5
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Accessibility**: WCAG 2.1 AA compliant design
- **Progressive Web App**: Works offline and provides app-like experience

### 🛠️ Admin Features
- **Enhanced Admin Interface**: Custom admin templates and views
- **Analytics Dashboard**: User activity and mechanic performance metrics
- **Bulk Operations**: Mass update ratings and mechanic information
- **Map View**: Visual representation of all mechanics on a map
- **Activity Logging**: Comprehensive audit trail of all operations

## 🏗️ Architecture

```
MechLocator/
├── mechlocator/          # Main Django project
├── mechanics/            # Core mechanic shop functionality
├── otp_auth/            # OTP authentication system
├── templates/           # HTML templates
├── static/              # CSS, JS, and static assets
├── media/               # User uploaded files
└── docs/               # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Vijayapardhu/MechLocator.git
   cd MechLocator
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Run database migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Populate sample data (optional)**
   ```bash
   python manage.py populate_sample_data
   ```

8. **Run the development server**
   ```bash
   python manage.py runserver
   ```

9. **Access the application**
   - Main site: http://127.0.0.1:8000/
   - Admin panel: http://127.0.0.1:8000/admin/

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Django Settings
SECRET_KEY=your-super-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=sqlite:///db.sqlite3

# Google Maps API
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Email Configuration (for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=MechLocator <noreply@yourdomain.com>

# OTP Settings
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6
```

### Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create an API key and add it to your `.env` file
5. For production, restrict the API key to your domain

### Supabase Setup (Optional - for Cloud Storage)

MechLocator supports Supabase for cloud-based image storage. This is optional - the app works with local storage by default.

1. **Create a Supabase Account**
   - Go to [Supabase](https://supabase.com/)
   - Sign up for a free account
   - Create a new project

2. **Set up Storage Bucket**
   - Navigate to Storage in your Supabase dashboard
   - Create a new bucket named `mechlocator-images` (or your preferred name)
   - Set the bucket to public if you want direct access to images

3. **Get API Credentials**
   - Go to Project Settings > API
   - Copy your Project URL and anon/public key
   - Add these to your `.env` file:
   ```env
   SUPABASE_URL=your-project-url
   SUPABASE_KEY=your-anon-key
   SUPABASE_BUCKET=mechlocator-images
   ```

4. **Configure Bucket Policies** (Optional)
   - Set up Row Level Security policies if needed
   - Allow public read access for image display
   - Restrict write access as needed

**Note**: Without Supabase configuration, images will be stored locally in the `media/` directory.

## 📖 Usage Guide

### For Users

1. **Registration & Login**
   - Create an account with email verification
   - Use OTP authentication for enhanced security
   - Manage your profile and preferences

2. **Finding Mechanics**
   - Allow location access or manually set location
   - Use filters to narrow down results
   - View mechanic details and ratings
   - Get directions and contact information

3. **Contacting Mechanics**
   - One-click calling feature
   - WhatsApp integration
   - Share mechanic locations

### For Administrators

1. **Managing Mechanics**
   - Add, edit, and delete mechanic shops
   - Upload multiple images for each shop (mechanic photos, shop photos, work samples)
   - Set featured/primary images
   - Manage ratings and reviews
   - Bulk operations for efficiency

2. **Managing Customer Feedback**
   - Review and approve customer feedback
   - View feedback with customer-uploaded images
   - Moderate reviews before public display
   - Track customer satisfaction ratings

3. **Analytics & Reports**
   - View user activity statistics
   - Monitor mechanic performance
   - Track search queries and popular locations
   - Export data for analysis

4. **System Management**
   - User management and permissions
   - Activity logging and audit trails
   - System configuration and settings
   - Image gallery management

## 🗄️ Database Models

### Core Models
- **User**: Extended Django user model with additional fields
- **Mechanic**: Mechanic shop information with location and services
- **MechanicImage**: Multiple images per mechanic (shop photos, mechanic photos, work samples)
- **CustomerFeedback**: Customer reviews and ratings with approval workflow
- **FeedbackImage**: Images attached to customer feedback
- **ActivityLog**: User and admin activity tracking
- **OTP**: One-time password management
- **LoginAttempt**: Login security tracking

### Relationships
- Users can have multiple activity logs
- Mechanics can have multiple images (gallery)
- Mechanics can have multiple customer feedbacks
- Customer feedbacks can have multiple images
- Feedbacks are linked to users (optional) for authenticated reviews
- OTP codes are linked to user sessions
- Login attempts track security events

## 🔧 API Endpoints

### Authentication
- `POST /accounts/login/` - User login
- `POST /accounts/logout/` - User logout
- `POST /otp/login/` - OTP-based login
- `POST /otp/verify/` - OTP verification

### Mechanics
- `GET /` - Home page with mechanic search
- `GET /mechanics/` - List all mechanics
- `GET /mechanic/<id>/` - Mechanic details
- `POST /api/search/` - Search mechanics API
- `POST /api/log-call/` - Log mechanic calls

### User Management
- `GET /accounts/profile/` - User profile
- `POST /register/` - User registration
- `GET /accounts/password_change/` - Password change

## 🎨 Frontend Features

### Technologies Used
- **Bootstrap 5**: Responsive CSS framework
- **Font Awesome**: Icon library
- **Google Maps JavaScript API**: Interactive maps
- **Vanilla JavaScript**: Custom functionality
- **CSS3**: Modern styling and animations

### Key Components
- **Hero Section**: Engaging landing page
- **Search Interface**: Advanced filtering and sorting
- **Mechanic Cards**: Information display with actions
- **Map Integration**: Interactive location services
- **User Dashboard**: Profile and activity management

## 🚀 Deployment

### Production Deployment

For production deployment, follow the comprehensive guide in [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md).

### Quick Production Setup

1. **Set up production environment**
   ```bash
   DEBUG=False
   ALLOWED_HOSTS=yourdomain.com
   ```

2. **Configure database (PostgreSQL recommended)**
   ```bash
   pip install psycopg2-binary
   ```

3. **Collect static files**
   ```bash
   python manage.py collectstatic
   ```

4. **Set up web server (Nginx + Gunicorn)**
   ```bash
   pip install gunicorn
   ```

5. **Configure SSL certificate**
   - Use Let's Encrypt for free SSL
   - Configure HTTPS redirects

## 🧪 Testing

### Running Tests
```bash
python manage.py test
```

### Test Coverage
```bash
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

## 📊 Performance Optimization

### Database Optimization
- Indexed queries for location-based searches
- Efficient distance calculations using Haversine formula
- Connection pooling for production databases

### Caching Strategy
- Static file caching with long expiration
- Database query caching for frequently accessed data
- CDN integration for global performance

### Frontend Optimization
- Minified CSS and JavaScript
- Image optimization and lazy loading
- Progressive Web App features

## 🔒 Security Considerations

### Authentication Security
- OTP expiration and rate limiting
- Account lockout after failed attempts
- Secure session management

### Data Protection
- Input validation and sanitization
- CSRF protection on all forms
- SQL injection prevention

### API Security
- Rate limiting on API endpoints
- API key restrictions for Google Maps
- Secure headers and HTTPS enforcement

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 Python style guide
- Write comprehensive docstrings
- Include tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [Django Documentation](https://docs.djangoproject.com/)
- [Google Maps API Documentation](https://developers.google.com/maps/documentation)
- [Bootstrap Documentation](https://getbootstrap.com/docs/)

### Issues and Questions
- Create an issue on GitHub for bugs or feature requests
- Check existing issues for solutions
- Review the deployment guide for common problems

### Community
- Join our discussions on GitHub
- Share your experiences and improvements
- Contribute to the project development

## 🙏 Acknowledgments

- **Django Framework**: Web framework for rapid development
- **Google Maps API**: Location services and mapping
- **Bootstrap**: Frontend framework for responsive design
- **Font Awesome**: Icon library for enhanced UI
- **Open Source Community**: For inspiration and tools

## 📈 Roadmap

### Upcoming Features
- [ ] Real-time chat between users and mechanics
- [ ] Appointment booking system
- [ ] Payment integration (Stripe/PayPal)
- [ ] Push notifications
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] AI-powered mechanic recommendations

### Version History
- **v1.0.0**: Initial release with core functionality
- **v1.1.0**: Added OTP authentication
- **v1.2.0**: Enhanced admin interface
- **v1.3.0**: Production-ready deployment

---

**MechLocator** - Connecting you with trusted automotive services, anywhere, anytime. 🚗✨

**Made with ❤️ by [Vijayapardhu](https://github.com/Vijayapardhu)**
