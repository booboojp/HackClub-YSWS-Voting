const Command = require(`../utils/Command.js`);

class LogoutCommand extends Command {
	constructor() {
		super({
			name: `logout`,
			aliases: [`signout`],
			params: [],
			requiresAuth: true,
			description: `Logout from your current session`
		});
	}

	async execute(params, req) {
		await new Promise((resolve, reject) => {
			req.session.destroy((err) => {
				if (err) reject(err);
				resolve();
			});
		});

		return {
			success: true,
			result: `Successfully logged out`
		};
	}
}

module.exports = LogoutCommand;
