const Command = require(`../utils/Command.js`);

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
		if (req.session?.auth) {
			throw new Error(`Already authenticated`);
		}

		return {
			success: true,
			result: `Redirecting to Slack login...`,
			redirect: `http://localhost:8080/auth/slack`
		};
	}
}

module.exports = LoginCommand;
