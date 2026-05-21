const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    realtime: {
      // Disable realtime to avoid 'ws' module dependency on serverless
      params: { eventsPerSecond: 0 }
    },
    global: {
      headers: { 'x-my-custom-header': 'ilms-server' }
    }
  }
);

module.exports = supabase;
