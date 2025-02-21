const Command = require(`../utils/Command`);
const supabase = require(`../database/supabase`);

class CreateCommand extends Command {
    constructor() {
        super({
            name: `create`,
            aliases: [`new`],
            params: [],
            requiresAuth: true,
            description: `Create a new project interactively`,
            isInteractive: true
        });
    }

    getNextPrompt() {
        const prompts = [
            `Project title:`,
            `Short description:`,
            `Tags (comma-separated):`,
            `Visibility (public/private):`
        ];
        return prompts[this.interactiveState.step];
    }

    async startInteractiveMode(req) {
        this.interactiveState = { step: 0, data: {} };
        return {
            awaitingInput: true,
            prompt: this.getNextPrompt()
        };
    }

    async handleInteractiveInput(input, req) {
		const { step, data } = this.interactiveState;

		if (!input.trim()) {
			return {
				awaitingInput: true,
				prompt: `Invalid input. ${this.getNextPrompt()}`,
				currentStep: step
			};
		}

		try {
			const handlers = [
				() => {
					data.title = input;
					this.interactiveState.step++;
					return {
						awaitingInput: true,
						prompt: this.getNextPrompt(),
						currentStep: this.interactiveState.step
					};
				},
				() => {
					data.description = input;
					this.interactiveState.step++;
					return {
						awaitingInput: true,
						prompt: this.getNextPrompt(),
						currentStep: this.interactiveState.step
					};
				},
				() => {
					data.tags = input.split(`,`).map(tag => tag.trim()).filter(Boolean);
					this.interactiveState.step++;
					return {
						awaitingInput: true,
						prompt: this.getNextPrompt(),
						currentStep: this.interactiveState.step
					};
				},
				() => {
					const visibility = input.toLowerCase();
					if (!['public', 'private'].includes(visibility)) {
						return {
							awaitingInput: true,
							prompt: `Invalid visibility. Must be 'public' or 'private'. Try again:`,
							currentStep: step
						};
					}
					data.visibility = visibility;
					return this.finalizeProject(req);
				}
			];

			if (step >= handlers.length) {
				throw new Error(`Invalid step`);
			}

			return handlers[step]();
		} catch (error) {
			return {
				awaitingInput: true,
				prompt: `Error: ${error.message}. ${this.getNextPrompt()}`,
				currentStep: step
			};
		}
	}

    async finalizeProject(req) {
        const { data } = this.interactiveState;

        const { data: project, error } = await supabase
            .from(`projects`)
            .insert([{
                title: data.title,
                description: data.description,
                tags: data.tags,
                visibility: data.visibility,
                user_id: req.user.id,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw new Error(`Failed to create project: ${error.message}`);

        return {
            awaitingInput: false,
            result: {
                message: `Project created successfully!`,
                project
            }
        };
    }
}

module.exports = CreateCommand;
