-- Create database
CREATE DATABASE IF NOT EXISTS attendance_management;
USE attendance_management;

-- Users table
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(100),
    role ENUM('employee', 'student', 'teacher', 'admin') DEFAULT 'employee',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Shifts table
CREATE TABLE shifts (
    shift_id INT PRIMARY KEY AUTO_INCREMENT,
    shift_name VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave requests table
CREATE TABLE leave_requests (
    leave_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    leave_type ENUM('Sick', 'Annual', 'Emergency', 'Personal', 'Maternity') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Attendance records table
CREATE TABLE attendance_records (
    attendance_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    check_in_time DATETIME,
    check_out_time DATETIME,
    status ENUM('Present', 'Absent', 'Late', 'On Leave', 'Half-day') DEFAULT 'Absent',
    shift_id INT,
    work_hours DECIMAL(5,2) DEFAULT 0.00,
    overtime_hours DECIMAL(5,2) DEFAULT 0.00,
    remarks VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES shifts(shift_id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_date (user_id, date)
);

-- Insert sample data
INSERT INTO users (full_name, email, department, role) VALUES
('John Doe', 'john.doe@company.com', 'Engineering', 'employee'),
('Jane Smith', 'jane.smith@company.com', 'HR', 'employee'),
('Mike Johnson', 'mike.johnson@company.com', 'Marketing', 'employee'),
('Sarah Wilson', 'sarah.wilson@company.com', 'Engineering', 'teacher'),
('Admin User', 'admin@company.com', 'Administration', 'admin');

INSERT INTO shifts (shift_name, start_time, end_time) VALUES
('Morning', '09:00:00', '17:00:00'),
('Evening', '14:00:00', '22:00:00'),
('Night', '22:00:00', '06:00:00'),
('Flexible', '08:00:00', '18:00:00');

INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, status, reason) VALUES
(1, 'Sick', '2024-12-20', '2024-12-22', 'Approved', 'Flu symptoms'),
(2, 'Annual', '2024-12-25', '2024-12-30', 'Pending', 'Christmas vacation'),
(3, 'Emergency', '2024-12-15', '2024-12-15', 'Approved', 'Family emergency');

INSERT INTO attendance_records (user_id, date, check_in_time, check_out_time, status, shift_id, work_hours, overtime_hours, remarks) VALUES
(1, '2024-12-01', '2024-12-01 09:00:00', '2024-12-01 17:30:00', 'Present', 1, 8.50, 0.50, 'Normal day'),
(2, '2024-12-01', '2024-12-01 09:15:00', '2024-12-01 17:00:00', 'Late', 1, 7.75, 0.00, 'Traffic delay'),
(3, '2024-12-01', NULL, NULL, 'Absent', 1, 0.00, 0.00, 'Sick leave'),
(1, '2024-12-02', '2024-12-02 08:45:00', '2024-12-02 17:15:00', 'Present', 1, 8.50, 0.50, 'Early arrival'),
(2, '2024-12-02', '2024-12-02 09:00:00', '2024-12-02 17:00:00', 'Present', 1, 8.00, 0.00, 'On time');
