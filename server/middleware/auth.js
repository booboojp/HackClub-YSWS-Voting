const { getUser } = require(`../utils/auth`);

const authMiddleware = async (req, res, next) => {
	try {
		const user = await getUser();
		if (!user) {
			return res.status(401).json({
				error: `Unauthorized`,
				message: `Please authenticate with Slack first`
			});
		}
		req.user = user;
		next();
	} catch (error) {
		res.status(401).json({ error: `Authentication failed` });
	}
};

module.exports = authMiddleware;
