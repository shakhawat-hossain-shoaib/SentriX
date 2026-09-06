const { initDatabase, query } = require('../config/db');

async function seed() {
  console.log('[Seed] Initializing database and verifying seed data...');
  await initDatabase();
  const [userCount] = await query('SELECT count(*) as count FROM users');
  const [incCount] = await query('SELECT count(*) as count FROM incidents');
  console.log(`[Seed] Database ready. Current users: ${userCount[0]?.count || 0}, incidents: ${incCount[0]?.count || 0}`);
  process.exit(0);
}

seed().catch(err => {
  console.error('[Seed Error]:', err);
  process.exit(1);
});
