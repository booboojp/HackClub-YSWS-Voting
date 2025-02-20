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
		const { data: { user }, error } = await supabase.auth.getUser();

		if (error) return {
			success: true,
			result: `Error fetching authentication status: ${error.message}`
		};

		return {
			success: true,
			result: user ?
				`Authenticated as ${user.user_metadata.full_name || user.user_metadata.name} (${user.id})` :
				`Not authenticated - Type 'login' to authenticate with Slack`
		};
	}
}

module.exports = StatusCommand;
