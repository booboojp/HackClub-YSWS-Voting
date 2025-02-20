const { createClient } = require(`@supabase/supabase-js`);
require(`dotenv`).config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY)
    throw new Error(`Missing SUPABASE_URL or SUPABASE_KEY environment variables`);

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            storage: {
                getItem: key => null,
                setItem: (key, value) => {},
                removeItem: key => {}
            }
        }
    }
);

module.exports = supabase;
