const crypto = require(`crypto`);

const verifySlackRequest = (req, res, next) => {
	const slackSignature = req.headers[`x-slack-signature`];
	const timestamp = req.headers[`x-slack-request-timestamp`];
	
	console.log(`Received Slack signature: ${slackSignature}`);
	console.log(`Received timestamp: ${timestamp}`);
	
	if (!slackSignature || !timestamp) {
		console.log(`Missing Slack signature or timestamp`);
		return next();
	}

	const currentTime = Math.floor(new Date().getTime() / 1000);
	console.log(`Current time: ${currentTime}`);
	
	if (Math.abs(currentTime - timestamp) > 300) {
		console.log(`Request timestamp is too old`);
		return res.status(400).json({ error: `Request timestamp is too old` });
	}

	const rawBody = req.rawBody || JSON.stringify(req.body) || ``;
	const baseString = `v0:${timestamp}:${rawBody}`;
	console.log(`Base string: ${baseString}`);

	const hmac = crypto.createHmac(`sha256`, process.env.SLACK_SIGNING_SECRET);
	const signature = `v0=` + hmac.update(baseString).digest(`hex`);
	console.log(`Generated signature: ${signature}`);

	try {
		if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(slackSignature))) {
			console.log(`Signatures match`);
			next();
		} else {
			console.log(`Invalid request signature`);
			res.status(401).json({ error: `Invalid request signature` });
		}
	} catch (error) {
		console.log(`Error comparing signatures: ${error.message}`);
		next();
	}
};

module.exports = verifySlackRequest;
