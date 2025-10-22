const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'corporate_mis'
};

async function createTables() {
  let connection;
  
  try {
    console.log('🔧 Creating Corporate MIS database tables...\n');
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');
    
    // Create departments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Departments table created');
    
    // Create employees table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        employee_id VARCHAR(20) UNIQUE NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        department_id INT,
        position VARCHAR(100),
        hire_date DATE,
        salary DECIMAL(10,2),
        status ENUM('active', 'inactive', 'terminated') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Employees table created');
    
    // Create projects table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        status ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled') DEFAULT 'planning',
        priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
        start_date DATE,
        end_date DATE,
        budget DECIMAL(15,2),
        project_manager_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_manager_id) REFERENCES employees(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Projects table created');
    
    // Create project assignments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS project_assignments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        project_id INT NOT NULL,
        employee_id INT NOT NULL,
        role VARCHAR(100),
        allocation_percentage DECIMAL(5,2) DEFAULT 100.00,
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        UNIQUE KEY unique_assignment (project_id, employee_id)
      )
    `);
    console.log('✅ Project assignments table created');
    
    // Create asset categories table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS asset_categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Asset categories table created');
    
    // Create assets table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS assets (
        id INT PRIMARY KEY AUTO_INCREMENT,
        asset_tag VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        category_id INT,
        brand VARCHAR(100),
        model VARCHAR(100),
        serial_number VARCHAR(100),
        purchase_date DATE,
        purchase_price DECIMAL(10,2),
        status ENUM('available', 'assigned', 'maintenance', 'retired') DEFAULT 'available',
        location VARCHAR(200),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES asset_categories(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Assets table created');
    
    // Create asset assignments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS asset_assignments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        asset_id INT NOT NULL,
        employee_id INT NOT NULL,
        assigned_date DATE NOT NULL,
        return_date DATE,
        status ENUM('active', 'returned') DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Asset assignments table created');
    
    // Insert default data
    console.log('\n📝 Inserting default data...');
    
    // Insert departments
    await connection.execute(`
      INSERT IGNORE INTO departments (name, description) VALUES
      ('IT', 'Information Technology Department'),
      ('HR', 'Human Resources Department'),
      ('Finance', 'Finance and Accounting Department'),
      ('Operations', 'Operations Department')
    `);
    console.log('✅ Default departments inserted');
    
    // Insert asset categories
    await connection.execute(`
      INSERT IGNORE INTO asset_categories (name, description) VALUES
      ('Laptop', 'Laptop computers and notebooks'),
      ('Desktop', 'Desktop computers and workstations'),
      ('Software', 'Software licenses and applications'),
      ('Peripheral', 'Keyboards, mice, monitors, etc.'),
      ('Network', 'Network equipment and accessories')
    `);
    console.log('✅ Default asset categories inserted');
    
    // Insert admin user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await connection.execute(`
      INSERT IGNORE INTO users (username, email, password_hash, role) VALUES
      ('admin', 'admin@company.com', ?, 'admin')
    `, [hashedPassword]);
    console.log('✅ Admin user created');
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('🔐 Default login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createTables();
