const validateParams = (command, requiredParams, providedParams) => {
	if (requiredParams.length > providedParams.length) {
		return {
			valid: false,
			error: `Missing parameters. Expected ${requiredParams.length}, got ${providedParams.length}`
		};
	}
	return { valid: true };
};

const parseCommand = (input) => {
	const parts = input.trim().split(` `);
	const command = parts[0].toLowerCase();
	const params = parts.slice(1);

	return {
		command,
		params,
		raw: input
	};
};

module.exports = { validateParams, parseCommand };
