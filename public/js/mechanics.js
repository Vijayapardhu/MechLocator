// Global variables
let map = null;
let markers = [];
let currentLocation = null;
let mechanics = [];
let currentPage = 1;
let hasMoreResults = true;
let searchFilters = {
    search: '',
    distance: 10,
    rating: 4,
    service: '',
    availability: '',
    price: '',
    sort: 'rating'
};

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Initialize the mechanics page
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    initializeMap();
    loadMechanics();
});

// Setup event listeners
function setupEventListeners() {
    // Search and filter events
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('useLocationBtn').addEventListener('click', useCurrentLocation);
    document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
    document.getElementById('toggleFilters').addEventListener('click', toggleAdvancedFilters);
    
    // View toggle events
    document.getElementById('listViewBtn').addEventListener('click', () => switchView('list'));
    document.getElementById('mapViewBtn').addEventListener('click', () => switchView('map'));
    
    // Load more button
    document.getElementById('loadMoreBtn').addEventListener('click', loadMoreMechanics);
    
    // Search input events
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Filter change events
    document.getElementById('distanceFilter').addEventListener('change', updateFilters);
    document.getElementById('ratingFilter').addEventListener('change', updateFilters);
    document.getElementById('serviceFilter').addEventListener('change', updateFilters);
    document.getElementById('availabilityFilter').addEventListener('change', updateFilters);
    document.getElementById('priceFilter').addEventListener('change', updateFilters);
    document.getElementById('sortFilter').addEventListener('change', updateFilters);
}

// Initialize Google Maps
function initializeMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    map = new google.maps.Map(mapElement, {
        zoom: 12,
        center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });
}

// Load mechanics data
async function loadMechanics() {
    try {
        showLoading();
        
        const params = new URLSearchParams({
            page: currentPage,
            limit: 10,
            ...searchFilters
        });

        if (currentLocation) {
            params.append('latitude', currentLocation.lat);
            params.append('longitude', currentLocation.lng);
        }

        const response = await fetch(`${API_BASE_URL}/mechanics/search?${params}`);
        const data = await response.json();

        if (response.ok) {
            if (currentPage === 1) {
                mechanics = data.mechanics;
            } else {
                mechanics = [...mechanics, ...data.mechanics];
            }
            
            hasMoreResults = data.mechanics.length === 10;
            updateResultsCount(data.total);
            renderMechanics();
            updateMapMarkers();
            
            if (currentPage === 1) {
                hideLoading();
            }
        } else {
            throw new Error(data.error || 'Failed to load mechanics');
        }
    } catch (error) {
        console.error('Error loading mechanics:', error);
        showMessage('error', 'Failed to load mechanics. Please try again.');
        hideLoading();
    }
}

// Perform search
function performSearch() {
    currentPage = 1;
    hasMoreResults = true;
    updateFilters();
    loadMechanics();
}

// Update filters from form inputs
function updateFilters() {
    searchFilters = {
        search: document.getElementById('searchInput').value,
        distance: parseInt(document.getElementById('distanceFilter').value),
        rating: parseFloat(document.getElementById('ratingFilter').value),
        service: document.getElementById('serviceFilter').value,
        availability: document.getElementById('availabilityFilter').value,
        price: document.getElementById('priceFilter').value,
        sort: document.getElementById('sortFilter').value
    };
}

// Use current location
function useCurrentLocation() {
    if (navigator.geolocation) {
        setButtonLoading('useLocationBtn', true);
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Update map center
                if (map) {
                    map.setCenter(currentLocation);
                    map.setZoom(13);
                }
                
                // Add user location marker
                addUserLocationMarker();
                
                // Perform search with new location
                performSearch();
                setButtonLoading('useLocationBtn', false);
            },
            function(error) {
                console.error('Geolocation error:', error);
                showMessage('error', 'Unable to get your location. Please try again.');
                setButtonLoading('useLocationBtn', false);
            }
        );
    } else {
        showMessage('error', 'Geolocation is not supported by this browser.');
    }
}

// Add user location marker to map
function addUserLocationMarker() {
    if (!map || !currentLocation) return;

    const userMarker = new google.maps.Marker({
        position: currentLocation,
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
        },
        title: 'Your Location'
    });

    // Add circle to show search radius
    const circle = new google.maps.Circle({
        strokeColor: '#3B82F6',
        strokeOpacity: 0.3,
        strokeWeight: 2,
        fillColor: '#3B82F6',
        fillOpacity: 0.1,
        map: map,
        center: currentLocation,
        radius: searchFilters.distance * 1000 // Convert km to meters
    });
}

