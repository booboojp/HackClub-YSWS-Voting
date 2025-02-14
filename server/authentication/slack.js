const { WebClient } = require('@slack/web-api');

class SlackAuth {
    constructor() {
        this.web = new WebClient();
    }

    async getAccessToken(code) {
        try {
            const result = await this.web.oauth.v2.access({
                client_id: process.env.SLACK_CLIENT_ID,
                client_secret: process.env.SLACK_CLIENT_SECRET,
                code,
                redirect_uri: process.env.SLACK_REDIRECT_URI
            });

            if (!result.ok) {
                throw new Error('Failed to get access token');
            }
            return {
                botToken: result.access_token,
                botUserId: result.bot_user_id,
                userToken: result.authed_user.access_token,
                userId: result.authed_user.id,
                teamId: result.team.id,
                teamName: result.team.name
            };
        } catch (error) {
            console.error('Slack OAuth Error:', error);
            throw error;
        }
    }

    async validateAndStoreTokens(tokenData) {
      try {
          const botClient = new WebClient(tokenData.botToken);
          const userClient = new WebClient(tokenData.userToken);

          const authTest = await botClient.auth.test();
          if (!authTest.ok) return { isValid: false, error: 'Invalid bot token' };
          const userAuthTest = await userClient.auth.test();
          if (!userAuthTest.ok) return { isValid: false, error: 'Invalid user token' };
  
          const userInfo = await userClient.users.info({ user: tokenData.userId });
          const profile = userInfo.user.profile;
          tokenData.userEmail = profile.email;
          tokenData.userName = profile.display_name || userInfo.user.name;
          tokenData.userImage = profile.image_72;
  
          return { isValid: true };
      } catch (error) {
          console.error('Token validation error:', error);
          return { isValid: false, error: error.message };
      }
  }
}

module.exports = new SlackAuth();