const Command = require(`../utils/Command`);

class TestCommand extends Command {
    constructor() {
        super({
            name: `test`,
            aliases: [`t`],
            params: [],
            requiresAuth: true,
            description: `Echoes user info for testing`
        });
    }

    async execute(params, req) {
        if (!req.user) throw new Error(`User not authenticated`);
        const userId = req.user.id;
        const userName =
            req.user.user_metadata && req.user.user_metadata.name
                ? req.user.user_metadata.name
                : `Unknown`;
			return {
				success: true,
				result: `Authenticated as: ${req.user.email || req.user.user_metadata?.email || 'Unknown'}\nUser ID: ${req.user.id}`
			};
    }
}

module.exports = TestCommand;
