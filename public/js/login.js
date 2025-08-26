// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Initialize the login page
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    checkForExistingToken();
});

// Setup event listeners
function setupEventListeners() {
    // Login form submission
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Register form submission
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Forgot password form submission
    document.getElementById('forgotPasswordForm').addEventListener('submit', handleForgotPassword);
}

// Check if user already has a token
function checkForExistingToken() {
    const token = localStorage.getItem('token');
    if (token) {
        // Verify token is still valid
        verifyToken(token);
    }
}

// Verify token validity
async function verifyToken(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            // Token is valid, redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            // Token is invalid, remove it
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    } catch (error) {
        console.error('Token verification error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Show loading state
    setButtonLoading('loginBtn', true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // If remember me is checked, store for longer
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            }
            
            showMessage('success', 'Login successful! Redirecting...');
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } else {
            showMessage('error', data.error || 'Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('error', 'Network error. Please try again.');
    } finally {
        setButtonLoading('loginBtn', false);
    }
}

// Handle register form submission
async function handleRegister(e) {
    e.preventDefault();
    
    const formData = {
        username: document.getElementById('registerUsername').value,
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value,
        firstName: document.getElementById('registerFirstName').value,
        lastName: document.getElementById('registerLastName').value,
        phone: document.getElementById('registerPhone').value || undefined
    };
    
    // Validate password length
    if (formData.password.length < 6) {
        showMessage('error', 'Password must be at least 6 characters long.');
        return;
    }
    
    // Show loading state
    setButtonLoading('registerBtn', true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showMessage('success', 'Account created successfully! Redirecting...');
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } else {
            if (data.errors && Array.isArray(data.errors)) {
                const errorMessage = data.errors.map(error => error.msg).join(', ');
                showMessage('error', errorMessage);
            } else {
                showMessage('error', data.error || 'Registration failed. Please try again.');
            }
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('error', 'Network error. Please try again.');
    } finally {
        setButtonLoading('registerBtn', false);
    }
}

// Handle forgot password form submission
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgotEmail').value;
    
    // Show loading state
    setButtonLoading('forgotBtn', true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('success', 'Password reset instructions sent to your email.');
            showLoginForm(); // Go back to login form
        } else {
            showMessage('error', data.error || 'Failed to send reset instructions.');
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        showMessage('error', 'Network error. Please try again.');
    } finally {
        setButtonLoading('forgotBtn', false);
    }
}

// Form navigation functions
function showLoginForm() {
    hideAllForms();
    document.getElementById('loginForm').classList.remove('hidden');
    updateTabStyles('loginTab');
}

function showRegisterForm() {
    hideAllForms();
    document.getElementById('registerForm').classList.remove('hidden');
    updateTabStyles('registerTab');
}

function showForgotPassword() {
    hideAllForms();
    document.getElementById('forgotPasswordForm').classList.remove('hidden');
    updateTabStyles('forgotTab');
}

// Hide all forms
function hideAllForms() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('forgotPasswordForm').classList.add('hidden');
}

// Update tab styles
function updateTabStyles(activeTabId) {
    // Reset all tabs
    document.getElementById('loginTab').classList.remove('text-primary-600', 'bg-primary-50', 'border-primary-600');
    document.getElementById('loginTab').classList.add('text-gray-500', 'bg-gray-50', 'border-transparent');
    
    document.getElementById('registerTab').classList.remove('text-primary-600', 'bg-primary-50', 'border-primary-600');
    document.getElementById('registerTab').classList.add('text-gray-500', 'bg-gray-50', 'border-transparent');
    
    // Activate the selected tab
    if (activeTabId === 'loginTab') {
        document.getElementById('loginTab').classList.remove('text-gray-500', 'bg-gray-50', 'border-transparent');
        document.getElementById('loginTab').classList.add('text-primary-600', 'bg-primary-50', 'border-primary-600');
    } else if (activeTabId === 'registerTab') {
        document.getElementById('registerTab').classList.remove('text-gray-500', 'bg-gray-50', 'border-transparent');
        document.getElementById('registerTab').classList.add('text-primary-600', 'bg-primary-50', 'border-primary-600');
    }
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(inputId + 'Icon');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.innerHTML = `
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
        `;
    } else {
        input.type = 'password';
        icon.innerHTML = `
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
        `;
    }
}

// Set button loading state
function setButtonLoading(buttonId, loading) {
    const button = document.getElementById(buttonId);
    const textSpan = document.getElementById(buttonId + 'Text');
    const spinner = document.getElementById(buttonId + 'Spinner');
    
    if (loading) {
        button.disabled = true;
        textSpan.classList.add('hidden');
        spinner.classList.remove('hidden');
    } else {
        button.disabled = false;
        textSpan.classList.remove('hidden');
        spinner.classList.add('hidden');
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

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to submit current form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const visibleForm = document.querySelector('form:not(.hidden)');
        if (visibleForm) {
            visibleForm.dispatchEvent(new Event('submit'));
        }
    }
    
    // Escape to hide message
    if (e.key === 'Escape') {
        hideMessage();
    }
});