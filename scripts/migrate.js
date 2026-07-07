const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function runMigration() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '20260707000001_user_progress.sql'), 'utf8');
  
  const res = await fetch('https://gsnuqrutiauhnsacgzym.supabase.co/rest/v1/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sql',
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Prefer': 'tx=open'
    },
    body: sql
  });

  const text = await res.text();
  console.log('Status:', res.status);
  if (res.ok) {
    console.log('✅ Migration completed successfully!');
  } else {
    console.log('❌ Error:', text.substring(0, 500));
  }
}

runMigration().catch(console.error);
