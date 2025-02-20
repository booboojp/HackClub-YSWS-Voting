const { createClient } = require(`@supabase/supabase-js`);
require(`dotenv`).config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error(`Missing Supabase environment variables:
        SUPABASE_URL: ${supabaseUrl ? '✓' : '✗'}
        SUPABASE_KEY: ${supabaseKey ? '✓' : '✗'}`);
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
