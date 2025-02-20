const express = require(`express`);
const cors = require(`cors`);
const supabase = require(`./database/supabase.js`);
const CommandExecutor = require(`./commands.js`);
require(`dotenv`).config();

const app = express();
app.use(
    cors({
        origin: `http://localhost:3000`,
        credentials: true,
        methods: [`GET`, `POST`, `OPTIONS`],
        allowedHeaders: [`Content-Type`, `Authorization`]
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const commandExecutor = new CommandExecutor();
global.commandExecutor = commandExecutor;

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

app.get(`/auth/callback`, (req, res) => {
    const next = req.query.next || `/`;
    res.redirect(303, `/${next.slice(1)}`);
});

app.post(`/auth/logout`, async (req, res) => {
    const { error } = await supabase.auth.signOut();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

app.listen(8080, () => console.log(`Server running on port 8080`));
