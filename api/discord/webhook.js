export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { message, embeds, webhookUrl } = req.body;

      const webhook = webhookUrl || process.env.DISCORD_WEBHOOK_URL;

      if (!webhook) {
        return res.status(400).json({ error: 'No Discord webhook URL provided' });
      }

      const payload = {
        content: message,
        embeds: embeds || [],
        username: 'Vacation Tracker Bot',
        avatar_url: 'https://your-domain.com/icon-192.png'
      };

      const response = await fetch(webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Discord webhook failed: ${response.status}`);
      }

      res.status(200).json({ success: true, message: 'Notification sent to Discord' });
    } catch (error) {
      console.error('Discord webhook error:', error);
      res.status(500).json({ error: 'Failed to send Discord notification' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}