const Command = require(`../utils/Command.js`);
const supabase = require(`../database/supabase`);

class YSWSCommand extends Command {
    constructor() {
        super({
            name: `ysws`,
            aliases: [`project`, `p`],
            params: [`action`],
            requiresAuth: true,
            description: `Manage YSWS projects. Actions: create, search, list`,
            isInteractive: true // You forgot to enable the interactive mode for sub commands silly.
        });
    }

    async startInteractiveMode(req) {
        // You need to do this so that it only does it for the create lamo
        if (this.currentAction !== `create`) return null;

        this.interactiveState = {
            step: 0,
            data: {}
        };

        return {
            awaitingInput: true,
            prompt: this.getNextPrompt()
        };
    }

    getNextPrompt() {
        const prompts = [
            `Project title:`,
            `Description:`,
            `Tags (comma-separated):`,
            `Status (ideation/development/complete):`
        ];
        return prompts[this.interactiveState?.step] || prompts[0];
    }

    async handleInteractiveInput(input, req) {
        const { step, data } = this.interactiveState;

        if (!input.trim()) {
            return {
                awaitingInput: true,
                prompt: `Invalid input. ${this.getNextPrompt()}`
            };
        }

        try {
            switch (step) {
                case 0:
                    data.title = input;
                    break;
                case 1:
                    data.description = input;
                    break;
                case 2:
                    data.tags = input.split(`,`).map(tag => tag.trim());
                    break;
                case 3:
                    const status = input.toLowerCase();
                    if (!['ideation', 'development', 'complete'].includes(status)) {
                        return {
                            awaitingInput: true,
                            prompt: `Invalid status. Must be ideation, development, or complete:`
                        };
                    }
                    data.status = status;
                    return this.createProject(req);
            }

            this.interactiveState.step++;
            return {
                awaitingInput: true,
                prompt: this.getNextPrompt()
            };
        } catch (error) {
            return {
                awaitingInput: false,
                error: `Error: ${error.message}`
            };
        }
    }

    async execute(params, req) {
        const [action, ...rest] = params;
        this.currentAction = action?.toLowerCase();

        switch (this.currentAction) {
            case `create`:
                // Actully enter the mode Jake, haha ^w^ No worries, I'll help you out.
                return this.startInteractiveMode(req);

            case `search`:
            case `list`: {
                const [tag] = rest;
                const { data, error } = await supabase
                    .from(`ysws`)
                    .select(`*`)
                    .eq(`tags`, tag || ``);

                if (error) throw error;
                return {
                    success: true,
                    result: data.length ? data.map(p =>
                        `${p.id}: ${p.title} [${p.tags.join(`, `)}]`
                    ).join(`\n`) : `No projects found`
                };
            }

            default:
                return {
                    success: false,
                    result: `Unknown action: ${action}. Available actions: create, search, list`
                };
        }
    }

    async createProject(req) {
        const { data } = this.interactiveState;
        try {
            const { data: project, error } = await supabase
                .from(`ysws`)
                .insert([{
                    ...data,
                    creator: req.user.id,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;

            return {
                awaitingInput: false,
                result: `Project created successfully: ${project.title}`
            };
        } catch (error) {
            throw new Error(`Failed to create project: ${error.message}`);
        }
    }
}

module.exports = YSWSCommand;
