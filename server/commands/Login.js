const Command = require(`../utils/Command.js`);
const supabase = require(`../database/supabase.js`);

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
			options: {
				redirectTo: `${process.env.CLIENT_URL}/auth/callback`
			}
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
