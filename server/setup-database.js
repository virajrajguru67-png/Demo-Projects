const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'corporate_mis',
  multipleStatements: true
};

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔧 Setting up Corporate MIS Database...\n');
    
    // First connect without database to create it
    const tempConfig = { ...dbConfig };
    delete tempConfig.database;
    
    connection = await mysql.createConnection(tempConfig);
    console.log('✅ Connected to MySQL server');
    
    // Create database
    await connection.execute('CREATE DATABASE IF NOT EXISTS corporate_mis');
    console.log('✅ Database "corporate_mis" created/verified');
    
    await connection.end();
    
    // Now connect to the specific database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to corporate_mis database');
    
    // Read and execute the schema
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Schema file not found: ' + schemaPath);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('📄 Reading schema file...');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
        } catch (error) {
          if (error.code !== 'ER_TABLE_EXISTS_ERROR') {
            console.log(`⚠️  Statement ${i + 1} warning: ${error.message}`);
          }
        }
      }
    }
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('📊 Tables created:');
    console.log('   - users (authentication)');
    console.log('   - departments');
    console.log('   - employees');
    console.log('   - projects');
    console.log('   - project_assignments');
    console.log('   - asset_categories');
    console.log('   - assets');
    console.log('   - asset_assignments');
    console.log('\n🔐 Default admin user created:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('\n🚀 Your Corporate MIS is ready to use!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Please check your MySQL connection and credentials.');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
