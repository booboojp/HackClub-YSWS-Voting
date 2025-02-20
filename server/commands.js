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
                if (typeof CommandClass !== `function`) return;
                const command = new CommandClass();
                this.commands.set(command.name.toLowerCase(), command);
                command.aliases.forEach(alias => this.commands.set(alias.toLowerCase(), command));
                console.log(`[CommandExecutor] Loaded ${command.name}`);
            } catch (error) {
                console.error(`[CommandExecutor] Failed to load ${file}:`, error.message);
            }
        });
        console.log(`[CommandExecutor] Loaded ${this.getCommands().length} commands`);
    }

    async execute(command, params, req) {
        const cmd = this.commands.get(command.toLowerCase());
        if (!cmd) throw new Error(`Unknown command: ${command}`);
        const validation = validateParams(command, cmd.params, params);
        if (!validation.valid) throw new Error(validation.error);
        await cmd.beforeExecute(req);
        const result = await cmd.execute(params, req);
        await cmd.afterExecute(true);
        return result;
    }

    getCommands() {
        return [...new Set(this.commands.values())];
    }
}

module.exports = CommandExecutor;
