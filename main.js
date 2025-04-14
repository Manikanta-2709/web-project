// Check login status with CSRF protection
async function checkLoginState() {
    try {
        const response = await fetch('check_session.php');
        const data = await response.json();
        
        if (data.loggedIn) {
            // Update client-side state
            currentUser = {
                firstName: data.userName,
                type: data.accountType
            };
            userType = data.accountType;
            
            // Store in localStorage for persistence
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('userType', userType);
            
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
            
            // Initialize role-based UI
            initializeRoleBasedUI();
        } else {
            // Clear client-side state
            currentUser = null;
            userType = null;
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userType');
            
            // Update UI
            document.getElementById('authButtons').style.display = 'flex';
            document.getElementById('userProfile').style.display = 'none';
            
            // Hide role-specific elements
            document.querySelectorAll('.role-employer, .role-jobseeker').forEach(el => {
                el.style.display = 'none';
            });
        }
    } catch (error) {
        console.error('Session check error:', error);
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add CSRF token meta tag if not exists
    if (!document.querySelector('meta[name="csrf-token"]')) {
        const meta = document.createElement('meta');
        meta.name = 'csrf-token';
        meta.content = generateCSRFToken();
        document.head.appendChild(meta);
    }
    
    // Check session state
    checkLoginState().then(() => {
        // Initialize UI based on login state
        if (currentUser) {
            document.getElementById('userProfileName').textContent = currentUser.firstName;
            document.getElementById('authButtons').style.display = 'none';
            document.getElementById('userProfile').style.display = 'block';
            initializeRoleBasedUI();
        } else {
            document.getElementById('authButtons').style.display = 'flex';
            document.getElementById('userProfile').style.display = 'none';
        }
        
        // Initial content population
        showJobCategory('all');
        updateSavedJobsUI();
        handleApplicationTabs();
    });
});

// Show loading state
const searchBtn = document.querySelector('#jobSearchForm button[type="submit"]');
searchBtn.disabled = true;
searchBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Searching...';

fetch(`search_jobs.php?keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`)
    .then(response => {
        searchBtn.disabled = false;
        searchBtn.innerHTML = '<i class="fas fa-search me-1"></i> Search';
        
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
        
        // Render job listings
        jobs.forEach(job => {
            const jobCard = createJobCard(job);
            container.appendChild(jobCard);
        });
    })
    .catch(error => {
        console.error('Search error:', error);
        showToast('Search Error', 'Failed to search jobs. Please try again.', 'error');
    });

// Secure applyForJob function
function applyForJob(jobId) {
    if (!jobId || isNaN(jobId)) {
        showToast('Error', 'Invalid job ID', 'error');
        return;
    }

    if (!currentUser) {
        showToast('Login Required', 'Please log in to apply for jobs', 'info');
        showPage('login');
        return;
    }

    // Show application modal
    const applicationModal = new bootstrap.Modal(document.getElementById('applicationModal'));
    applicationModal.show();

    // Handle form submission
    document.getElementById('jobApplicationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        formData.append('jobId', jobId);
        
        // Show loading state
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';

        fetch('apply_job.php', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane me-1"></i> Submit Application';
            
            if (!response.ok) throw new Error('Application failed');
            return response.json();
        })
        .then(data => {
            applicationModal.hide();
            if (data.success) {
                showToast('Success', 'Application submitted successfully!', 'success');
                updateJobCardButtons(jobId);
                showPage('my-applications');
            } else {
                showToast('Error', data.message || 'Failed to submit application', 'error');
            }
        })
        .catch(error => {
            console.error('Application error:', error);
            showToast('Error', 'Failed to submit application', 'error');
        });
    }, {once: true}); // Only bind this once
}

