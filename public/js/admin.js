// Global variables
let currentUser = null;
let userGrowthChart = null;
let appointmentStatusChart = null;

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Initialize the admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuthentication();
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

// Check if user is authenticated and is admin
async function checkAdminAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
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
        
        // Check if user is admin
        if (currentUser.role !== 'admin') {
            showMessage('error', 'Access denied. Admin privileges required.');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
            return;
        }

        loadDashboardData();
        updateUserInfo();
    } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
}

// Update user information in the UI
function updateUserInfo() {
    if (!currentUser) return;

    document.getElementById('userName').textContent = currentUser.firstName;
    
    if (currentUser.avatar) {
        document.getElementById('userAvatar').src = currentUser.avatar;
    }
}

// Load dashboard data
async function loadDashboardData() {
    await Promise.all([
        loadStats(),
        loadRecentActivity(),
        loadCharts()
    ]);
}

// Load dashboard statistics
async function loadStats() {
    try {
        const token = localStorage.getItem('token');
        
        // Load users count
        const usersResponse = await fetch(`${API_BASE_URL}/admin/users/count`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const usersCount = await usersResponse.json();
        
        // Load mechanics count
        const mechanicsResponse = await fetch(`${API_BASE_URL}/admin/mechanics/count`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const mechanicsCount = await mechanicsResponse.json();
        
        // Load appointments count
        const appointmentsResponse = await fetch(`${API_BASE_URL}/admin/appointments/count`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const appointmentsCount = await appointmentsResponse.json();
        
        // Load reviews count
        const reviewsResponse = await fetch(`${API_BASE_URL}/admin/reviews/count`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const reviewsCount = await reviewsResponse.json();

        // Update UI
        document.getElementById('totalUsers').textContent = usersCount.count || 0;
        document.getElementById('totalMechanics').textContent = mechanicsCount.count || 0;
        document.getElementById('activeAppointments').textContent = appointmentsCount.active || 0;
        document.getElementById('totalReviews').textContent = reviewsCount.count || 0;

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load recent activity
async function loadRecentActivity() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/admin/activity`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        const container = document.getElementById('recentActivity');
        
        if (data.activities.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No recent activity</p>';
            return;
        }

        container.innerHTML = data.activities.map(activity => `
            <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div class="flex-shrink-0">
                    <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            ${getActivityIcon(activity.type)}
                        </svg>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900">${activity.title}</p>
                    <p class="text-sm text-gray-500">${activity.description}</p>
                </div>
                <div class="flex-shrink-0">
                    <p class="text-xs text-gray-400">${formatTimeAgo(activity.timestamp)}</p>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading recent activity:', error);
        document.getElementById('recentActivity').innerHTML = '<p class="text-red-500 text-center py-8">Error loading activity</p>';
    }
}

// Get activity icon based on type
function getActivityIcon(type) {
    switch (type) {
        case 'user_registered':
            return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>';
        case 'appointment_created':
            return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>';
        case 'review_posted':
            return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>';
        default:
            return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
    }
}

// Format time ago
function formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
}

// Load charts
async function loadCharts() {
    await Promise.all([
        loadUserGrowthChart(),
        loadAppointmentStatusChart()
    ]);
}

// Load user growth chart
async function loadUserGrowthChart() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/admin/analytics/user-growth`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        const ctx = document.getElementById('userGrowthChart').getContext('2d');
        
        if (userGrowthChart) {
            userGrowthChart.destroy();
        }

        userGrowthChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'New Users',
                    data: data.values,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error loading user growth chart:', error);
    }
}

// Load appointment status chart
async function loadAppointmentStatusChart() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/admin/analytics/appointment-status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        const ctx = document.getElementById('appointmentStatusChart').getContext('2d');
        
        if (appointmentStatusChart) {
            appointmentStatusChart.destroy();
        }

        appointmentStatusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        '#3B82F6', // Blue
                        '#10B981', // Green
                        '#F59E0B', // Yellow
                        '#EF4444', // Red
                        '#8B5CF6'  // Purple
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error loading appointment status chart:', error);
    }
}

// Navigation functions
function showDashboard() {
    hideAllContent();
    document.getElementById('dashboardContent').classList.remove('hidden');
    updateActiveNav('dashboard');
}

function showUsers() {
    hideAllContent();
    document.getElementById('usersContent').classList.remove('hidden');
    loadUsersContent();
    updateActiveNav('users');
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

function showReviews() {
    hideAllContent();
    document.getElementById('reviewsContent').classList.remove('hidden');
    loadReviewsContent();
    updateActiveNav('reviews');
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
        'dashboardContent', 'usersContent', 'mechanicsContent', 'appointmentsContent',
        'reviewsContent', 'analyticsContent', 'profileContent', 'settingsContent'
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

// Content loading functions
function loadUsersContent() {
    const container = document.getElementById('usersContent');
    container.innerHTML = `
        <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">User Management</h2>
            <p class="text-gray-600">Manage user accounts and permissions.</p>
        </div>
        <div class="text-center py-12">
            <p class="text-gray-500">User management functionality will be implemented here.</p>
        </div>
    `;
}

function loadMechanicsContent() {
    const container = document.getElementById('mechanicsContent');
    container.innerHTML = `
        <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Mechanic Management</h2>
            <p class="text-gray-600">Manage mechanic shops and their information.</p>
        </div>
        <div class="text-center py-12">
            <p class="text-gray-500">Mechanic management functionality will be implemented here.</p>
        </div>
    `;
}

function loadAppointmentsContent() {
    const container = document.getElementById('appointmentsContent');
    container.innerHTML = `
        <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Appointments</h2>
            <p class="text-gray-600">View and manage all appointments.</p>
        </div>
        <div class="text-center py-12">
            <p class="text-gray-500">Appointment management functionality will be implemented here.</p>
        </div>
    `;
}

function loadReviewsContent() {
    const container = document.getElementById('reviewsContent');
    container.innerHTML = `
        <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Reviews</h2>
            <p class="text-gray-600">Manage user reviews and ratings.</p>
        </div>
        <div class="text-center py-12">
            <p class="text-gray-500">Review management functionality will be implemented here.</p>
        </div>
    `;
}

function loadAnalyticsContent() {
    const container = document.getElementById('analyticsContent');
    container.innerHTML = `
        <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Analytics</h2>
            <p class="text-gray-600">Detailed analytics and insights.</p>
        </div>
        <div class="text-center py-12">
            <p class="text-gray-500">Advanced analytics functionality will be implemented here.</p>
        </div>
    `;
}

function loadProfileContent() {
    const container = document.getElementById('profileContent');
    container.innerHTML = `
        <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Admin Profile</h2>
            <p class="text-gray-600">Manage your admin account information.</p>
        </div>
        <div class="text-center py-12">
            <p class="text-gray-500">Admin profile management will be implemented here.</p>
        </div>
    `;
}

function loadSettingsContent() {
    const container = document.getElementById('settingsContent');
    container.innerHTML = `
        <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">System Settings</h2>
            <p class="text-gray-600">Configure system-wide settings and preferences.</p>
        </div>
        <div class="text-center py-12">
            <p class="text-gray-500">System settings functionality will be implemented here.</p>
        </div>
    `;
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Show loading overlay
function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

// Hide loading overlay
function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

// Show message
function showMessage(type, message) {
    const container = document.getElementById('messageContainer');
    const content = document.getElementById('messageContent');
    const icon = document.getElementById('messageIcon');
    const text = document.getElementById('messageText');
    
    // Set message content
    text.textContent = message;
    
    // Set styling based on type
    if (type === 'success') {
        content.className = 'rounded-lg p-4 shadow-lg max-w-sm bg-green-50 border border-green-200';
        icon.innerHTML = `
            <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
        `;
    } else {
        content.className = 'rounded-lg p-4 shadow-lg max-w-sm bg-red-50 border border-red-200';
        icon.innerHTML = `
            <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
        `;
    }
    
    // Show message
    container.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideMessage();
    }, 5000);
}

// Hide message
function hideMessage() {
    document.getElementById('messageContainer').classList.add('hidden');
}