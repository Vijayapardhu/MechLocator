// Global variables
let map;
let markers = [];
let currentLocation = null;
let mechanics = [];

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    loadAdminMechanics();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Filter change events
    document.getElementById('distanceFilter').addEventListener('change', applyFilters);
    document.getElementById('ratingFilter').addEventListener('change', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    
    // Admin form submission
    document.getElementById('addMechanicForm').addEventListener('submit', handleAddMechanic);
}

// Initialize Google Maps
function initializeMap() {
    // Default center (New York City)
    const defaultCenter = { lat: 40.730610, lng: -73.935242 };
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: defaultCenter,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });
}

// Get current location
function getCurrentLocation() {
    const button = document.getElementById('getLocationBtn');
    button.disabled = true;
    button.innerHTML = '<div class="loading-spinner w-5 h-5 inline mr-2"></div>Getting location...';
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Center map on user location
                map.setCenter(currentLocation);
                map.setZoom(14);
                
                // Add user location marker
                addUserMarker(currentLocation);
                
                // Search for nearby mechanics
                searchNearbyMechanics();
                
                button.innerHTML = '<svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>Use My Location';
                button.disabled = false;
            },
            function(error) {
                console.error('Error getting location:', error);
                alert('Unable to get your location. Please try again or search manually.');
                button.innerHTML = '<svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>Use My Location';
                button.disabled = false;
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    } else {
        alert('Geolocation is not supported by this browser.');
        button.disabled = false;
    }
}

