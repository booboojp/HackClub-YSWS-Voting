const Command = require(`../utils/Command`);
const supabase = require(`../database/supabase`);

class LogoutCommand extends Command {
    constructor() {
        super({
            name: `logout`,
            aliases: [`signout`],
            params: [],
            requiresAuth: false,
            description: `Logout from current session`
        });
    }

    async execute(params, req) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true, result: `Successfully logged out` };
    }
}

module.exports = LogoutCommand;
