const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!key) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  // Try using the REST API to execute SQL
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS journal_streak INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_journal_date DATE;
    `
  });

  if (error) {
    console.log('RPC exec_sql failed:', error.message);
    console.log('Trying direct approach...');
    // The table might already have some columns, try just the ones we need
    const { error: e2 } = await supabase
      .from('profiles')
      .update({ xp: 0 })
      .eq('user_id', '00000000-0000-0000-0000-000000000000');
    console.log('Test update result:', e2?.message || 'Columns exist');
    
    // If column doesn't exist, try via raw SQL
    const { error: e3 } = await supabase.rpc('exec', {
      query: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0;`
    });
    console.log('Alt query:', e3?.message || 'OK');
  } else {
    console.log('Migration completed successfully!');
  }
}

run().catch(console.error);
