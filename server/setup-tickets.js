#!/usr/bin/env node

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupTicketDatabase() {
  console.log('🎫 Setting up Ticket Management System...\n');

  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'corporate_mis'
    });

    console.log('✅ Connected to database');

    // Read and execute ticket schema
    const schemaPath = path.join(__dirname, 'database', 'ticket-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log('📊 Creating ticket management tables...');

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
        } catch (error) {
          if (error.code !== 'ER_TABLE_EXISTS_ERROR') {
            console.error(`❌ Error executing statement: ${error.message}`);
            console.error(`Statement: ${statement.substring(0, 100)}...`);
          }
        }
      }
    }

    console.log('\n🎉 Ticket Management System setup completed successfully!');
    console.log('\n📋 What was created:');
    console.log('• Ticket categories (Hardware, Software, Network, etc.)');
    console.log('• Ticket priorities (Low, Medium, High, Critical)');
    console.log('• Ticket statuses (New, Open, In Progress, etc.)');
    console.log('• Support teams and team members');
    console.log('• SLA rules and escalation rules');
    console.log('• Knowledge base structure');
    console.log('\n🚀 You can now use the ticket management system!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run setup
setupTicketDatabase();
