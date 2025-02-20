const Command = require(`../utils/Command.js`);
const pbClient = require(`../database/pocketbase`);

class YSWSCommand extends Command {
	constructor() {
		super({
			name: `ysws`,
			aliases: [`project`, `p`],
			requiresAuth: true,
			description: `Manage YSWS projects`
		});

		this.pb = pbClient;

		// Register create action
		this.registerAction(`create`, {
			params: [`title`, `description`, `tags`],
			usage: `ysws create <title> <description> [tags...]`,
			validate: (params) => {
				if (params.length < 2) return `Title and description are required`;
				if (params[0].length < 3) return `Title must be at least 3 characters`;
				return true;
			},
			execute: async ([title, description, ...tags], req) => {
				const ysws = await this.pb.collection(`ysws`).create({
					title,
					description,
					tags: tags || [],
					creator: req.session.auth.userId,
					status: `ideation`,
					votes: []
				});
				return { success: true, result: `Created: ${ysws.id} - ${title}` };
			}
		});

		// Register search/list action
		this.registerAction(`search`, {
			params: [`tag`],
			usage: `ysws search [tag]`,
			execute: async ([tag], req) => {
				const results = await this.pb.collection(`ysws`).getList(1, 10, {
					filter: tag ? `tags ~ "${tag}"` : ``,
					sort: `-created`
				});
				return { success: true, result: results };
			}
		});

		// Set list as alias for search
		this.registerAction(`list`, {
			params: [`tag`],
			usage: `ysws list [tag]`,
			execute: async (params, req) => {
				const searchAction = this.actions.get(`search`);
				return searchAction.execute(params, req);
			}
		});

		// Set default action
		this.setDefaultAction(`list`);
	}
}

module.exports = YSWSCommand;
