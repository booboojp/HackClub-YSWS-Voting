const fs = require(`fs`);
const path = require(`path`);
const { validateParams } = require(`./utils/commandParser.js`);

class CommandExecutor {
	constructor() {
		this.commands = new Map();
		this.loadCommands();
	}

	loadCommands() {
		const commandsDir = path.join(__dirname, `commands`);
		console.log(`[CommandExecutor] Loading commands from ${commandsDir}`);

		fs.readdirSync(commandsDir).forEach(file => {
			if (!file.endsWith(`.js`)) return;

			try {
				const CommandClass = require(path.join(commandsDir, file));
				if (typeof CommandClass !== `function`) {
					console.error(`[CommandExecutor] Failed to load ${file}: Not a class/constructor`);
					return;
				}

				const command = new CommandClass();
				this.commands.set(command.name.toLowerCase(), command);

				command.aliases.forEach(alias => {
					this.commands.set(alias.toLowerCase(), command);
				});

				console.log(`[CommandExecutor] Loaded command: ${command.name} (aliases: ${command.aliases.join(`, `)}) from ${file}`);
			} catch (error) {
				console.error(`[CommandExecutor] Failed to load ${file}:`, error.message);
			}
		});

		console.log(`[CommandExecutor] Loaded ${this.getCommands().length} commands`);
	}

	async execute(command, params, req) {
		const cmd = this.commands.get(command.toLowerCase());
		if (!cmd) {
			console.error(`[CommandExecutor] Unknown command: ${command}`);
			throw new Error(`Unknown command: ${command}`);
		}

		console.log(`[CommandExecutor] Executing command: ${command} with params:`, params);

		const validation = validateParams(command, cmd.params, params);
		if (!validation.valid) {
			console.error(`[CommandExecutor] Validation failed for ${command}:`, validation.error);
			throw new Error(validation.error);
		}

		try {
			await cmd.beforeExecute(req);

			for (let i = 0; i < params.length; i++) {
				await cmd.processParameter(i, params[i], req);
			}

			const result = await cmd.execute(params, req);
			await cmd.afterExecute(true);
			console.log(`[CommandExecutor] Successfully executed ${command}`);
			return result;
		} catch (error) {
			console.error(`[CommandExecutor] Failed to execute ${command}:`, error.message);
			await cmd.afterExecute(false);
			throw error;
		}
	}

	getCommands() {
		return [...new Set(this.commands.values())];
	}
}

module.exports = CommandExecutor;
