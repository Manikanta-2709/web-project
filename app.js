// Handle user authentication and session management
const auth = {
    async login(email, password) {
        try {
            const response = await fetch('login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
            });
            const data = await response.json();
            if (data.success) {
                this.updateUI(data);
                showToast('success', 'Welcome back!', 'You have successfully logged in.');
            } else {
                showToast('error', 'Login Failed', data.message);
            }
            return data;
        } catch (error) {
            showToast('error', 'Error', 'An error occurred during login.');
            return { success: false, message: error.message };
        }
    },

    async register(formData) {
        try {
            const response = await fetch('register.php', {
                method: 'POST',
                body: new URLSearchParams(formData)
            });
            const data = await response.json();
            if (data.success) {
                showToast('success', 'Registration Successful', 'Your account has been created.');
                setTimeout(() => showPage('login'), 1500);
            } else {
                showToast('error', 'Registration Failed', data.message);
            }
            return data;
        } catch (error) {
            showToast('error', 'Error', 'An error occurred during registration.');
            return { success: false, message: error.message };
        }
    },

    async checkSession() {
        try {
            const response = await fetch('check_session.php');
            const data = await response.json();
            if (data.loggedIn) {
                this.updateUI(data);
            }
            return data;
        } catch (error) {
            console.error('Session check failed:', error);
            return { loggedIn: false };
        }
    },

    async logout() {
        try {
            await fetch('logout.php');
            location.reload();
        } catch (error) {
            showToast('error', 'Error', 'An error occurred during logout.');
        }
    },

    updateUI(userData) {
        document.getElementById('authButtons').style.display = 'none';
        document.getElementById('userProfile').style.display = 'block';
        document.getElementById('userProfileName').textContent = userData.userName;
        
        // Show/hide role-specific elements
        document.querySelectorAll('.role-employer').forEach(el => {
            el.style.display = userData.accountType === 'employer' ? 'block' : 'none';
        });
        document.querySelectorAll('.role-jobseeker').forEach(el => {
            el.style.display = userData.accountType === 'jobseeker' ? 'block' : 'none';
        });
    }
};

// Handle job-related operations
const jobs = {
    async search(keyword = '', location = '') {
        try {
            const response = await fetch(`search_jobs.php?keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`);
            return await response.json();
        } catch (error) {
            showToast('error', 'Error', 'Failed to fetch jobs.');
            return [];
        }
    },

    async apply(jobId) {
        try {
            const response = await fetch('apply_job.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ jobId })
            });
            const data = await response.json();
            if (data.success) {
                showToast('success', 'Application Submitted', 'Your job application has been submitted successfully.');
            } else {
                showToast('error', 'Application Failed', data.message);
            }
            return data;
        } catch (error) {
            showToast('error', 'Error', 'Failed to submit application.');
            return { success: false, message: error.message };
        }
    },

    async post(jobData) {
        try {
            const response = await fetch('post_job.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jobData)
            });
            const data = await response.json();
            if (data.success) {
                showToast('success', 'Job Posted', 'Your job has been posted successfully.');
            } else {
                showToast('error', 'Posting Failed', data.message);
            }
            return data;
        } catch (error) {
            showToast('error', 'Error', 'Failed to post job.');
            return { success: false, message: error.message };
        }
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check session status
    auth.checkSession();

    // Login form submission
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        await auth.login(email, password);
    });

    // Registration form submission
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        await auth.register(formData);
    });

    // Job search form submission
    document.getElementById('jobSearchForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const keyword = document.getElementById('jobSearchInput').value;
        const location = document.getElementById('locationInput').value;
        const jobs = await jobs.search(keyword, location);
        updateJobListings(jobs);
    });

    // Dark mode toggle
    document.querySelector('.dark-mode-toggle')?.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
    });
});

// Helper Functions
function showToast(type, title, message) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;

    const container = document.querySelector('.toast-container') || (() => {
        const cont = document.createElement('div');
        cont.className = 'toast-container';
        document.body.appendChild(cont);
        return cont;
    })();

    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showPage(pageId) {
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(`${pageId}-page`).classList.add('active');
}

function updateJobListings(jobs) {
    const container = document.querySelector('.job-listings');
    if (!container) return;

    container.innerHTML = jobs.map(job => `
        <div class="job-card card mb-3">
            <div class="card-body">
                <h5 class="card-title">${job.title}</h5>
                <h6 class="card-subtitle mb-2 text-muted">${job.company}</h6>
                <p class="card-text">${job.description}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="job-type ${job.type}">${job.type}</span>
                    <button class="btn btn-primary" onclick="jobs.apply(${job.id})">Apply Now</button>
                </div>
            </div>
        </div>
    `).join('');
}