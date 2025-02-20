class Command {
	constructor(options = {}) {
		this.name = options.name || ``;
		this.aliases = options.aliases || [];
		this.requiresAuth = options.requiresAuth || false;
		this.description = options.description || `No description provided`;

		// Action registry
		this.actions = new Map();
		this.defaultAction = null;
	}

	// Register an action with its parameters and execution logic
	registerAction(name, config) {
		this.actions.set(name, {
			params: config.params || [],
			execute: config.execute,
			usage: config.usage || `No usage information provided`,
			validate: config.validate || (() => true)
		});
		return this;
	}

	// Set a default action when none is specified
	setDefaultAction(name) {
		if (!this.actions.has(name)) {
			throw new Error(`Cannot set default action - ${name} not registered`);
		}
		this.defaultAction = name;
		return this;
	}

	async beforeExecute(req) {
		// Command-level pre-execution hook
	}

	async execute(params, req) {
		const [actionName = this.defaultAction, ...actionParams] = params;

		const action = this.actions.get(actionName);
		if (!action) {
			const availableActions = [...this.actions.keys()].join(`, `);
			return {
				success: false,
				result: `Invalid action. Available actions: ${availableActions}`
			};
		}

		try {
			// Validate action parameters
			const validationResult = await action.validate(actionParams, req);
			if (validationResult !== true) {
				return {
					success: false,
					result: validationResult || action.usage
				};
			}

			// Execute action
			return await action.execute(actionParams, req);

		} catch (error) {
			return {
				success: false,
				result: error.message || action.usage
			};
		}
	}

	async afterExecute(success) {
		// Command-level post-execution hook
	}
}

module.exports = Command;
