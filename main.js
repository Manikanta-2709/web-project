// Check login status with CSRF protection
function checkLoginStatus() {
    fetch('check_session.php', {
        credentials: 'include' // Include cookies
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        const authButtons = document.getElementById('authButtons');
        const userProfile = document.getElementById('userProfile');

        if (data.loggedIn) {
            authButtons.style.display = 'none';
            userProfile.style.display = 'block';
            document.getElementById('userProfileName').textContent = data.userName;

            // Show role-specific elements
            const employerElements = document.querySelectorAll('.role-employer');
            const jobseekerElements = document.querySelectorAll('.role-jobseeker');
            
            if (data.accountType === 'employer') {
                employerElements.forEach(el => el.style.display = 'block');
                jobseekerElements.forEach(el => el.style.display = 'none');
            } else {
                employerElements.forEach(el => el.style.display = 'none');
                jobseekerElements.forEach(el => el.style.display = 'block');
            }
        } else {
            authButtons.style.display = 'flex';
            userProfile.style.display = 'none';
            document.querySelectorAll('.role-employer, .role-jobseeker')
                .forEach(el => el.style.display = 'none');
        }
    })
    .catch(error => {
        console.error('Error checking login status:', error);
    });
}
// Handle login form submission
document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get CSRF token
    const csrfToken = getCSRFToken();
    
    // Get form data
    const formData = new FormData(this);
    formData.append('csrf_token', csrfToken);
    
    fetch('login.php', {
        method: 'POST',
        body: formData,
        credentials: 'include' // Important for session cookies
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Update UI
            document.getElementById('authButtons').style.display = 'none';
            document.getElementById('userProfile').style.display = 'block';
            document.getElementById('userProfileName').textContent = data.userName;
            
            // Show role-specific elements
            if (data.accountType === 'employer') {
                document.querySelectorAll('.role-employer').forEach(el => el.style.display = 'block');
                document.querySelectorAll('.role-jobseeker').forEach(el => el.style.display = 'none');
            } else {
                document.querySelectorAll('.role-employer').forEach(el => el.style.display = 'none');
                document.querySelectorAll('.role-jobseeker').forEach(el => el.style.display = 'block');
            }
            
            // Show success message
            alert('Login successful!');
            
            // Optionally redirect or refresh content
            window.location.reload();
        } else {
            alert(data.message || 'Login failed');
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        alert('An error occurred during login');
    });
});
// Handle job search with input validation
document.getElementById('jobSearchForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const keyword = document.getElementById('jobSearchInput').value.trim();
    const location = document.getElementById('locationInput').value.trim();
    
    if (!keyword && !location) {
        alert('Please enter search criteria');
        return;
    }

    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (location) params.append('location', location);
    
    fetch(`search_jobs.php?${params.toString()}`)
        .then(response => {
            if (!response.ok) throw new Error('Search failed');
            return response.json();
        })
        .then(jobs => {
            const container = document.getElementById('jobListings');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (jobs.length === 0) {
                container.innerHTML = '<div class="col-12"><div class="alert alert-info">No jobs found matching your criteria.</div></div>';
                return;
            }
            
            jobs.forEach(job => {
                const jobCard = document.createElement('div');
                jobCard.className = 'col-md-4 mb-4';
                jobCard.innerHTML = `
                    <div class="card h-100 job-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h5 class="card-title">${escapeHTML(job.title)}</h5>
                                    <h6 class="card-subtitle mb-2 text-muted">${escapeHTML(job.company)}</h6>
                                </div>
                                <span class="badge bg-primary job-type">${escapeHTML(job.type)}</span>
                            </div>
                            <p class="card-text">${escapeHTML(job.description)}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <span><i class="fas fa-map-marker-alt me-1"></i> ${escapeHTML(job.location)}</span>
                                <span><i class="fas fa-rupee-sign me-1"></i> ${escapeHTML(job.salary || 'N/A')}</span>
                            </div>
                            <div class="mt-3">
                                <button class="btn btn-sm btn-primary me-2" onclick="applyForJob(${job.id})">Apply Now</button>
                                <button class="btn btn-sm btn-outline-primary" onclick="saveJob(${job.id})">Save</button>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(jobCard);
            });
        })
        .catch(error => {
            console.error('Search error:', error);
            alert('Failed to search jobs. Please try again.');
        });
});

// Secure applyForJob function
function applyForJob(jobId) {
    if (!jobId || isNaN(jobId)) {
        alert('Invalid job ID');
        return;
    }

    fetch('apply_job.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ 
            jobId: jobId,
            csrfToken: getCSRFToken()
        }),
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) throw new Error('Application failed');
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert('Job application submitted successfully!');
        } else {
            alert(data.message || 'Failed to apply for the job');
        }
    })
    .catch(error => {
        console.error('Application error:', error);
        alert('An error occurred while applying for the job.');
    });
}

// Helper function to escape HTML
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Helper function to get CSRF token
function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content || '';
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    // Add CSRF token meta tag if not exists
    if (!document.querySelector('meta[name="csrf-token"]')) {
        const meta = document.createElement('meta');
        meta.name = 'csrf-token';
        meta.content = generateCSRFToken();
        document.head.appendChild(meta);
    }
    
    checkLoginStatus();
});

// Generate CSRF token (simplified version)
function generateCSRFToken() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}