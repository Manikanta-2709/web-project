// Handle user registration
function registerUser(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    // Client-side validation
    if (formData.get('password') !== formData.get('confirmPassword')) {
        showToast('error', 'Passwords do not match');
        return;
    }
    
    if (formData.get('password').length < 8) {
        showToast('error', 'Password must be at least 8 characters');
        return;
    }
    
    fetch('register.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('success', 'Registration successful!');
            updateUIAfterLogin(data.userName, data.accountType);
            $('#registerModal').modal('hide');
        } else {
            showToast('error', data.message || 'Registration failed');
        }
    })
    .catch(error => {
        console.error('Registration error:', error);
        showToast('error', 'An error occurred during registration');
    });
}

// Handle user login
function loginUser(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    fetch('login.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('success', 'Login successful!');
            updateUIAfterLogin(data.userName, data.accountType);
            $('#loginModal').modal('hide');
        } else {
            showToast('error', data.message || 'Login failed');
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        showToast('error', 'An error occurred during login');
    });
}

// Handle job application
function applyForJob(jobId) {
    if (!isUserLoggedIn()) {
        showToast('error', 'Please login to apply for jobs');
        $('#loginModal').modal('show');
        return;
    }
    
    fetch('apply_job.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ jobId: jobId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('success', 'Application submitted successfully!');
            updateApplyButton(jobId);
        } else {
            showToast('error', data.message || 'Failed to submit application');
        }
    })
    .catch(error => {
        console.error('Application error:', error);
        showToast('error', 'An error occurred while submitting application');
    });
}

// Update UI after successful login
function updateUIAfterLogin(userName, accountType) {
    document.getElementById('authButtons').style.display = 'none';
    document.getElementById('userProfile').style.display = 'block';
    document.getElementById('userProfileName').textContent = userName;
    
    // Show/hide role-specific elements
    const employerElements = document.querySelectorAll('.role-employer');
    const jobseekerElements = document.querySelectorAll('.role-jobseeker');
    
    employerElements.forEach(el => {
        el.style.display = accountType === 'employer' ? 'block' : 'none';
    });
    
    jobseekerElements.forEach(el => {
        el.style.display = accountType === 'jobseeker' ? 'block' : 'none';
    });
}

// Check if user is logged in
function isUserLoggedIn() {
    return document.getElementById('userProfile').style.display === 'block';
}

// Update apply button after successful application
function updateApplyButton(jobId) {
    const applyBtn = document.querySelector(`[data-job-id="${jobId}"]`);
    if (applyBtn) {
        applyBtn.disabled = true;
        applyBtn.textContent = 'Applied';
        applyBtn.classList.replace('btn-primary', 'btn-success');
    }
}

// Show toast notifications
function showToast(type, message) {
    const toastContainer = document.querySelector('.toast-container') || createToastContainer();
    const toast = createToastElement(type, message);
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Create toast container if not exists
function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// Create toast element
function createToastElement(type, message) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    return toast;
}

// Add event listeners when document is ready
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', registerUser);
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', loginUser);
    }
});