const Command = require(`../utils/Command.js`);
const supabase = require(`../database/supabase.js`);

class LogoutCommand extends Command {
    constructor() {
        super({
            name: `logout`,
            aliases: [`signout`],
            params: [],
            requiresAuth: false,
            description: `Logout from your current session`
        });
    }

    async execute(params, req) {
        try {
            const { error } = await supabase.auth.signOut();

            if (error) throw error;

            return {
                success: true,
                result: `Successfully logged out`
            };
        } catch (error) {
            return {
                success: false,
                error: `Logout failed: ${error.message}`
            };
        }
    }
}

module.exports = LogoutCommand;
