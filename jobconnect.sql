-- Database structure for JobConnect

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    location VARCHAR(100),
    experience INT,
    skills TEXT,
    education VARCHAR(100),
    password VARCHAR(255),
    account_type ENUM('jobseeker', 'employer'),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add after existing users table

CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100),
    company VARCHAR(100),
    description TEXT,
    location VARCHAR(100),
    type ENUM('full-time', 'part-time', 'remote'),
    salary VARCHAR(50),
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT,
    user_id INT,
    status ENUM('pending', 'reviewed', 'interview', 'hired', 'rejected') DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
