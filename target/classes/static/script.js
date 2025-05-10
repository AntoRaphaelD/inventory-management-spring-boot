/**
 * SimpleMarket - Authentication Module
 * Handles user authentication and session management
 */

// Constants
const SESSION_DURATION = 7; // days
const SESSION_KEY = 'simplemarket_session';
const STORAGE_KEYS = {
    USER_ROLE: 'userRole',
    USERNAME: 'username',
    REMEMBER_ME: 'rememberMe'
};

// Mock database (for demo purposes only)
const MOCK_USERS = {
    admin: {
        password: 'admin123',
        role: 'admin',
        displayName: 'Administrator'
    },
    customer: {
        password: 'cust123',
        role: 'customer',
        displayName: 'Customer'
    }
};

/**
 * Handles user login form submission
 * @param {Event} event - The form submit event
 */
function login(event) {
    if (event) event.preventDefault();
    
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const rememberMe = document.getElementById("rememberMe").checked;
    const feedback = document.getElementById("loginFeedback");
    
    // Reset previous feedback
    feedback.textContent = "";
    feedback.className = "feedback";
    
    // Validate inputs
    if (!username || !password) {
        showFeedback(feedback, "Please enter both username and password.", "error");
        return;
    }
    
    // Authenticate user (mock implementation)
    authenticateUser(username, password)
        .then(userData => {
            if (userData) {
                // Set session data
                const sessionData = {
                    userRole: userData.role,
                    username: username,
                    displayName: userData.displayName,
                    timestamp: new Date().getTime()
                };
                
                // Store in localStorage or sessionStorage based on remember me
                if (rememberMe) {
                    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
                    localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
                } else {
                    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
                    localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
                }
                
                // For backward compatibility with existing code
                localStorage.setItem(STORAGE_KEYS.USER_ROLE, userData.role);
                localStorage.setItem(STORAGE_KEYS.USERNAME, username);
                
                // Redirect to appropriate dashboard
                redirectToUserDashboard(userData.role);
            } else {
                showFeedback(feedback, "Invalid credentials. Please try again.", "error");
                document.getElementById("password").value = "";
            }
        })
        .catch(error => {
            console.error('Authentication error:', error);
            showFeedback(feedback, "An error occurred during login. Please try again.", "error");
        });
}

/**
 * Authenticates a user against the mock database
 * @param {string} username - The username to authenticate
 * @param {string} password - The password to verify
 * @returns {Promise<Object|null>} - User data or null if authentication fails
 */
function authenticateUser(username, password) {
    return new Promise((resolve) => {
        // Simulate network delay (remove in production)
        setTimeout(() => {
            const user = MOCK_USERS[username];
            if (user && user.password === password) {
                resolve(user);
            } else {
                resolve(null);
            }
        }, 300);
    });
}

/**
 * Redirects to the appropriate dashboard based on user role
 * @param {string} role - The user's role
 */
function redirectToUserDashboard(role) {
    const dashboards = {
        admin: "admin.html",
        customer: "customer.html"
    };
    
    const redirectUrl = dashboards[role] || "index.html";
    window.location.href = redirectUrl;
}

/**
 * Shows feedback message to the user
 * @param {HTMLElement} element - The feedback element
 * @param {string} message - The message to display
 * @param {string} type - The feedback type (error, success, info)
 */
function showFeedback(element, message, type = "info") {
    element.textContent = message;
    element.className = `feedback ${type}`;
}

/**
 * Checks if there's an existing valid session and redirects if appropriate
 */
function checkExistingSession() {
    // Try to get session from localStorage or sessionStorage
    let sessionData = JSON.parse(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || '{}');
    
    // Check if session exists and is valid
    if (sessionData.userRole && sessionData.timestamp) {
        const expirationTime = sessionData.timestamp + (SESSION_DURATION * 24 * 60 * 60 * 1000);
        
        if (new Date().getTime() < expirationTime) {
            // Session is valid, restore role and redirect
            localStorage.setItem(STORAGE_KEYS.USER_ROLE, sessionData.userRole);
            redirectToUserDashboard(sessionData.userRole);
            return true;
        }
    }
    
    return false;
}

/**
 * Handles password visibility toggle
 */
function setupPasswordToggle() {
    const toggleButton = document.getElementById('togglePassword');
    if (!toggleButton) return;
    
    toggleButton.addEventListener('click', function() {
        const passwordInput = document.getElementById('password');
        const currentType = passwordInput.getAttribute('type');
        
        // Toggle password visibility
        if (currentType === 'password') {
            passwordInput.setAttribute('type', 'text');
            this.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
            `;
            this.setAttribute('aria-label', 'Hide password');
        } else {
            passwordInput.setAttribute('type', 'password');
            this.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
            `;
            this.setAttribute('aria-label', 'Show password');
        }
    });
}

/**
 * Initialize the login page
 */
function initLoginPage() {
    // Check for existing session
    if (checkExistingSession()) return;
    
    // Setup password toggle
    setupPasswordToggle();
    
    // Remember username if available
    if (localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true') {
        const savedUsername = localStorage.getItem(STORAGE_KEYS.USERNAME);
        if (savedUsername) {
            document.getElementById('username').value = savedUsername;
            document.getElementById('rememberMe').checked = true;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initLoginPage);