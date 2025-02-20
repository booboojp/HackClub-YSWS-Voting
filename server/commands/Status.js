const Command = require(`../utils/Command.js`);
const supabase = require(`../database/supabase.js`);

class StatusCommand extends Command {
    constructor() {
        super({
            name: `status`,
            aliases: [`whoami`],
            params: [],
            requiresAuth: false,
            description: `Check authentication status`
        });
    }

    async execute(params, req) {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();

            if (!user || error) {
                return {
                    success: true,
                    result: `Not authenticated - Type 'login' to authenticate with Slack`
                };
            }

            const displayName = user.user_metadata?.name ||
                user.user_metadata?.preferred_username ||
                user.email ||
                'Unknown User';

            return {
                success: true,
                result: `Authenticated as ${displayName}`
            };
        } catch (error) {
            console.error(`Status check failed:`, error);
            return {
                success: false,
                error: `Failed to check authentication status`
            };
        }
    }
}

module.exports = StatusCommand;
