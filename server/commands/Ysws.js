const Command = require(`../utils/Command.js`);
const supabase = require(`../database/supabase`);

class YSWSCommand extends Command {
	constructor() {
		super({
			name: `ysws`,
			aliases: [`project`, `p`],
			params: [`action`],
			requiresAuth: true,
			description: `Manage YSWS projects. Actions: create, search, list`
		});
	}

	async beforeExecute(req) {
		if (!supabase.auth.getUser()) {
			throw new Error('Not authenticated with Supabase');
		}
		await super.beforeExecute(req);
	}

	async execute(params, req) {
		const [action, ...rest] = params;

		switch (action) {
		case `create`: {
			if (rest.length < 2) {
				return { success: false, result: `Usage: ysws create <title> <description> [tags...]` };
			}

			const [title, description, ...tags] = rest;
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

		case `search`:
		case `list`: {
			const [tag] = rest;
			const results = await this.supabase.from(`ysws`).select(`*`).eq(`tags`, tag).eq(`status`, `ideation`);

			if (!results.items.length) {
				return { success: true, result: `No projects found` };
			}

			const output = results.items
				.map(y => `${y.id}: ${y.title} [${y.votes?.length || 0}⭐]`)
				.join(`\n`);

			return { success: true, result: output };
		}

		default:
			return { success: false, result: `Unknown action: ${action}` };
		}
	}
}
module.exports = YSWSCommand;
