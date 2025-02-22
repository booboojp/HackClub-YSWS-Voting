const supabase = require(`../database/supabase`);

class Command {
    constructor(options = {}) {
        this.name = options.name || ``;
        this.aliases = options.aliases || [];
        this.params = options.params || [];
        this.requiresAuth = options.requiresAuth !== undefined ? options.requiresAuth : true;
        this.description = options.description || `No description provided`;
        this.isInteractive = options.isInteractive || false;
        this.isInteractiveCase = options.isInteractiveCase || false;
        this.interactionTimeout = options.interactionTimeout || 300000;
        this.interactiveState = null;
    }

    async handleInteractiveInput(input, req) {
        throw new Error(`Interactive commans must impledment handleInteractiveInput`);
    }

    async startInteractiveMode(req) {
        if (!this.isInteractive) return null;
        this.interactiveState = {
            startTime: Date.now(),
            step: 0,
            data: {}
        };
        return {
            awaitingInput: true,
            prompt: this.getNextPrompt(),
            timeout: this.interactionTimeout
        };
    }

    getNextPrompt() {
        return `Enter your input:`;
    }

    async beforeExecute(req) {
        if (!this.requiresAuth) return true;

        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith(`Bearer `)) throw new Error(`Authentication required`);

        const token = auth.split(` `)[1];

        try {
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (error) throw error;
            if (!user) throw new Error(`User not found`);

            req.user = user;
            return true;
        } catch (error) {
            console.error(`Auth error:`, error);
            throw new Error(`Authentication failed`);
        }
    }

    async execute(params, req) {
        throw new Error(`Command must implement execute`);
    }

    async afterExecute(success) {
        return true;
    }
}

module.exports = Command;
