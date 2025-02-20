const Command = require('../utils/Command.js');
const supabase = require('../database/supabase.js');

class LoginCommand extends Command {
    constructor() {
        super({
            name: 'login',
            aliases: ['signin'],
            params: [],
            requiresAuth: false,
            description: 'Login with Slack'
        });
    }

    async execute(params, req) {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'slack_oidc',
                options: {
                    //redirectTo: `${process.env.CLIENT_URL}/auth/callback`,
					redirectTo: `${process.env.SLACK_REDIRECT_URI}`,
                }
            });

            if (error) throw error;
            console.log(`Login Link successful:`, data);
            return {
                success: true,
                result: 'Redirecting to Slack login...',
                redirect: data.url
            };
        } catch (error) {
            return {
                success: false,
                error: `Login failed: ${error.message}`
            };
        }
    }
}
module.exports = LoginCommand;
