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
            isInteractiveCase: true,
        });
    }

    async execute(params, req) {
        const [action, ...rest] = params;

        switch (action) {
            case `create`: {
                return {
                    interactive: true,
                    awaitingInput: true,
                    prompt: this.getNextPrompt()
                };
            }

            case `search`:
            case `list`: {
                const [tag] = rest;
                const results = await supabase
                    .from(`ysws`)
                    .select(`*`)
                    .eq(`tags`, tag)
                    .eq(`status`, `ideation`);

                if (!results.data?.length) {
                    return { success: true, result: `No projects found` };
                }

                const output = results.data
                    .map(y => `${y.id}: ${y.title} [${y.votes?.length || 0}⭐]`)
                    .join(`\n`);

                return { success: true, result: output };
            }

            default:
                return { success: false, result: `Unknown action: ${action}` };
        }
    }

    getNextPrompt() {
        const prompts = [
            `Enter project title:`,
            `Enter project description:`,
            `Enter tags (comma-separated):`,
            `Enter status (ideation/development/completed):`
        ];
        return prompts[this.interactiveState?.step || 0];
    }

    async handleInteractiveInput(input, req) {
        if (!this.interactiveState) {
            this.interactiveState = { step: 0, data: {} };
        }

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
                    data.status = input.toLowerCase();
                    if (!['ideation', 'development', 'completed'].includes(data.status)) {
                        return {
                            awaitingInput: true,
                            prompt: `Invalid status. Must be ideation/development/completed:`,
                            currentStep: step
                        };
                    }
                    return this.createProject(req);
            }

            this.interactiveState.step++;
            return {
                awaitingInput: true,
                prompt: this.getNextPrompt()
            };

        } catch (error) {
            return {
                awaitingInput: true,
                prompt: `Error: ${error.message}. ${this.getNextPrompt()}`
            };
        }
    }

    async createProject(req) {
        const { data } = this.interactiveState;

        const { data: project, error } = await supabase
            .from(`ysws`)
            .insert({
                ...data,
                creator: req.user.id,
                votes: []
            })
            .select()
            .single();

        if (error) throw error;

        return {
            awaitingInput: false,
            success: true,
            result: `Created project: ${project.title}`
        };
    }
}

module.exports = YSWSCommand;