// Add user location marker
function addUserMarker(location) {
    const userMarker = new google.maps.Marker({
        position: location,
        map: map,
        title: 'Your Location',
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
                    <circle cx="12" cy="12" r="3" fill="white"/>
                </svg>
            `),
            scaledSize: new google.maps.Size(24, 24)
        }
    });
    
    markers.push(userMarker);
}

// Search for nearby mechanics
async function searchNearbyMechanics() {
    if (!currentLocation) {
        alert('Please get your location first.');
        return;
    }
    
    showLoading(true);
    
    try {
        const distance = document.getElementById('distanceFilter').value;
        const minRating = document.getElementById('ratingFilter').value;
        
        const response = await fetch(`${API_BASE_URL}/mechanics/nearby?latitude=${currentLocation.lat}&longitude=${currentLocation.lng}&radius=${distance}&minRating=${minRating}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch mechanics');
        }
        
        mechanics = await response.json();
        displayMechanics(mechanics);
        addMechanicMarkers(mechanics);
        
    } catch (error) {
        console.error('Error searching mechanics:', error);
        alert('Failed to find nearby mechanics. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Display mechanics in the list
function displayMechanics(mechanicsList) {
    const container = document.getElementById('resultsContainer');
    const list = document.getElementById('mechanicsList');
    
    if (mechanicsList.length === 0) {
        container.classList.remove('hidden');
        list.innerHTML = '<div class="col-span-full text-center py-8"><p class="text-gray-500">No mechanics found in your area.</p></div>';
        return;
    }
    
    list.innerHTML = mechanicsList.map(mechanic => `
        <div class="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200 animate-slide-up">
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-lg font-semibold text-gray-900">${mechanic.name}</h3>
                <div class="flex items-center space-x-1">
                    <span class="text-yellow-400">★</span>
                    <span class="text-sm font-medium text-gray-700">${mechanic.rating.toFixed(1)}</span>
                    <span class="text-xs text-gray-500">(${mechanic.totalRatings})</span>
                </div>
            </div>
            
            <p class="text-gray-600 mb-3">${mechanic.address}</p>
            
            ${mechanic.description ? `<p class="text-gray-500 text-sm mb-4">${mechanic.description}</p>` : ''}
            
            <div class="flex items-center justify-between">
                <button onclick="callMechanic('${mechanic.phone}')" class="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">
                    <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                    Call Now
                </button>
                
                <button onclick="showMechanicDetails('${mechanic._id}')" class="text-primary-600 hover:text-primary-700 font-medium">
                    View Details
                </button>
            </div>
        </div>
    `).join('');
    
    container.classList.remove('hidden');
}

// Add mechanic markers to map
function addMechanicMarkers(mechanicsList) {
    // Clear existing markers (except user marker)
    markers.slice(1).forEach(marker => marker.setMap(null));
    markers = markers.slice(0, 1);
    
    mechanicsList.forEach(mechanic => {
        const marker = new google.maps.Marker({
            position: {
                lat: mechanic.location.coordinates[1],
                lng: mechanic.location.coordinates[0]
            },
            map: map,
            title: mechanic.name,
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 2C10.48 2 6 6.48 6 12c0 7 10 18 10 18s10-11 10-18c0-5.52-4.48-10-10-10z" fill="#EF4444"/>
                        <circle cx="16" cy="12" r="4" fill="white"/>
                    </svg>
                `),
                scaledSize: new google.maps.Size(32, 32)
            }
        });
        
        // Add click listener
        marker.addListener('click', () => {
            showMechanicDetails(mechanic._id);
        });
        
        markers.push(marker);
    });
}

// Apply filters
function applyFilters() {
    if (currentLocation) {
        searchNearbyMechanics();
    }
}

// Show loading state
function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    const resultsContainer = document.getElementById('resultsContainer');
    
    if (show) {
        loadingState.classList.remove('hidden');
        resultsContainer.classList.add('hidden');
    } else {
        loadingState.classList.add('hidden');
    }
}

// Call mechanic
function callMechanic(phone) {
    window.location.href = `tel:${phone}`;
}

// Show mechanic details modal
async function showMechanicDetails(mechanicId) {
    try {
        const response = await fetch(`${API_BASE_URL}/mechanics/${mechanicId}`);
        if (!response.ok) throw new Error('Failed to fetch mechanic details');
        
        const mechanic = await response.json();
        
        document.getElementById('modalTitle').textContent = mechanic.name;
        document.getElementById('modalContent').innerHTML = `
            <div class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-900">Contact Information</h4>
                    <p class="text-gray-600">${mechanic.address}</p>
                    <p class="text-gray-600">${mechanic.phone}</p>
                    ${mechanic.email ? `<p class="text-gray-600">${mechanic.email}</p>` : ''}
                </div>
                
                <div>
                    <h4 class="font-semibold text-gray-900">Rating</h4>
                    <div class="flex items-center space-x-2">
                        <div class="flex">
                            ${Array.from({length: 5}, (_, i) => 
                                `<span class="text-${i < Math.floor(mechanic.rating) ? 'yellow' : 'gray'}-400">★</span>`
                            ).join('')}
                        </div>
                        <span class="text-gray-700">${mechanic.rating.toFixed(1)} (${mechanic.totalRatings} reviews)</span>
                    </div>
                </div>
                
                ${mechanic.services && mechanic.services.length > 0 ? `
                    <div>
                        <h4 class="font-semibold text-gray-900">Services</h4>
                        <div class="flex flex-wrap gap-2">
                            ${mechanic.services.map(service => 
                                `<span class="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-sm">${service}</span>`
                            ).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${mechanic.description ? `
                    <div>
                        <h4 class="font-semibold text-gray-900">Description</h4>
                        <p class="text-gray-600">${mechanic.description}</p>
                    </div>
                ` : ''}
                
                <div class="flex space-x-3 pt-4">
                    <button onclick="callMechanic('${mechanic.phone}')" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">
                        <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                        </svg>
                        Call Now
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('mechanicModal').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error fetching mechanic details:', error);
        alert('Failed to load mechanic details.');
    }
}

// Close modal
function closeModal() {
    document.getElementById('mechanicModal').classList.add('hidden');
}

// Navigation functions
function showMainPage() {
    document.getElementById('mainPage').classList.remove('hidden');
    document.getElementById('adminPage').classList.add('hidden');
    
    // Update navigation styles
    document.querySelector('button[onclick="showMainPage()"]').classList.add('bg-primary-100', 'text-primary-700');
    document.querySelector('button[onclick="showAdminPage()"]').classList.remove('bg-primary-100', 'text-primary-700');
}

function showAdminPage() {
    document.getElementById('mainPage').classList.add('hidden');
    document.getElementById('adminPage').classList.remove('hidden');
    
    // Update navigation styles
    document.querySelector('button[onclick="showMainPage()"]').classList.remove('bg-primary-100', 'text-primary-700');
    document.querySelector('button[onclick="showAdminPage()"]').classList.add('bg-primary-100', 'text-primary-700');
    
    loadAdminMechanics();
}

// Admin functions
async function loadAdminMechanics() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/mechanics`);
        if (!response.ok) throw new Error('Failed to fetch mechanics');
        
        const data = await response.json();
        displayAdminMechanics(data.mechanics);
        
    } catch (error) {
        console.error('Error loading admin mechanics:', error);
        alert('Failed to load mechanics.');
    }
}

function displayAdminMechanics(mechanicsList) {
    const container = document.getElementById('adminMechanicsList');
    
    if (mechanicsList.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No mechanics found.</p>';
        return;
    }
    
    container.innerHTML = mechanicsList.map(mechanic => `
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-900">${mechanic.name}</h4>
                    <p class="text-gray-600 text-sm">${mechanic.address}</p>
                    <p class="text-gray-600 text-sm">${mechanic.phone}</p>
                    <div class="flex items-center space-x-2 mt-2">
                        <span class="text-yellow-400">★</span>
                        <span class="text-sm text-gray-700">${mechanic.rating.toFixed(1)} (${mechanic.totalRatings})</span>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button onclick="editMechanic('${mechanic._id}')" class="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Edit
                    </button>
                    <button onclick="deleteMechanic('${mechanic._id}')" class="text-red-600 hover:text-red-700 text-sm font-medium">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

async function handleAddMechanic(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('mechanicName').value,
        phone: document.getElementById('mechanicPhone').value,
        address: document.getElementById('mechanicAddress').value,
        email: document.getElementById('mechanicEmail').value,
        rating: parseFloat(document.getElementById('mechanicRating').value) || 0,
        description: document.getElementById('mechanicDescription').value,
        location: {
            type: 'Point',
            coordinates: [-73.935242, 40.730610] // Default coordinates (should be geocoded)
        }
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/mechanics`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to add mechanic');
        
        alert('Mechanic added successfully!');
        event.target.reset();
        loadAdminMechanics();
        
    } catch (error) {
        console.error('Error adding mechanic:', error);
        alert('Failed to add mechanic.');
    }
}

async function deleteMechanic(mechanicId) {
    if (!confirm('Are you sure you want to delete this mechanic?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/mechanics/${mechanicId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete mechanic');
        
        alert('Mechanic deleted successfully!');
        loadAdminMechanics();
        
    } catch (error) {
        console.error('Error deleting mechanic:', error);
        alert('Failed to delete mechanic.');
    }
}

function editMechanic(mechanicId) {
    // This would open an edit form or modal
    alert('Edit functionality would be implemented here.');
}

// Close modal when clicking outside
document.getElementById('mechanicModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});