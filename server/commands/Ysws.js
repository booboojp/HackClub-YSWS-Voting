const Command = require(`../utils/Command.js`);
const pbClient = require(`../database/pocketbase`);

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
		console.log('RUNNING BEFORE EXEC!!!')
		this.pb = pbClient.getInstance();
		if (!this.pb.authStore.isValid) {
			throw new Error(`Not authenticated with PocketBase`);
		}

		try {
			await this.pb.collections.getOne(`ysws`);
		} catch (error) {
			if (error.status === 404) {
				await this.pb.collections.create({
					name: `ysws`,
					type: `base`,
					schema: [
						{
							name: `title`,
							type: `text`,
							required: true
						},
						{
							name: `description`,
							type: `text`,
							required: true
						},
						{
							name: `tags`,
							type: `json`,
							required: false
						},
						{
							name: `creator`,
							type: `text`,
							required: true
						},
						{
							name: `status`,
							type: `text`,
							required: true
						},
						{
							name: `votes`,
							type: `json`,
							required: false
						}
					]
				});
			} else {
				throw error;
			}
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
			const results = await this.pb.collection(`ysws`).getList(1, 10, {
				filter: tag ? `tags ~ "${tag}"` : ``,
				sort: `-created`
			});

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
