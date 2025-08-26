// Global variables
let currentStep = 1;
let selectedMechanic = null;
let selectedService = null;
let selectedDate = null;
let selectedTimeSlot = null;
let selectedVehicle = null;
let appointments = [];
let vehicles = [];
let mechanics = [];

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Initialize the appointments page
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    setupEventListeners();
    loadAppointments();
    loadStats();
});

// Setup event listeners
function setupEventListeners() {
    // Form submission
    document.getElementById('bookAppointmentForm').addEventListener('submit', handleBookAppointment);
    
    // Date change event
    document.getElementById('appointmentDate').addEventListener('change', loadTimeSlots);
    
    // Service type change event
    document.querySelectorAll('input[name="serviceType"]').forEach(radio => {
        radio.addEventListener('change', updateEstimatedCost);
    });
    
    // Vehicle selection change event
    document.getElementById('vehicleSelect').addEventListener('change', function() {
        selectedVehicle = this.value;
    });
}

// Check authentication
function checkAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
}

// Load appointments
async function loadAppointments() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/appointments/user`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            appointments = await response.json();
            renderUpcomingAppointments();
        } else {
            throw new Error('Failed to load appointments');
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        showMessage('error', 'Failed to load appointments');
    }
}

// Load appointment statistics
async function loadStats() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/appointments/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const stats = await response.json();
            updateStatsDisplay(stats);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Update stats display
function updateStatsDisplay(stats) {
    document.getElementById('upcomingCount').textContent = stats.upcoming || 0;
    document.getElementById('pendingCount').textContent = stats.pending || 0;
    document.getElementById('completedCount').textContent = stats.completed || 0;
    document.getElementById('cancelledCount').textContent = stats.cancelled || 0;
}

// Render upcoming appointments
function renderUpcomingAppointments() {
    const container = document.getElementById('upcomingList');
    const upcoming = appointments.filter(apt => 
        new Date(apt.appointmentDate) > new Date() && apt.status !== 'cancelled'
    );
    
    if (upcoming.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No upcoming appointments</h3>
                <p class="text-gray-500 mb-4">You don't have any upcoming appointments scheduled.</p>
                <button onclick="showBookAppointment()" class="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                    Book Your First Appointment
                </button>
            </div>
        `;
        return;
    }
    
    const appointmentsHTML = upcoming.map(appointment => createAppointmentCard(appointment)).join('');
    container.innerHTML = appointmentsHTML;
}

// Create appointment card HTML
function createAppointmentCard(appointment) {
    const date = new Date(appointment.appointmentDate);
    const statusColor = getStatusColor(appointment.status);
    const statusText = getStatusText(appointment.status);
    
    return `
        <div class="appointment-card bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <div class="flex items-center space-x-3 mb-3">
                        <h4 class="text-lg font-semibold text-gray-900">${appointment.serviceType}</h4>
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${statusColor}">
                            ${statusText}
                        </span>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <p class="text-sm text-gray-600">Date & Time</p>
                            <p class="font-medium">${date.toLocaleDateString()} at ${appointment.timeSlot}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Mechanic</p>
                            <p class="font-medium">${appointment.mechanic?.name || 'TBD'}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Vehicle</p>
                            <p class="font-medium">${appointment.vehicleInfo?.make} ${appointment.vehicleInfo?.model} (${appointment.vehicleInfo?.year})</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Estimated Cost</p>
                            <p class="font-medium">$${appointment.estimatedCost || 'TBD'}</p>
                        </div>
                    </div>
                    
                    ${appointment.description ? `
                        <div class="mb-4">
                            <p class="text-sm text-gray-600">Description</p>
                            <p class="text-gray-900">${appointment.description}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div class="flex flex-col space-y-2 ml-4">
                    <button onclick="viewAppointmentDetails('${appointment._id}')" 
                            class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
                        View Details
                    </button>
                    ${appointment.status === 'pending' ? `
                        <button onclick="cancelAppointment('${appointment._id}')" 
                                class="px-4 py-2 border border-red-600 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors">
                            Cancel
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// Get status color
function getStatusColor(status) {
    switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'confirmed': return 'bg-blue-100 text-blue-800';
        case 'in-progress': return 'bg-purple-100 text-purple-800';
        case 'completed': return 'bg-green-100 text-green-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// Get status text
function getStatusText(status) {
    switch (status) {
        case 'pending': return 'Pending';
        case 'confirmed': return 'Confirmed';
        case 'in-progress': return 'In Progress';
        case 'completed': return 'Completed';
        case 'cancelled': return 'Cancelled';
        default: return 'Unknown';
    }
}

// Show book appointment modal
async function showBookAppointment() {
    currentStep = 1;
    resetBookingForm();
    await loadMechanics();
    await loadVehicles();
    document.getElementById('bookAppointmentModal').classList.remove('hidden');
    updateStepDisplay();
}

// Load mechanics for booking
async function loadMechanics() {
    try {
        const response = await fetch(`${API_BASE_URL}/mechanics`);
        if (response.ok) {
            mechanics = await response.json();
            renderMechanicsList();
        }
    } catch (error) {
        console.error('Error loading mechanics:', error);
        showMessage('error', 'Failed to load mechanics');
    }
}

// Render mechanics list
function renderMechanicsList() {
    const container = document.getElementById('mechanicsList');
    const mechanicsHTML = mechanics.map(mechanic => `
        <label class="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input type="radio" name="mechanicId" value="${mechanic._id}" class="mr-3" onchange="selectMechanic('${mechanic._id}')">
            <div class="flex items-center space-x-3">
                <img src="${mechanic.image || 'https://via.placeholder.com/40'}" alt="${mechanic.name}" class="w-10 h-10 rounded-lg object-cover">
                <div>
                    <div class="font-medium">${mechanic.name}</div>
                    <div class="text-sm text-gray-500">${mechanic.address}</div>
                    <div class="text-sm text-gray-500">Rating: ${mechanic.averageRating?.toFixed(1) || 'N/A'} ⭐</div>
                </div>
            </div>
        </label>
    `).join('');
    container.innerHTML = mechanicsHTML;
}

// Load vehicles
async function loadVehicles() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/vehicles`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            vehicles = await response.json();
            renderVehicleSelect();
        }
    } catch (error) {
        console.error('Error loading vehicles:', error);
        showMessage('error', 'Failed to load vehicles');
    }
}

