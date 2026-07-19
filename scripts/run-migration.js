const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read env
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#') && line.includes('=')) {
    const [key, ...valueParts] = line.split('=');
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = supabaseUrl.split('//')[1].split('.')[0];

// Try different connection methods
const connectionStrings = [
  // Direct connection
  {
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: serviceKey,
    ssl: { rejectUnauthorized: false }
  },
  // Pooler connection (transaction mode)
  {
    host: `aws-0-ap-southeast-1.pooler.supabase.com`,
    port: 6543,
    database: 'postgres',
    user: `postgres.${projectRef}`,
    password: serviceKey,
    ssl: { rejectUnauthorized: false }
  },
  // Pooler connection (session mode)
  {
    host: `aws-0-ap-southeast-1.pooler.supabase.com`,
    port: 5432,
    database: 'postgres',
    user: `postgres.${projectRef}`,
    password: serviceKey,
    ssl: { rejectUnauthorized: false }
  }
];

async function runMigration() {
  let client = null;
  
  for (const conn of connectionStrings) {
    try {
      console.log(`Trying connection to ${conn.host}:${conn.port}...`);
      client = new Client(conn);
      await client.connect();
      console.log('✓ Connected!');
      break;
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message}`);
      client = null;
    }
  }
  
  if (!client) {
    console.error('Could not connect to any database');
    return;
  }
  
  try {
    // Read migration SQL
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migration-for-dashboard.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL into statements
    const statements = sql.split(';').filter(s => s.trim().length > 0);
    
    console.log(`\nFound ${statements.length} SQL statements`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;
      
      try {
        console.log(`\nExecuting statement ${i + 1}...`);
        await client.query(statement);
        console.log(`  ✓ Success`);
      } catch (error) {
        console.log(`  ⚠ Error: ${error.message}`);
      }
    }
    
    console.log('\n✓ Migration completed!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

runMigration();