// Clear all filters
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('distanceFilter').value = '10';
    document.getElementById('ratingFilter').value = '4';
    document.getElementById('serviceFilter').value = '';
    document.getElementById('availabilityFilter').value = '';
    document.getElementById('priceFilter').value = '';
    document.getElementById('sortFilter').value = 'rating';
    
    updateFilters();
    performSearch();
}

// Toggle advanced filters
function toggleAdvancedFilters() {
    const filters = document.getElementById('advancedFilters');
    const button = document.getElementById('toggleFilters');
    
    if (filters.classList.contains('hidden')) {
        filters.classList.remove('hidden');
        button.textContent = 'Hide Filters';
    } else {
        filters.classList.add('hidden');
        button.textContent = 'Show Filters';
    }
}

// Switch between list and map view
function switchView(view) {
    const listViewBtn = document.getElementById('listViewBtn');
    const mapViewBtn = document.getElementById('mapViewBtn');
    const mechanicsList = document.getElementById('mechanicsList');
    const mapContainer = document.getElementById('mapContainer');
    
    if (view === 'list') {
        listViewBtn.classList.add('bg-primary-600', 'text-white');
        listViewBtn.classList.remove('text-gray-600');
        mapViewBtn.classList.remove('bg-primary-600', 'text-white');
        mapViewBtn.classList.add('text-gray-600');
        
        mechanicsList.classList.remove('lg:col-span-1');
        mechanicsList.classList.add('lg:col-span-2');
        mapContainer.classList.add('hidden');
    } else {
        mapViewBtn.classList.add('bg-primary-600', 'text-white');
        mapViewBtn.classList.remove('text-gray-600');
        listViewBtn.classList.remove('bg-primary-600', 'text-white');
        listViewBtn.classList.add('text-gray-600');
        
        mechanicsList.classList.remove('lg:col-span-2');
        mechanicsList.classList.add('lg:col-span-1');
        mapContainer.classList.remove('hidden');
        
        // Trigger map resize
        if (map) {
            google.maps.event.trigger(map, 'resize');
        }
    }
}

// Render mechanics list
function renderMechanics() {
    const container = document.getElementById('mechanicsContainer');
    
    if (mechanics.length === 0) {
        showNoResults();
        return;
    }
    
    const mechanicsHTML = mechanics.map(mechanic => createMechanicCard(mechanic)).join('');
    container.innerHTML = mechanicsHTML;
    
    // Show/hide load more button
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    if (hasMoreResults) {
        loadMoreContainer.classList.remove('hidden');
    } else {
        loadMoreContainer.classList.add('hidden');
    }
}

// Create mechanic card HTML
function createMechanicCard(mechanic) {
    const distance = mechanic.distance ? `${mechanic.distance.toFixed(1)} km` : 'N/A';
    const rating = mechanic.averageRating || 0;
    const reviewCount = mechanic.reviewCount || 0;
    
    return `
        <div class="mechanic-card bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-fade-in">
            <div class="flex items-start space-x-4">
                <!-- Mechanic Image -->
                <div class="flex-shrink-0">
                    <img src="${mechanic.image || 'https://via.placeholder.com/80'}" 
                         alt="${mechanic.name}" 
                         class="w-20 h-20 rounded-lg object-cover">
                </div>
                
                <!-- Mechanic Info -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 mb-1">${mechanic.name}</h3>
                            <p class="text-sm text-gray-600 mb-2">${mechanic.address}</p>
                            
                            <!-- Rating and Reviews -->
                            <div class="flex items-center space-x-4 mb-3">
                                <div class="flex items-center space-x-1">
                                    <div class="rating-stars">
                                        ${generateStarRating(rating)}
                                    </div>
                                    <span class="text-sm text-gray-600">${rating.toFixed(1)}</span>
                                </div>
                                <span class="text-sm text-gray-500">${reviewCount} reviews</span>
                                <span class="text-sm text-gray-500">• ${distance}</span>
                            </div>
                            
                            <!-- Services -->
                            <div class="flex flex-wrap gap-2 mb-3">
                                ${mechanic.services.slice(0, 3).map(service => 
                                    `<span class="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">${service}</span>`
                                ).join('')}
                                ${mechanic.services.length > 3 ? 
                                    `<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">+${mechanic.services.length - 3} more</span>` : 
                                    ''
                                }
                            </div>
                        </div>
                        
                        <!-- Status Badge -->
                        <div class="flex-shrink-0">
                            <span class="px-2 py-1 text-xs font-medium rounded-full ${mechanic.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                ${mechanic.isActive ? 'Open' : 'Closed'}
                            </span>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="flex items-center space-x-3">
                        <button onclick="viewMechanicDetails('${mechanic._id}')" 
                                class="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                            View Details
                        </button>
                        <button onclick="callMechanic('${mechanic.phone}')" 
                                class="px-4 py-2 border border-primary-600 text-primary-600 hover:bg-primary-50 font-medium rounded-lg transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                        </button>
                        <button onclick="toggleFavorite('${mechanic._id}')" 
                                class="px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium rounded-lg transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Generate star rating HTML
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<svg class="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>';
    }
    
    // Half star
    if (hasHalfStar) {
        starsHTML += '<svg class="w-4 h-4 fill-current" viewBox="0 0 20 20"><defs><linearGradient id="half-star"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs><path fill="url(#half-star)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<svg class="w-4 h-4 fill-current text-gray-300" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>';
    }
    
    return starsHTML;
}

