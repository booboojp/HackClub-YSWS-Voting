const fs = require(`fs`);
const path = require(`path`);
const { validateParams } = require(`./utils/commandParser.js`);

class CommandExecutor {
    constructor() {
        this.commands = new Map();
        this.activeInteractions = new Map();
        this.loadCommands();
        setInterval(this.cleanupStaleInteractions.bind(this), 60000);
    }

    cleanupStaleInteractions() {
        const now = Date.now();
        for (const [id, interaction] of this.activeInteractions) {
            if (now - interaction.startTime > interaction.command.interactionTimeout) {
                this.activeInteractions.delete(id);
            }
        }
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
    }

    async execute(command, params, req, interactionId = null) {
        if (interactionId && this.activeInteractions.has(interactionId)) {
            const interaction = this.activeInteractions.get(interactionId);
            const result = await interaction.command.handleInteractiveInput(command, req);

            if (!result.awaitingInput) {
                this.activeInteractions.delete(interactionId);
            }

            return result;
        }

        const cmd = this.commands.get(command.toLowerCase());
        if (!cmd) throw new Error(`Unknown command: ${command}`);

        if (cmd.isInteractive && !cmd.isInteractiveCase) {
            const interactionId = Date.now().toString();
            const result = await cmd.startInteractiveMode(req);

            if (result.awaitingInput) {
                this.activeInteractions.set(interactionId, {
                    command: cmd,
                    startTime: Date.now()
                });
                return { ...result, interactionId };
            }
        } else if (cmd.isInteractive && cmd.isInteractiveCase && !interactionId) {
            await cmd.beforeExecute(req);
            const result = await cmd.execute(params, req);
            await cmd.afterExecute(true);
            
            if (result.interactive) {
                const interactionId = Date.now().toString();
                this.activeInteractions.set(interactionId, {
                    command: cmd,
                    startTime: Date.now()
                });
                return { ...result, interactionId };
            }

        } else if (cmd.isInteractive && cmd.isInteractiveCase && interactionId) {
            const interaction = this.activeInteractions.get(interactionId);
            if (!interaction) throw new Error(`Invalid interaction ID`);

            const result = await interaction.command.handleInteractiveInput(command, req);

            if (!result.awaitingInput) {
                this.activeInteractions.delete(interactionId);
            }

            return result;
        }

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
