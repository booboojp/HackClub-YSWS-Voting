const Command = require(`../utils/Command.js`);
const supabase = require(`../database/supabase.js`);

class StatusCommand extends Command {
    constructor() {
        super({
            name: `status`,
            aliases: [`whoami`],
            params: [],
            requiresAuth: false,
            description: `Check if you're authenticated with Slack via Supabase`
        });
    }

    async execute(params, req) {
        try {
            const authHeader = req.headers.authorization;
            if(!authHeader || !authHeader.startsWith(`Bearer `)) {
                return {
                    success: true,
                    result: `No, you're not authenticated with Slack`
                };
            }

            const token = authHeader.substring(7);
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if(error || !user) {
                return {
                    success: true,
                    result: `No, you're not authenticated with Slack`
                };
            }

            return {
                success: true,
                result: `Yes, you're authenticated with Slack`
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to check Slack authentication`
            };
        }
    }
}

module.exports = StatusCommand;