// Render vehicle select
function renderVehicleSelect() {
    const select = document.getElementById('vehicleSelect');
    const options = vehicles.map(vehicle => 
        `<option value="${vehicle._id}">${vehicle.year} ${vehicle.make} ${vehicle.model} - ${vehicle.licensePlate || 'No Plate'}</option>`
    ).join('');
    select.innerHTML = '<option value="">Choose a vehicle</option>' + options;
}

// Select mechanic
function selectMechanic(mechanicId) {
    selectedMechanic = mechanicId;
}

// Load time slots
async function loadTimeSlots() {
    const date = document.getElementById('appointmentDate').value;
    if (!date || !selectedMechanic) return;
    
    selectedDate = date;
    
    try {
        const response = await fetch(`${API_BASE_URL}/appointments/mechanic/${selectedMechanic}/slots?date=${date}`);
        if (response.ok) {
            const slots = await response.json();
            renderTimeSlots(slots);
        }
    } catch (error) {
        console.error('Error loading time slots:', error);
        showMessage('error', 'Failed to load time slots');
    }
}

// Render time slots
function renderTimeSlots(slots) {
    const container = document.getElementById('timeSlots');
    const timeSlots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];
    
    const slotsHTML = timeSlots.map(time => {
        const isAvailable = slots.available.includes(time);
        const isBooked = slots.booked.includes(time);
        const isSelected = selectedTimeSlot === time;
        
        let className = 'time-slot px-3 py-2 text-sm font-medium rounded-lg cursor-pointer';
        if (isSelected) {
            className += ' selected';
        } else if (isAvailable) {
            className += ' available';
        } else if (isBooked) {
            className += ' unavailable';
        } else {
            className += ' bg-gray-100 text-gray-500';
        }
        
        return `
            <button type="button" 
                    class="${className}" 
                    onclick="selectTimeSlot('${time}')"
                    ${!isAvailable ? 'disabled' : ''}>
                ${time}
            </button>
        `;
    }).join('');
    
    container.innerHTML = slotsHTML;
}

// Select time slot
function selectTimeSlot(time) {
    selectedTimeSlot = time;
    renderTimeSlots({ available: [], booked: [] }); // Re-render to update selection
}

// Update estimated cost
function updateEstimatedCost() {
    const serviceType = document.querySelector('input[name="serviceType"]:checked')?.value;
    if (!serviceType) return;
    
    selectedService = serviceType;
    const costs = {
        'Oil Change': 50,
        'Brake Repair': 200,
        'Engine Diagnostics': 100,
        'Tire Service': 150,
        'AC Repair': 300,
        'General Maintenance': 120,
        'Emergency Service': 250
    };
    
    const cost = costs[serviceType] || 0;
    document.getElementById('estimatedCost').textContent = `$${cost}`;
}

// Next step in booking process
function nextStep() {
    if (currentStep === 1 && !selectedMechanic) {
        showMessage('error', 'Please select a mechanic');
        return;
    }
    
    if (currentStep === 2 && !selectedService) {
        showMessage('error', 'Please select a service type');
        return;
    }
    
    if (currentStep === 3 && (!selectedDate || !selectedTimeSlot)) {
        showMessage('error', 'Please select a date and time');
        return;
    }
    
    if (currentStep === 4 && !selectedVehicle) {
        showMessage('error', 'Please select a vehicle');
        return;
    }
    
    if (currentStep < 4) {
        currentStep++;
        updateStepDisplay();
    }
}

