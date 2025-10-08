#!/usr/bin/env node

/**
 * Database Setup Script for Hangout Planner
 * 
 * This script helps set up the Supabase database schema for the Hangout Planner app.
 * Run this after creating your Supabase project and before running the app.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Hangout Planner - Database Setup');
console.log('=====================================\n');

// Read the SQL schema file
const schemaPath = path.join(__dirname, 'fix-database-schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

console.log('📋 Database Schema to Apply:');
console.log('-----------------------------');
console.log(schema);
console.log('\n');

console.log('📝 Instructions:');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste the SQL above');
console.log('4. Click "Run" to execute the schema changes');
console.log('\n');

console.log('✅ After running the SQL:');
console.log('- Your members table will have the required clerk_user_id column');
console.log('- Indexes will be created for better performance');
console.log('- The app should work without database errors');
console.log('\n');

console.log('🔗 Supabase Dashboard: https://supabase.com/dashboard');
console.log('📚 Need help? Check the README.md for detailed setup instructions');
