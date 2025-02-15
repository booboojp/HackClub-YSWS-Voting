const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const FileStore = require('session-file-store')(session);


require('dotenv').config({ path: path.join(__dirname, '.env') });


const slackAuth = require('./authentication/slack.js');
const authMiddleware = require('./middleware/auth');
const CommandExecutor = require('../commands.js');
const { parseCommand } = require('./utils/commandParser.js');
const verifySlackRequest = require('./middleware/slackVerification.js');

const ensureSessionDirectory = () => {
    const sessionsPath = path.join(__dirname, 'sessions');
    if (!fs.existsSync(sessionsPath)) {
        fs.mkdirSync(sessionsPath, { recursive: true });
    }
};



const app = express();
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'],
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));



const sessionStore = new FileStore({
    path: path.join(__dirname, 'sessions'),
    ttl: 86400,
    retries: 0,
    logFn: function(message) {
        console.log('[Session Store]:', message);
    }
});


sessionStore.on('error', function(error) {
    console.error('[Session Store Error]:', error);
});


app.use(session({
    store: sessionStore,
    name: 'connect.sid',
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    rolling: true, // DO NOT CHANGE FOR THE LOVE OF GOD
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        domain: 'localhost'
    }
}));


app.use((req, res, next) => {
    console.log('Session Debug:', {
        id: req.sessionID,
        hasAuth: !!req.session?.auth,
        cookie: req.session?.cookie
    });
    next();
});

const commandExecutor = new CommandExecutor();


app.get('/auth/slack', (req, res) => {
    const currentSessionId = req.sessionID;
    console.log('Starting OAuth flow with session ID:', currentSessionId);

    req.session.slackState = currentSessionId;
    
    req.session.save((err) => {
        if (err) {
            console.error('Error saving session:', err);
            return res.status(500).json({ error: 'Session save failed' });
        }

        const botScopes = [
            'channels:read',
            'chat:write',
            'commands',
            'groups:read',
            'users:read',
            'users:read.email'
        ];

        const userScopes = [
            'identity.avatar',
            'identity.basic',
            'identity.email'
        ];

        const slackAuthUrl = `https://slack.com/oauth/v2/authorize?` + 
            `client_id=${process.env.SLACK_CLIENT_ID}` +
            `&scope=${botScopes.join(',')}` +
            `&user_scope=${userScopes.join(',')}` +
            `&state=${currentSessionId}` +
            `&redirect_uri=${encodeURIComponent(process.env.SLACK_REDIRECT_URI)}`;

        res.redirect(slackAuthUrl);
    });
});

app.get('/auth/slack/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        console.log('Callback received with state:', state);


        const sessionPath = path.join(__dirname, 'sessions', `${state}.json`);
        if (!fs.existsSync(sessionPath)) {
            console.error('Session file not found:', sessionPath);
            return res.status(403).json({ error: 'Invalid session' });
        }


        const sessionData = JSON.parse(fs.readFileSync(sessionPath));
        if (!sessionData.slackState || sessionData.slackState !== state) {
            console.error('State mismatch:', { 
                expected: sessionData.slackState, 
                received: state 
            });
            return res.status(403).json({ error: 'State mismatch' });
        }

        const tokenData = await slackAuth.getAccessToken(code);
        const validation = await slackAuth.validateAndStoreTokens(tokenData);
        
        if (validation.isValid) {
            sessionData.auth = tokenData;
            sessionData.__lastAccess = Date.now();
            
            fs.writeFileSync(sessionPath, JSON.stringify(sessionData));
            
            console.log('Session updated successfully:', {
                sessionId: state,
                hasAuth: true
            });

            res.redirect('http://localhost:3000');
        } else {
            res.status(403).json({ error: 'Authentication validation failed' });
        }
    } catch (error) {
        console.error('Auth callback error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

app.get('/auth/status', (req, res) => {
    console.log('Auth Status Check:', {
        sessionID: req.sessionID,
        hasSession: !!req.session,
        hasAuth: !!req.session?.auth
    });


    req.session.touch();

    res.json({
        isAuthenticated: !!req.session.auth,
        user: req.session.auth || null,
        sessionID: req.sessionID
    });
});
app.post('/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Could not log out' });
      }
      res.json({ success: true });
    });
});

app.use('/api/slack/*', verifySlackRequest);

app.post('/api/slack/command', async (req, res) => {
    const { command } = req.body;
    try {
        const { command: cmdName, params } = parseCommand(command);
        const result = await commandExecutor.execute(cmdName, params, req);
        console.log(`Executing command: ${cmdName} with params: ${params}`);
        
        if (result.redirect) {
            res.json({ success: true, redirect: result.redirect });
            return;
        }
        
        res.json({ success: true, result });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
            type: error.type || 'unknown'
        });
    }
});

app.post('/api/slack/events', async (req, res) => {
    // Slack events crap here, this is where we can expand more with Slack API!
  const { type, challenge } = req.body;
  
  if (type === 'url_verification') {
    return res.json({ challenge });
  }
  
  res.json({ ok: true });
});

app.post('/api/slack/test', verifySlackRequest, (req, res) => {
  res.json({ message: 'Slack verification working!' });
});
const cleanupSessions = () => {
    const sessionsPath = path.join(__dirname, 'sessions');
    if (fs.existsSync(sessionsPath)) {
        fs.readdirSync(sessionsPath).forEach(file => {
            if (file.endsWith('.json')) {
                const filePath = path.join(sessionsPath, file);
                try {
                    const sessionData = JSON.parse(fs.readFileSync(filePath));
                    // This code dleetes the session file if it is older than 24 hours
                    if (sessionData.__lastAccess + (24 * 60 * 60 * 1000) < Date.now()) {
                        fs.unlinkSync(filePath);
                    }
                } catch (err) {
                    console.error('Error reading session file:', err);
                }
            }
        });
    }
};
  cleanupSessions();
app.listen(8080, () => console.log('Server running on port 8080'));