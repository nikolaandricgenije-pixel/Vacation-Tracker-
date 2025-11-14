import { handleDiscordRedirect } from '../index.js';

export default async function handler(req, res) {
  return handleDiscordRedirect(req, res);
}
