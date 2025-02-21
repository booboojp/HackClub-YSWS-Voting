const Command = require(`../utils/Command`);
const supabase = require(`../database/supabase`);

class ListProjectsCommand extends Command {
    constructor() {
        super({
            name: `list`,
            aliases: [`ls`, `projects`],
            params: [],
            requiresAuth: true,
            description: `Lists all projects in YSWS table`
        });
    }

    async execute(params, req) {
        if (!req.user) throw new Error(`User not authenticated`);

        try {
            const { data: ysws, error } = await supabase
                .from(`ysws`)
                .select(`*`);

            if (error) throw error;
            if (!ysws) throw new Error(`No data returned from query`);

            return {
                success: true,
                result: `Projects:\n${JSON.stringify(ysws, null, 2)}`
            };
        } catch (err) {
            throw new Error(`Failed to fetch projects: ${err.message}`);
        }
    }
}

module.exports = ListProjectsCommand;
