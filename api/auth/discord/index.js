const { handleDiscordRedirect } = require('../index.js');

module.exports = async function handler(req, res) {
  return handleDiscordRedirect(req, res);
};

