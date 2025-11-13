export default async function handler(req, res) {
  if (req.method === 'POST') {
    const commands = [
      {
        name: 'vacation-status',
        description: 'Check your vacation status',
      },
      {
        name: 'request-vacation',
        description: 'Request vacation time',
        options: [
          {
            name: 'start_date',
            type: 3, // STRING
            description: 'Start date (YYYY-MM-DD)',
            required: true,
          },
          {
            name: 'end_date',
            type: 3,
            description: 'End date (YYYY-MM-DD)',
            required: true,
          },
          {
            name: 'days',
            type: 4, // INTEGER
            description: 'Number of days',
            required: true,
          },
          {
            name: 'reason',
            type: 3,
            description: 'Reason for vacation',
          },
        ],
      },
      {
        name: 'check-hours',
        description: 'Check your weekly working hours',
      },
      {
        name: 'clock-in',
        description: 'Clock in for work',
        options: [
          {
            name: 'work_type',
            type: 3,
            description: 'Type of work',
            choices: [
              { name: 'Office', value: 'Office' },
              { name: 'Home', value: 'Home' },
              { name: 'Business Trip', value: 'BusinessTrip' },
            ],
          },
        ],
      },
      {
        name: 'clock-out',
        description: 'Clock out from work',
      },
    ];

    try {
      // For Vercel, we'll use fetch to Discord API
      const response = await fetch(`https://discord.com/api/v9/applications/${process.env.DISCORD_CLIENT_ID}/commands`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commands),
      });

      if (response.ok) {
        res.status(200).json({ message: 'Successfully registered application commands' });
      } else {
        const error = await response.text();
        res.status(500).json({ error: `Failed to register commands: ${error}` });
      }
    } catch (error) {
      console.error('Error registering commands:', error);
      res.status(500).json({ error: 'Failed to register commands' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}