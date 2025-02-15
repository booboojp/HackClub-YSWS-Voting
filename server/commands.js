const { validateParams } = require('./server/utils/commandParser.js');  
class CommandExecutor {
    constructor() {
        this.commands = new Map();
        
        this.registerCommand('help', [], () => ({
            success: true,
            result: 'Available commands:\n- help\n- echo <message>\n- add <num1> <num2>'
        }));

        this.registerCommand('echo', ['message'], (_, ...params) => ({
            success: true,
            result: params.join(' ')
        }));

        this.registerCommand('add', ['num1', 'num2'], (_, num1, num2) => {
            const n1 = parseFloat(num1);
            const n2 = parseFloat(num2);
            
            if (isNaN(n1) || isNaN(n2)) {
                throw new Error('Invalid number parameters');
            }
            
            return { success: true, result: n1 + n2 };
        });
        this.registerCommand('login', [], (_, req) => {
            if (req.session?.auth) {
                throw new Error('Already authenticated');
            }
            return {
                success: true,
                result: 'Redirecting to Slack login...',
                redirect: 'http://localhost:8080/auth/slack'
            };
        });

        this.registerCommand('logout', [], (_, req) => {
            if (!req.session?.auth) {
                throw new Error('Not authenticated');
            }
            req.session.destroy();
            return {
                success: true,
                result: 'Successfully logged out'
            };
        });
        this.registerCommand('status', [], (_, req) => {
            if (!req.session) {
                return {
                    success: true,
                    result: 'No active session'
                };
            }

            return {
                success: true,
                result: req.session.auth ? 
                    `Authenticated as ${req.session.auth.userName} (${req.session.auth.userId})\nTeam: ${req.session.auth.teamName}` :
                    'Not authenticated'
            };
        });


        this.registerCommand('newcommand', ['param1', 'param2'], (_, param1, param2) => ({
            success: true,
            result: `Processed ${param1} and ${param2}`
        }));
    }

    registerCommand(name, requiredParams, executor) {
        this.commands.set(name.toLowerCase(), { requiredParams, executor });
    }

    async execute(command, params) {

        const cmd = this.commands.get(command) || (() => { throw new Error(`Unknown command: ${command}`); })();

        const validation = validateParams(command, cmd.requiredParams, params);
        (validation.valid) ? (true) : ((() => { throw new Error(validation.error); })());

        return cmd.executor(command, ...params);
    }
}

module.exports = CommandExecutor;