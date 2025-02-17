const Command = require(`../utils/Command.js`);
const CommandExecutor = require(`../commands.js`);

class HelpCommand extends Command {
	constructor() {
		super({
			name: `help`,
			aliases: [`h`, `?`],
			params: [],
			requiresAuth: false,
			description: `Shows all available commands`
		});
	}

	async execute(params, req) {
		const executor = global.commandExecutor || new CommandExecutor();
		const commands = executor.getCommands();

		const commandList = commands.map(command =>
			`- ${command.name}${command.params.length ? ` <${command.params.join(`> <`)}>` : ``}${command.aliases.length ? ` (${command.aliases.join(`, `)})` : ``}\n  ${command.description}`
		).join(`\n`);

		return {
			success: true,
			result: `Available commands:\n${commandList}`
		};
	}
}

module.exports = HelpCommand;
