const express = require(`express`);
const cors = require(`cors`);
const supabase = require(`./database/supabase.js`);
const CommandExecutor = require(`./commands.js`);

require(`dotenv`).config();

const app = express();
app.use(cors({
	origin: `http://localhost:3000`,
	credentials: true,
	methods: [`GET`, `POST`, `OPTIONS`],
	allowedHeaders: [
		`Content-Type`,
		`Authorization`,
		`x-client-info`,
		`apikey`,
		`X-Client-Info`
	]
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const commandExecutor = new CommandExecutor();
global.commandExecutor = commandExecutor;
app.use(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return next();
    }

    try {
        const token = authHeader.split(' ')[1];
        if (!token) return next();

        // Set session in supabase client
        const { data: { user }, error } = await supabase.auth.getUser(token);
		// Detialed Logging Deuggng Message
		console.log(`Auth Middleware:`, { user, error });
		// Check if user is null
		if (!user) {
			console.log(`Auth Middleware: No user found`);
		}
        if (error || !user) {
            return next();
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        next();
    }
});
app.post(`/api/command`, async (req, res) => {
	try {
		const { command } = req.body;
		if (!command) return res.status(400).json({ error: `No command provided` });

		const [cmdName, ...params] = command.split(` `);
		const result = await commandExecutor.execute(cmdName, params, req);
		res.json(result);
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});



app.get(`/auth/callback`, async function (req, res) {
    const next = req.query.next ?? `/`;

    console.log(`Auth Callback: Received code:`, req.query.code); // Log the code
    console.log(`Auth Callback: Redirecting to:`, next);

    res.redirect(303, `/${next.slice(1)}`);
    console.log(`Auth Callback: Redirected to /${next.slice(1)}`);
});



app.post('/auth/logout', async (req, res) => {
	const { error } = await supabase.auth.signOut();

	if (error) {
		return res.status(500).json({ error: error.message });
	}

	res.json({ success: true });
});

async function startServer() {
	try {
		app.listen(8080, () => console.log(`Server running on port 8080`));
	} catch (err) {
		console.error(`Failed to start:`, err);
		process.exit(1);
	}
}

startServer();
