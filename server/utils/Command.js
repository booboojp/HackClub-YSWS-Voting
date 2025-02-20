const supabase = require('../database/supabase');

class Command {
	constructor(options = {}) {
		this.name = options.name || ``;
		this.aliases = options.aliases || [];
		this.params = options.params || [];
		this.requiresAuth = options.requiresAuth || false;
		this.description = options.description || `No description provided`;
	}

	async beforeExecute(req) {
		if (this.requiresAuth) {
			const { data: { user }, error } = await supabase.auth.getUser();
			if (error || !user) {
				throw new Error('Authentication required');
			}
			req.user = user;
		}
		return true;
	}

	async execute(params, req) {
		throw new Error(`Command must implement execute method`);
	}

	async afterExecute(success) {
		return true;
	}
}

module.exports = Command;
