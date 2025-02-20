const supabase = require(`../database/supabase.js`);

const authHelper = {
	signInWithSlack: async () => {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: `slack`,
			options: {
				scopes: `identity.basic,identity.email`
			}
		});

		if (error) throw error;
		return data;
	},

	getUser: async () => {
		const { data: { user }, error } = await supabase.auth.getUser();
		if (error) throw error;
		return user;
	},

	signOut: async () => {
		const { error } = await supabase.auth.signOut();
		if (error) throw error;
	}
};

module.exports = authHelper;
