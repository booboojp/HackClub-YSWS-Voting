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
			isInteractive: true,
			isInteractiveCase: true,
        });
    }

    async beforeExecute(req) {
        if (!supabase.auth.getUser()) {
            throw new Error('Not authenticated with Supabase');
        }
        await super.beforeExecute(req);
    }

    async execute(params, req) {
        const [action, ...rest] = params;
		console.log(action)
        switch (action) {
            case `create`:
                return this.startInteractiveMode(req, `create`);
            case `search`:
                return { success: false, result: `Not implemented`, interactive: false };
            case `list`:
                return { success: false, result: `Not implemented` };

            default:
                return { success: false, result: `Unknown action: ${action}` };
        }
    }

    getNextPrompt() {
        const steps = {
            create: [
                `Project name:`,
                `Description:`,
                `Slack channel:`,
                `Website (optional):`,
                `Demo Project (optional):`,
                `HCB (optional):`,
                `Tags (comma-separated):`,
                `Visibility (public/private):`,
            ],
            search: [
                // Define search prompts here if needed
            ]
        };
        return steps[this.interactiveState.type][this.interactiveState.step];
    }

    async startInteractiveMode(req, type) {
        console.log(`Starting interactive mode for ${type}`);
        this.interactiveState = {
            type,
            step: 0,
            data: {}
        };
        return {
            awaitingInput: true,
            prompt: this.getNextPrompt()
        };
    }

    async handleInteractiveInput(input, req) {
        const { type, step, data } = this.interactiveState;
        if (type === `create`) {
            switch (step) {
                case 0:
                    if (input.length < 3) {
                        return {
                            awaitingInput: true,
                            prompt: `Project name must be at least 3 characters.`,
                        };
                    }
                    data.name = input;
                    break;
                case 1:
                    if (input.length < 10) {
                        return {
                            awaitingInput: true,
                            prompt: `Description must be at least 10 characters.`,
                        };
                    }
                    data.description = input;
                    break;
                case 2:
if (input.length > 0) {
					return {
						awaitingInput: true,
						prompt: `Please enter a slack channel.`,
					};
				}
                    data.slack = input;
                    break;
                case 3:
                    data.website = input;
                    break;
                case 4:
                    data.demo = input;
                    break;
                case 5:
                    data.hcb = input;
                    break;
                case 6:
                    data.tags = input.split(`,`).map(tag => tag.trim());
                    break;
                case 7:
                    if (![`public`, `private`].includes(input.toLowerCase())) {
                        return {
                            awaitingInput: true,
                            prompt: `Invalid visibility. Must be public or private.`,
                        };
                    }
                    if (input.toLowerCase() === `public`) {
					data.visable = true;
				} else {
					data.visable = false;
				}
                    return this.createProject(req, data);
            }
			this.interactiveState.step++;
            return {
                awaitingInput: true,
                prompt: this.getNextPrompt()
            };
        }
    }

    async createProject(req, data) {
        const { data: ysws, error } = await supabase
            .from(`ysws`)
            .insert([{
                title: data.name,
                description: data.description,
                likes: 0,
                slack_channel: data.slack,
                website_url: data.website,
                visibility: data.visibility,
                author: req.user.name,
                hcb_url: data.hcb,
                demo_url: data.demo,
                tags: data.tags,
            }])
            .select()
            .single();
        if (error) throw error;

        return {
            awaitingInput: false,
            result: `Project created successfully: ${ysws.name}, with id: ${ysws.id}`
        };
    }
}

module.exports = YSWSCommand;
