const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'corporate_mis'
};

async function testDatabase() {
  let connection;
  
  try {
    console.log('🔍 Testing database connection and tables...\n');
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Check if tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📊 Tables found:', tables.map(t => Object.values(t)[0]));
    
    // Check users table
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log('👥 Users count:', users[0].count);
    
    // Check if admin user exists
    const [adminUser] = await connection.execute('SELECT username, role FROM users WHERE username = ?', ['admin']);
    if (adminUser.length > 0) {
      console.log('🔐 Admin user found:', adminUser[0]);
    } else {
      console.log('❌ Admin user not found');
    }
    
    // Test a simple query
    const [departments] = await connection.execute('SELECT COUNT(*) as count FROM departments');
    console.log('🏢 Departments count:', departments[0].count);
    
    console.log('\n✅ Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Error code:', error.code);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testDatabase();