// Previous step in booking process
function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStepDisplay();
    }
}

// Update step display
function updateStepDisplay() {
    // Hide all steps
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`step${i}`).classList.add('hidden');
    }
    
    // Show current step
    document.getElementById(`step${currentStep}`).classList.remove('hidden');
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (currentStep === 1) {
        prevBtn.classList.add('hidden');
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    } else if (currentStep === 4) {
        prevBtn.classList.remove('hidden');
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
    } else {
        prevBtn.classList.remove('hidden');
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    }
}

// Handle book appointment form submission
async function handleBookAppointment(e) {
    e.preventDefault();
    
    if (!selectedMechanic || !selectedService || !selectedDate || !selectedTimeSlot || !selectedVehicle) {
        showMessage('error', 'Please fill in all required fields');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const formData = {
            mechanic: selectedMechanic,
            serviceType: selectedService,
            appointmentDate: selectedDate,
            timeSlot: selectedTimeSlot,
            vehicleId: selectedVehicle,
            description: document.getElementById('description').value,
            estimatedCost: getEstimatedCost()
        };
        
        const response = await fetch(`${API_BASE_URL}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showMessage('success', 'Appointment booked successfully!');
            closeBookModal();
            loadAppointments();
            loadStats();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to book appointment');
        }
    } catch (error) {
        console.error('Error booking appointment:', error);
        showMessage('error', error.message || 'Failed to book appointment');
    }
}

// Get estimated cost
function getEstimatedCost() {
    const costs = {
        'Oil Change': 50,
        'Brake Repair': 200,
        'Engine Diagnostics': 100,
        'Tire Service': 150,
        'AC Repair': 300,
        'General Maintenance': 120,
        'Emergency Service': 250
    };
    
    return costs[selectedService] || 0;
}

// Reset booking form
function resetBookingForm() {
    selectedMechanic = null;
    selectedService = null;
    selectedDate = null;
    selectedTimeSlot = null;
    selectedVehicle = null;
    
    document.getElementById('bookAppointmentForm').reset();
    document.getElementById('estimatedCost').textContent = '$0';
}

// Close book modal
function closeBookModal() {
    document.getElementById('bookAppointmentModal').classList.add('hidden');
    resetBookingForm();
}

// View appointment details
async function viewAppointmentDetails(appointmentId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const appointment = await response.json();
            showAppointmentDetailModal(appointment);
        }
    } catch (error) {
        console.error('Error loading appointment details:', error);
        showMessage('error', 'Failed to load appointment details');
    }
}

// Show appointment detail modal
function showAppointmentDetailModal(appointment) {
    const date = new Date(appointment.appointmentDate);
    const content = document.getElementById('appointmentDetailContent');
    
    content.innerHTML = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-gray-600">Service Type</p>
                    <p class="font-medium">${appointment.serviceType}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Status</p>
                    <p class="font-medium">${getStatusText(appointment.status)}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Date</p>
                    <p class="font-medium">${date.toLocaleDateString()}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Time</p>
                    <p class="font-medium">${appointment.timeSlot}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Mechanic</p>
                    <p class="font-medium">${appointment.mechanic?.name || 'TBD'}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Vehicle</p>
                    <p class="font-medium">${appointment.vehicleInfo?.make} ${appointment.vehicleInfo?.model}</p>
                </div>
            </div>
            
            ${appointment.description ? `
                <div>
                    <p class="text-sm text-gray-600">Description</p>
                    <p class="text-gray-900">${appointment.description}</p>
                </div>
            ` : ''}
            
            <div class="flex space-x-3 pt-4">
                ${appointment.status === 'pending' ? `
                    <button onclick="cancelAppointment('${appointment._id}')" 
                            class="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                        Cancel Appointment
                    </button>
                ` : ''}
                <button onclick="closeDetailModal()" 
                        class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('appointmentDetailModal').classList.remove('hidden');
}

// Close detail modal
function closeDetailModal() {
    document.getElementById('appointmentDetailModal').classList.add('hidden');
}

// Cancel appointment
async function cancelAppointment(appointmentId) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/cancel`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showMessage('success', 'Appointment cancelled successfully');
            closeDetailModal();
            loadAppointments();
            loadStats();
        } else {
            throw new Error('Failed to cancel appointment');
        }
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        showMessage('error', 'Failed to cancel appointment');
    }
}

// Show upcoming appointments
function showUpcomingAppointments() {
    // This function can be expanded to show different views
    loadAppointments();
}

// Show past appointments
function showPastAppointments() {
    // This function can be expanded to show past appointments
    showMessage('info', 'Past appointments feature coming soon!');
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