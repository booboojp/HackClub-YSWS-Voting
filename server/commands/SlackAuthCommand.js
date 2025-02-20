const Command = require(`../utils/Command`);
const supabase = require(`../database/supabase`);

class SlackAuthCommand extends Command {
    constructor() {
        super({
            name: `slackauth`,
            aliases: [],
            params: [],
            requiresAuth: false,
            description: `Initiate Slack authentication`
        });
    }

    async execute(params, req) {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: `slack_oidc`,
            options: { redirectTo: process.env.SLACK_REDIRECT_URI }
        });
        if (error) throw error;
        return {
            success: true,
            result: `Redirecting to Slack auth...`,
            redirect: data.url
        };
    }
}

module.exports = SlackAuthCommand;
