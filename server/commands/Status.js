const Command = require(`../utils/Command.js`);

class StatusCommand extends Command {
	constructor() {
		super({
			name: `status`,
			aliases: [`whoami`, `auth`],
			params: [],
			requiresAuth: false,
			description: `Check your current authentication status`
		});
	}

	async execute(params, req) {
		if (!req.session) {
			return {
				success: true,
				result: `No active session`
			};
		}

		return {
			success: true,
			result: req.session.auth ?
				`Authenticated as ${req.session.auth.userName} (${req.session.auth.userId})\nTeam: ${req.session.auth.teamName}` :
				`Not authenticated`
		};
	}
}

module.exports = StatusCommand;
