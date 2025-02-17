class Command {
	constructor(options = {}) {
		this.name = options.name || ``;
		this.aliases = options.aliases || [];
		this.params = options.params || [];
		this.requiresAuth = options.requiresAuth || false;
		this.description = options.description || `No description provided`;
	}

	async beforeExecute(req) {
		if (this.requiresAuth && !req.session?.auth) {
			throw new Error(`Authentication required`);
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
