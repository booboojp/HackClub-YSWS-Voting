const authMiddleware = (req, res, next) => {
    if (!req.session.auth) {
        return res.status(401).json({ 
            error: 'Unauthorized',
            message: 'Please authenticate with Slack first'
        });
    }
    next();
};

module.exports = authMiddleware;