// Update map markers
function updateMapMarkers() {
    if (!map) return;
    
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    
    // Add new markers
    mechanics.forEach(mechanic => {
        if (mechanic.location && mechanic.location.coordinates) {
            const marker = new google.maps.Marker({
                position: {
                    lat: mechanic.location.coordinates[1],
                    lng: mechanic.location.coordinates[0]
                },
                map: map,
                title: mechanic.name,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="16" cy="16" r="16" fill="#3B82F6" opacity="0.8"/>
                            <circle cx="16" cy="16" r="8" fill="white"/>
                        </svg>
                    `),
                    scaledSize: new google.maps.Size(32, 32),
                    anchor: new google.maps.Point(16, 16)
                }
            });
            
            // Add click listener
            marker.addListener('click', () => {
                viewMechanicDetails(mechanic._id);
            });
            
            markers.push(marker);
        }
    });
}

// Load more mechanics
function loadMoreMechanics() {
    if (!hasMoreResults) return;
    
    currentPage++;
    loadMechanics();
}

// View mechanic details
function viewMechanicDetails(mechanicId) {
    // This will be implemented to show detailed mechanic information
    showMessage('info', 'Mechanic details feature coming soon!');
}

// Call mechanic
function callMechanic(phone) {
    if (phone) {
        window.location.href = `tel:${phone}`;
    } else {
        showMessage('error', 'Phone number not available');
    }
}

// Toggle favorite
async function toggleFavorite(mechanicId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('error', 'Please login to save favorites');
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/auth/favorites/${mechanicId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showMessage('success', 'Added to favorites!');
        } else {
            showMessage('error', 'Failed to add to favorites');
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        showMessage('error', 'Failed to update favorites');
    }
}

// Show loading state
function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('noResultsState').classList.add('hidden');
    document.getElementById('mechanicsContainer').classList.add('hidden');
}

// Hide loading state
function hideLoading() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('mechanicsContainer').classList.remove('hidden');
}

// Show no results state
function showNoResults() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('mechanicsContainer').classList.add('hidden');
    document.getElementById('noResultsState').classList.remove('hidden');
}

// Update results count
function updateResultsCount(count) {
    document.getElementById('resultsCount').textContent = count;
}

// Set button loading state
function setButtonLoading(buttonId, loading) {
    const button = document.getElementById(buttonId);
    const spinner = button.querySelector('.loading-spinner');
    
    if (loading) {
        button.disabled = true;
        if (spinner) spinner.classList.remove('hidden');
    } else {
        button.disabled = false;
        if (spinner) spinner.classList.add('hidden');
    }
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
    } else if (type === 'error') {
        content.className = 'rounded-lg p-4 shadow-lg max-w-sm bg-red-50 border border-red-200';
        icon.innerHTML = `
            <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
        `;
    } else {
        content.className = 'rounded-lg p-4 shadow-lg max-w-sm bg-blue-50 border border-blue-200';
        icon.innerHTML = `
            <svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
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