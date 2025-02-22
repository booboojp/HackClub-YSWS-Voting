const Command = require(`../utils/Command`);
const supabase = require(`../database/supabase`);

class LoginCommand extends Command {
    constructor() {
        super({
            name: `login`,
            aliases: [`signin`],
            params: [],
            requiresAuth: false,
            description: `Login with Slack`
        });
    }

    async execute(params, req) {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: `slack_oidc`,
            options: { redirectTo: process.env.SLACK_REDIRECT_URL }
        });
        if (error) throw error;
        return {
            success: true,
            result: `Redirecting to Slack login...`,
            redirect: data.url
        };
    }
}

module.exports = LoginCommand;
