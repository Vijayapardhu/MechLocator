// Global variables
let currentUser = null;
let serviceChart = null;

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // User menu toggle
    document.getElementById('userMenuBtn').addEventListener('click', function() {
        const dropdown = document.getElementById('userDropdown');
        dropdown.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#userMenuBtn')) {
            document.getElementById('userDropdown').classList.add('hidden');
        }
    });
}

// Check if user is authenticated
async function checkAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Authentication failed');
        }

        currentUser = await response.json();
        loadDashboardData();
        updateUserInfo();
    } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }
}

// Update user information in the UI
function updateUserInfo() {
    if (!currentUser) return;

    document.getElementById('userName').textContent = currentUser.firstName;
    document.getElementById('userFirstName').textContent = currentUser.firstName;
    
    if (currentUser.avatar) {
        document.getElementById('userAvatar').src = currentUser.avatar;
    }
}

// Load dashboard data
async function loadDashboardData() {
    await Promise.all([
        loadStats(),
        loadRecentAppointments(),
        loadServiceChart()
    ]);
}

// Load dashboard statistics
async function loadStats() {
    try {
        const token = localStorage.getItem('token');
        
        // Load appointments stats
        const appointmentsResponse = await fetch(`${API_BASE_URL}/appointments/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const appointmentsStats = await appointmentsResponse.json();
        
        // Load vehicles count
        const vehiclesResponse = await fetch(`${API_BASE_URL}/vehicles`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const vehicles = await vehiclesResponse.json();
        
        // Load reviews count
        const reviewsResponse = await fetch(`${API_BASE_URL}/reviews/user/reviews`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const reviewsData = await reviewsResponse.json();
        
        // Load favorites count
        const favoritesResponse = await fetch(`${API_BASE_URL}/auth/favorites`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const favorites = await favoritesResponse.json();

        // Update UI
        document.getElementById('upcomingAppointments').textContent = appointmentsStats.upcomingAppointments || 0;
        document.getElementById('totalVehicles').textContent = vehicles.length || 0;
        document.getElementById('totalReviews').textContent = reviewsData.totalReviews || 0;
        document.getElementById('favoriteMechanics').textContent = favorites.length || 0;

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load recent appointments
async function loadRecentAppointments() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/appointments/user?limit=5`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        const container = document.getElementById('recentAppointments');
        
        if (data.appointments.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No recent appointments</p>';
            return;
        }

        container.innerHTML = data.appointments.map(appointment => `
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-900">${appointment.serviceType}</h4>
                    <p class="text-sm text-gray-600">${appointment.mechanic.name}</p>
                    <p class="text-xs text-gray-500">${new Date(appointment.appointmentDate).toLocaleDateString()} at ${appointment.timeSlot}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="px-2 py-1 text-xs rounded-full ${getStatusColor(appointment.status)}">${appointment.status}</span>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading recent appointments:', error);
        document.getElementById('recentAppointments').innerHTML = '<p class="text-red-500 text-center py-8">Error loading appointments</p>';
    }
}

// Get status color for appointments
function getStatusColor(status) {
    switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'confirmed': return 'bg-blue-100 text-blue-800';
        case 'in-progress': return 'bg-orange-100 text-orange-800';
        case 'completed': return 'bg-green-100 text-green-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// Load service history chart
async function loadServiceChart() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/vehicles`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const vehicles = await response.json();
        
        // Collect all service history
        const allServices = [];
        vehicles.forEach(vehicle => {
            vehicle.serviceHistory.forEach(service => {
                allServices.push({
                    date: new Date(service.date),
                    serviceType: service.serviceType,
                    cost: service.cost || 0
                });
            });
        });

        // Group by month
        const monthlyData = {};
        allServices.forEach(service => {
            const month = service.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            if (!monthlyData[month]) {
                monthlyData[month] = { count: 0, cost: 0 };
            }
            monthlyData[month].count++;
            monthlyData[month].cost += service.cost;
        });

        // Create chart
        const ctx = document.getElementById('serviceChart').getContext('2d');
        const labels = Object.keys(monthlyData);
        const counts = Object.values(monthlyData).map(d => d.count);
        const costs = Object.values(monthlyData).map(d => d.cost);

        if (serviceChart) {
            serviceChart.destroy();
        }

        serviceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Services',
                    data: counts,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Cost ($)',
                    data: costs,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Number of Services'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Cost ($)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error loading service chart:', error);
    }
}

// Navigation functions
function showDashboard() {
    hideAllContent();
    document.getElementById('dashboardContent').classList.remove('hidden');
    updateActiveNav('dashboard');
}

function showMechanics() {
    hideAllContent();
    document.getElementById('mechanicsContent').classList.remove('hidden');
    loadMechanicsContent();
    updateActiveNav('mechanics');
}

function showAppointments() {
    hideAllContent();
    document.getElementById('appointmentsContent').classList.remove('hidden');
    loadAppointmentsContent();
    updateActiveNav('appointments');
}

function showVehicles() {
    hideAllContent();
    document.getElementById('vehiclesContent').classList.remove('hidden');
    loadVehiclesContent();
    updateActiveNav('vehicles');
}

function showReviews() {
    hideAllContent();
    document.getElementById('reviewsContent').classList.remove('hidden');
    loadReviewsContent();
    updateActiveNav('reviews');
}

function showFavorites() {
    hideAllContent();
    document.getElementById('favoritesContent').classList.remove('hidden');
    loadFavoritesContent();
    updateActiveNav('favorites');
}

function showAnalytics() {
    hideAllContent();
    document.getElementById('analyticsContent').classList.remove('hidden');
    loadAnalyticsContent();
    updateActiveNav('analytics');
}

function showProfile() {
    hideAllContent();
    document.getElementById('profileContent').classList.remove('hidden');
    loadProfileContent();
    updateActiveNav('profile');
}

function showSettings() {
    hideAllContent();
    document.getElementById('settingsContent').classList.remove('hidden');
    loadSettingsContent();
    updateActiveNav('settings');
}

// Hide all content sections
function hideAllContent() {
    const contentSections = [
        'dashboardContent', 'mechanicsContent', 'appointmentsContent',
        'vehiclesContent', 'reviewsContent', 'favoritesContent',
        'analyticsContent', 'profileContent', 'settingsContent'
    ];
    
    contentSections.forEach(section => {
        document.getElementById(section).classList.add('hidden');
    });
}

// Update active navigation
function updateActiveNav(activeSection) {
    // Remove active class from all nav items
    document.querySelectorAll('aside nav a').forEach(link => {
        link.classList.remove('bg-primary-100', 'text-primary-700', 'border-r-4', 'border-primary-500', 'rounded-r-lg');
        link.classList.add('text-gray-600', 'hover:bg-gray-100', 'hover:text-gray-700', 'rounded-lg');
    });

    // Add active class to current section
    const activeLink = document.querySelector(`aside nav a[onclick*="${activeSection}"]`);
    if (activeLink) {
        activeLink.classList.remove('text-gray-600', 'hover:bg-gray-100', 'hover:text-gray-700', 'rounded-lg');
        activeLink.classList.add('bg-primary-100', 'text-primary-700', 'border-r-4', 'border-primary-500', 'rounded-r-lg');
    }
}

// Content loading functions (to be implemented)
function loadMechanicsContent() {
    const container = document.getElementById('mechanicsContent');
    container.innerHTML = `
        <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Find Mechanics</h2>
            <p class="text-gray-600">Search for nearby mechanic shops and book appointments.</p>
        </div>
        <div class="text-center py-12">
            <p class="text-gray-500">Mechanics search functionality will be implemented here.</p>
        </div>
    `;
}

function loadAppointmentsContent() {
    const container = document.getElementById('appointmentsContent');
    container.innerHTML = `
        <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">My Appointments</h2>
            <p class="text-gray-600">Manage your upcoming and past appointments.</p>
        </div>
        <div class="text-center py-12">
            <p class="text-gray-500">Appointments management will be implemented here.</p>
        </div>
    `;
}

function loadVehiclesContent() {
    const container = document.getElementById('vehiclesContent');
    container.innerHTML = `
        <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">My Vehicles</h2>
            <p class="text-gray-600">Manage your vehicles and service history.</p>
        </div>
        <div class="text-center py-12">
            <p class="text-gray-500">Vehicle management will be implemented here.</p>
        </div>
    `;
}

function loadReviewsContent() {
    const container = document.getElementById('reviewsContent');
    container.innerHTML = `
        <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">My Reviews</h2>
            <p class="text-gray-600">View and manage your mechanic reviews.</p>
        </div>
        <div class="text-center py-12">
            <p class="text-gray-500">Reviews management will be implemented here.</p>
        </div>
    `;
}

function loadFavoritesContent() {
    const container = document.getElementById('favoritesContent');
    container.innerHTML = `
        <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Favorite Mechanics</h2>
            <p class="text-gray-600">Quick access to your favorite mechanic shops.</p>
        </div>
        <div class="text-center py-12">
            <p class="text-gray-500">Favorites will be implemented here.</p>
        </div>
    `;
}

function loadAnalyticsContent() {
    const container = document.getElementById('analyticsContent');
    container.innerHTML = `
        <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Analytics</h2>
            <p class="text-gray-600">Detailed insights about your vehicle maintenance.</p>
        </div>
        <div class="text-center py-12">
            <p class="text-gray-500">Advanced analytics will be implemented here.</p>
        </div>
    `;
}

function loadProfileContent() {
    const container = document.getElementById('profileContent');
    container.innerHTML = `
        <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Profile</h2>
            <p class="text-gray-600">Manage your account information and preferences.</p>
        </div>
        <div class="text-center py-12">
            <p class="text-gray-500">Profile management will be implemented here.</p>
        </div>
    `;
}

function loadSettingsContent() {
    const container = document.getElementById('settingsContent');
    container.innerHTML = `
        <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Settings</h2>
            <p class="text-gray-600">Configure your account settings and preferences.</p>
        </div>
        <div class="text-center py-12">
            <p class="text-gray-500">Settings will be implemented here.</p>
        </div>
    `;
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

// Show loading overlay
function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

// Hide loading overlay
function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}