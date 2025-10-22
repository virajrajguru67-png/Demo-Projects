-- Ticket Management System Database Schema
-- Corporate MIS - Ticket Management Module

-- Ticket Categories
CREATE TABLE IF NOT EXISTS ticket_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Ticket Priorities
CREATE TABLE IF NOT EXISTS ticket_priorities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    level INT NOT NULL UNIQUE, -- 1=Low, 2=Medium, 3=High, 4=Critical
    color VARCHAR(7) DEFAULT '#6B7280',
    sla_hours INT DEFAULT 72, -- SLA in hours
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Ticket Statuses
CREATE TABLE IF NOT EXISTS ticket_statuses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6B7280',
    is_final BOOLEAN DEFAULT FALSE, -- TRUE for Closed, Resolved
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Support Teams
CREATE TABLE IF NOT EXISTS support_teams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    email VARCHAR(255),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Support Team Members
CREATE TABLE IF NOT EXISTS support_team_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('member', 'lead', 'admin') DEFAULT 'member',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES support_teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_team_user (team_id, user_id)
);

-- Main Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_number VARCHAR(20) NOT NULL UNIQUE, -- TKT-2024-001
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_id INT NOT NULL,
    priority_id INT NOT NULL,
    status_id INT NOT NULL,
    requester_id INT NOT NULL, -- User who created the ticket
    assignee_id INT, -- Assigned support agent
    team_id INT, -- Assigned support team
    department_id INT, -- Requester's department
    
    -- SLA Tracking
    sla_due_date TIMESTAMP,
    first_response_date TIMESTAMP,
    resolution_date TIMESTAMP,
    
    -- Escalation
    escalation_level INT DEFAULT 0,
    escalated_at TIMESTAMP NULL,
    escalated_to INT NULL,
    
    -- Metadata
    source ENUM('web', 'email', 'phone', 'chat') DEFAULT 'web',
    tags JSON, -- ["urgent", "hardware", "laptop"]
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    
    -- Foreign Keys
    FOREIGN KEY (category_id) REFERENCES ticket_categories(id),
    FOREIGN KEY (priority_id) REFERENCES ticket_priorities(id),
    FOREIGN KEY (status_id) REFERENCES ticket_statuses(id),
    FOREIGN KEY (requester_id) REFERENCES users(id),
    FOREIGN KEY (assignee_id) REFERENCES users(id),
    FOREIGN KEY (team_id) REFERENCES support_teams(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (escalated_to) REFERENCES users(id),
    
    -- Indexes
    INDEX idx_ticket_number (ticket_number),
    INDEX idx_requester (requester_id),
    INDEX idx_assignee (assignee_id),
    INDEX idx_status (status_id),
    INDEX idx_priority (priority_id),
    INDEX idx_category (category_id),
    INDEX idx_created_at (created_at),
    INDEX idx_sla_due (sla_due_date)
);

-- Ticket Attachments
CREATE TABLE IF NOT EXISTS ticket_attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    
    INDEX idx_ticket (ticket_id)
);

-- Ticket Comments/Updates
CREATE TABLE IF NOT EXISTS ticket_comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- Internal notes vs public comments
    is_system BOOLEAN DEFAULT FALSE, -- System-generated comments
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    
    INDEX idx_ticket (ticket_id),
    INDEX idx_created_at (created_at)
);

-- Ticket History/Audit Log
CREATE TABLE IF NOT EXISTS ticket_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    user_id INT,
    action VARCHAR(100) NOT NULL, -- "created", "assigned", "status_changed", "priority_changed"
    old_value TEXT,
    new_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    
    INDEX idx_ticket (ticket_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- SLA Rules
CREATE TABLE IF NOT EXISTS sla_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    priority_id INT,
    category_id INT,
    department_id INT,
    first_response_hours INT NOT NULL,
    resolution_hours INT NOT NULL,
    escalation_hours INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (priority_id) REFERENCES ticket_priorities(id),
    FOREIGN KEY (category_id) REFERENCES ticket_categories(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Escalation Rules
CREATE TABLE IF NOT EXISTS escalation_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    priority_id INT,
    category_id INT,
    department_id INT,
    hours_overdue INT NOT NULL,
    escalate_to_user_id INT,
    escalate_to_team_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (priority_id) REFERENCES ticket_priorities(id),
    FOREIGN KEY (category_id) REFERENCES ticket_categories(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (escalate_to_user_id) REFERENCES users(id),
    FOREIGN KEY (escalate_to_team_id) REFERENCES support_teams(id)
);

-- Knowledge Base Articles
CREATE TABLE IF NOT EXISTS knowledge_articles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category_id INT,
    tags JSON,
    author_id INT NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    helpful_count INT DEFAULT 0,
    not_helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES ticket_categories(id),
    FOREIGN KEY (author_id) REFERENCES users(id),
    
    INDEX idx_published (is_published),
    INDEX idx_category (category_id),
    INDEX idx_created_at (created_at)
);

-- Insert Default Data
INSERT INTO ticket_categories (name, description, color) VALUES
('Hardware', 'Computer hardware issues', '#EF4444'),
('Software', 'Software application problems', '#3B82F6'),
('Network', 'Network connectivity issues', '#10B981'),
('Access', 'User access and permissions', '#F59E0B'),
('Email', 'Email system issues', '#8B5CF6'),
('General', 'General IT support', '#6B7280');

INSERT INTO ticket_priorities (name, level, color, sla_hours) VALUES
('Low', 1, '#10B981', 168), -- 7 days
('Medium', 2, '#F59E0B', 72), -- 3 days
('High', 3, '#EF4444', 24), -- 1 day
('Critical', 4, '#DC2626', 4); -- 4 hours

INSERT INTO ticket_statuses (name, description, color, is_final) VALUES
('New', 'Newly created ticket', '#6B7280', FALSE),
('Open', 'Ticket is open and being processed', '#3B82F6', FALSE),
('In Progress', 'Work is actively being done', '#F59E0B', FALSE),
('Pending User', 'Waiting for user response', '#8B5CF6', FALSE),
('Pending Vendor', 'Waiting for vendor response', '#EC4899', FALSE),
('Resolved', 'Issue has been resolved', '#10B981', TRUE),
('Closed', 'Ticket is closed', '#6B7280', TRUE),
('Cancelled', 'Ticket was cancelled', '#EF4444', TRUE);

INSERT INTO support_teams (name, description, email) VALUES
('IT Support', 'General IT support team', 'itsupport@company.com'),
('Network Team', 'Network infrastructure team', 'network@company.com'),
('Security Team', 'Information security team', 'security@company.com'),
('Hardware Team', 'Hardware support team', 'hardware@company.com');

-- Insert SLA Rules
INSERT INTO sla_rules (name, priority_id, first_response_hours, resolution_hours, escalation_hours) VALUES
('Critical Priority SLA', 4, 1, 4, 2),
('High Priority SLA', 3, 4, 24, 12),
('Medium Priority SLA', 2, 8, 72, 36),
('Low Priority SLA', 1, 24, 168, 84);

-- Insert Escalation Rules
INSERT INTO escalation_rules (name, priority_id, hours_overdue, escalate_to_team_id) VALUES
('Critical Escalation', 4, 2, 1),
('High Escalation', 3, 12, 1),
('Medium Escalation', 2, 36, 1),
('Low Escalation', 1, 84, 1);
