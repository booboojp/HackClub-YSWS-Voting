const PocketBase = require(`pocketbase/cjs`);

class PocketBaseClient {
	constructor() {
		this.pb = new PocketBase(`http://127.0.0.1:8090`);
		this.isConnected = false;
	}

	async connect() {
		try {
			await this.pb.health.check();
			console.log(`PocketBase connected`);
			this.isConnected = true;
		} catch (err) {
			console.error(`PocketBase connection failed:`, err);
			throw err;
		}
	}

	getInstance() {
		if (!this.isConnected) {
			throw new Error(`PocketBase not connected. Run connect() first`);
		}
		return this.pb;
	}
}

module.exports = new PocketBaseClient();
