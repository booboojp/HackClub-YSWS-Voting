const { createServerSupabaseClient } = require('@supabase/auth-helpers-nextjs');

const authMiddleware = async (req, res, next) => {
    const supabase = createServerSupabaseClient({ req, res });
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Please authenticate first'
            });
        }

        req.session = session;
        req.supabase = supabase;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Authentication failed' });
    }
};

module.exports = authMiddleware;
