const Command = require(`../utils/Command`);
const { createClient } = require(`@supabase/supabase-js`);

class TestTableCommand extends Command {
    constructor() {
        super({
            name: `ctt`,
            aliases: [`testtable`],
            params: [],
            requiresAuth: true,
            description: `Creates a test entry in YSWS table`
        });
    }

    async execute(params, req) {
        if (!req.user) throw new Error(`User not authenticated`);

        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new Error('Valid auth token required');
        }

        // Create a new Supabase client with auth context
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_KEY,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                },
                global: {
                    headers: {
                        Authorization: authHeader
                    }
                }
            }
        );

        const testEntry = {
            title: `Test Project`,
            author: `Test Author`,
            description: `Test Description`,
            slack_channel: `#test-channel`,
            likes: 0,
            pledges: 0,
            website_url: `https://example.com`,
            author_skill_show_repository: `https://github.com/test/repo`,
            demo_project_data: '2',
            project_tier: 1,
            icon_url: `https://example.com/icon.png`,
            banner_url: `https://example.com/banner.png`,
            creator: req.user.id
        };

        try {
            const { data, error } = await supabase
                .from(`ysws`)
                .insert(testEntry)
                .select()
                .single();
			if (error.message = `duplicate key value violates unique constraint "ysws_slack_channel_key"` && error.code === '23505') {
				return {
					success: false,
					result: `You already have one running YSWS project.`
				};
			}
            if (!data) throw new Error(`No data returned`);

            return {
                success: true,
                result: `Entry created: ${JSON.stringify(data)}`
            };
        } catch (err) {
            console.error(`Insert error:`, err);
            throw new Error(`Failed to create entry: ${err.message}`);
        }
    }
}

module.exports = TestTableCommand;
