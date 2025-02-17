const pb = require(`../database/pocketbase`);

class YSWS {
	static async create(data, userId) {
		if (!userId) throw new Error(`Unauthorized`);

		return await pb.collection(`ysws`).create({
			...data,
			creator: userId,
			status: `ideation`
		});
	}

	static async search({ tags, status, page = 1 }) {
		const filter = [];

		if (tags?.length) filter.push(`tags ?~ "${tags.join(`|`)}"`);
		if (status) filter.push(`status = "${status}"`);

		return await pb.collection(`ysws`).getList(page, 20, {
			filter: filter.join(` && `),
			sort: `-created`,
			expand: `votes`
		});
	}

	static async vote(id, userId) {
		const ysws = await pb.collection(`ysws`).getOne(id);
		const votes = new Set(ysws.votes);

		votes.has(userId) ? votes.delete(userId) : votes.add(userId);

		return await pb.collection(`ysws`).update(id, {
			votes: Array.from(votes)
		});
	}
}

module.exports = YSWS;
