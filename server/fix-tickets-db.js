#!/usr/bin/env node

const mysql = require("mysql2/promise");
require("dotenv").config();

async function fixTicketDatabase() {
  console.log("🔧 Fixing Ticket Management Database...\n");

  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "corporate_mis",
    });

    console.log("✅ Connected to database");

    // Create ticket categories table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ticket_categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        color VARCHAR(7) DEFAULT '#3B82F6',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Created ticket_categories table");

    // Create ticket priorities table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ticket_priorities (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL UNIQUE,
        level INT NOT NULL UNIQUE,
        color VARCHAR(7) DEFAULT '#6B7280',
        sla_hours INT DEFAULT 72,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Created ticket_priorities table");

    // Create ticket statuses table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ticket_statuses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        color VARCHAR(7) DEFAULT '#6B7280',
        is_final BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Created ticket_statuses table");

    // Create support teams table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS support_teams (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        email VARCHAR(255),
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Created support_teams table");

    // Create main tickets table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ticket_number VARCHAR(20) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category_id INT NOT NULL,
        priority_id INT NOT NULL,
        status_id INT NOT NULL,
        requester_id INT NOT NULL,
        assignee_id INT,
        team_id INT,
        department_id INT,
        sla_due_date TIMESTAMP NULL,
        first_response_date TIMESTAMP NULL,
        resolution_date TIMESTAMP NULL,
        escalation_level INT DEFAULT 0,
        escalated_at TIMESTAMP NULL,
        escalated_to INT NULL,
        source ENUM('web', 'email', 'phone', 'chat') DEFAULT 'web',
        tags JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        closed_at TIMESTAMP NULL,
        FOREIGN KEY (category_id) REFERENCES ticket_categories(id),
        FOREIGN KEY (priority_id) REFERENCES ticket_priorities(id),
        FOREIGN KEY (status_id) REFERENCES ticket_statuses(id),
        FOREIGN KEY (requester_id) REFERENCES users(id),
        FOREIGN KEY (assignee_id) REFERENCES users(id),
        FOREIGN KEY (team_id) REFERENCES support_teams(id),
        FOREIGN KEY (department_id) REFERENCES departments(id),
        FOREIGN KEY (escalated_to) REFERENCES users(id)
      )
    `);
    console.log("✅ Created tickets table");

    // Insert default data
    console.log("\n📊 Inserting default data...");

    // Insert categories
    await connection.execute(`
      INSERT IGNORE INTO ticket_categories (name, description, color) VALUES
      ('Hardware', 'Computer hardware issues', '#EF4444'),
      ('Software', 'Software application problems', '#3B82F6'),
      ('Network', 'Network connectivity issues', '#10B981'),
      ('Access', 'User access and permissions', '#F59E0B'),
      ('Email', 'Email system issues', '#8B5CF6'),
      ('General', 'General IT support', '#6B7280')
    `);
    console.log("✅ Inserted ticket categories");

    // Insert priorities
    await connection.execute(`
      INSERT IGNORE INTO ticket_priorities (name, level, color, sla_hours) VALUES
      ('Low', 1, '#10B981', 168),
      ('Medium', 2, '#F59E0B', 72),
      ('High', 3, '#EF4444', 24),
      ('Critical', 4, '#DC2626', 4)
    `);
    console.log("✅ Inserted ticket priorities");

    // Insert statuses
    await connection.execute(`
      INSERT IGNORE INTO ticket_statuses (name, description, color, is_final) VALUES
      ('New', 'Newly created ticket', '#6B7280', FALSE),
      ('Open', 'Ticket is open and being processed', '#3B82F6', FALSE),
      ('In Progress', 'Work is actively being done', '#F59E0B', FALSE),
      ('Pending User', 'Waiting for user response', '#8B5CF6', FALSE),
      ('Pending Vendor', 'Waiting for vendor response', '#EC4899', FALSE),
      ('Resolved', 'Issue has been resolved', '#10B981', TRUE),
      ('Closed', 'Ticket is closed', '#6B7280', TRUE),
      ('Cancelled', 'Ticket was cancelled', '#EF4444', TRUE)
    `);
    console.log("✅ Inserted ticket statuses");

    // Insert support teams
    await connection.execute(`
      INSERT IGNORE INTO support_teams (name, description, email) VALUES
      ('IT Support', 'General IT support team', 'itsupport@company.com'),
      ('Network Team', 'Network infrastructure team', 'network@company.com'),
      ('Security Team', 'Information security team', 'security@company.com'),
      ('Hardware Team', 'Hardware support team', 'hardware@company.com')
    `);
    console.log("✅ Inserted support teams");

    console.log(
      "\n🎉 Ticket Management Database setup completed successfully!"
    );
    console.log("🚀 The ticket management system is now ready to use!");
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run setup
fixTicketDatabase();