// Generate CSRF token (simplified version)
function generateCSRFToken() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
function loadEmployerDashboard() {
    if (!currentUser || userType !== 'employer') return;
    
    fetch('get_employer_jobs.php')
    .then(response => {
        if (!response.ok) throw new Error('Failed to load dashboard');
        return response.json();
    })
    .then(data => {
        // Update counts
        document.getElementById('activeJobsCount').textContent = data.activeJobs || 0;
        document.getElementById('totalApplicantsCount').textContent = data.totalApplicants || 0;
        document.getElementById('pendingApprovalCount').textContent = data.pendingApproval || 0;
        
        // Populate jobs table
        const tableBody = document.querySelector('#employerJobsTable tbody');
        tableBody.innerHTML = '';
        
        data.jobs.forEach(job => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHTML(job.title)}</td>
                <td>${job.applications}</td>
                <td><span class="badge ${getStatusBadgeClass(job.status)}">${job.status}</span></td>
                <td>${new Date(job.posted_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewJobApplications(${job.id})">
                        <i class="fas fa-users me-1"></i> View Applicants
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    })
    .catch(error => {
        console.error('Dashboard error:', error);
        showToast('Error', 'Failed to load dashboard data', 'error');
    });
}

function getStatusBadgeClass(status) {
    const statusClasses = {
        'active': 'bg-success',
        'pending': 'bg-warning',
        'closed': 'bg-secondary'
    };
    return statusClasses[status] || 'bg-primary';
}
document.getElementById('postJobForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('jobTitle').value,
        company: 'Your Company', // Or get from user profile
        description: document.getElementById('jobDescription').value,
        location: document.getElementById('jobLocation').value,
        type: document.getElementById('jobType').value,
        salary: document.getElementById('jobSalary').value,
        requirements: document.getElementById('jobRequirements').value,
        benefits: document.getElementById('jobBenefits').value
    };

    // Show loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Posting...';

    fetch('post_job.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane me-1"></i> Post Job';
        
        if (!response.ok) throw new Error('Posting failed');
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showToast('Success', 'Job posted successfully!', 'success');
            // Close modal
            const postJobModal = bootstrap.Modal.getInstance(document.getElementById('postJobModal'));
            postJobModal.hide();
            // Refresh employer dashboard
            showPage('employer-dashboard');
        } else {
            showToast('Error', data.message || 'Failed to post job', 'error');
        }
    })
    .catch(error => {
        console.error('Post job error:', error);
        showToast('Error', 'Failed to post job', 'error');
    });
});

// Define the login handler function
async function handleLogin(event) {
    event.preventDefault();
    console.log('Login form submitted');
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    try {
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Signing in...';
        
        // Get form data
        const email = form.querySelector('#loginEmail').value;
        const password = form.querySelector('#loginPassword').value;
        
        console.log('Attempting login for email:', email);
        
        const response = await fetch('login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
            credentials: 'same-origin'
        });
        
        console.log('Login response status:', response.status);
        const data = await response.json();
        console.log('Login response data:', data);
        
        if (data.success) {
            // Update client-side state
            currentUser = {
                firstName: data.userName,
                email: email,
                type: data.accountType
            };
            userType = data.accountType;
            
            // Store in localStorage for persistence
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('userType', userType);
            
            // Update UI
            document.getElementById('userProfileName').textContent = data.userName;
            document.getElementById('authButtons').style.display = 'none';
            document.getElementById('userProfile').style.display = 'block';
            
            // Initialize role-based UI
            initializeRoleBasedUI();
            
            showToast('Login Successful', `Welcome back, ${data.userName}!`, 'success');
            
            // Check session state after login
            try {
                const sessionCheck = await fetch('check_session.php', {
                    credentials: 'same-origin'
                });
                const sessionData = await sessionCheck.json();
                console.log('Session check after login:', sessionData);
                
                if (sessionData.loggedIn) {
                    // Always redirect to home page after successful login
                    showPage('home');
                } else {
                    console.error('Session not maintained after login');
                    showToast('Error', 'Session not maintained. Please try again.', 'error');
                }
            } catch (sessionError) {
                console.error('Session check error:', sessionError);
                showToast('Error', 'Failed to verify session. Please try again.', 'error');
            }
        } else {
            console.error('Login failed:', data.message);
            showToast('Login Failed', data.message || 'Invalid credentials', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Error', 'Login failed. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// Remove the old event listener
document.getElementById("loginForm")?.removeEventListener("submit", handleLogin);

function handleLogout() {
    fetch('logout.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'logout=true'
    })
    .then(response => {
        if (!response.ok) throw new Error('Logout failed');
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Clear all client-side storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Reset client-side state
            currentUser = null;
            userType = null;
            
            // Update UI
            document.getElementById('authButtons').style.display = 'flex';
            document.getElementById('userProfile').style.display = 'none';
            document.getElementById('userProfileName').textContent = '';
            
            // Reset role-based UI
            document.querySelectorAll('.role-employer, .role-jobseeker').forEach(el => {
                el.style.display = 'none';
            });
            
            showToast('Logged Out', 'You have been successfully logged out.', 'success');
            showPage('home');
        } else {
            showToast('Error', data.message || 'Logout failed', 'error');
        }
    })
    .catch(error => {
        console.error('Logout error:', error);
        showToast('Error', 'Logout failed. Please try again.', 'error');
    });
}
