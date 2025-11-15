module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const [{ REST }, { Routes, ApplicationCommandOptionType }] = await Promise.all([
      import('@discordjs/rest'),
      import('discord-api-types/v9'),
    ]);

    const { DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID } = process.env;

    if (!DISCORD_BOT_TOKEN || !DISCORD_CLIENT_ID) {
      return res.status(500).json({
        error: 'Missing Discord credentials',
        required: ['DISCORD_BOT_TOKEN', 'DISCORD_CLIENT_ID']
      });
    }

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
            description: 'Start date (YYYY-MM-DD)',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: 'end_date',
            description: 'End date (YYYY-MM-DD)',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: 'days',
            description: 'Number of days',
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
          {
            name: 'reason',
            description: 'Reason for vacation',
            type: ApplicationCommandOptionType.String,
            required: false,
          },
        ],
      },
      {
        name: 'check-hours',
        description: 'Check your weekly hours',
      },
      {
        name: 'clock-in',
        description: 'Clock in for work',
        options: [
          {
            name: 'work_type',
            description: 'Type of work',
            type: ApplicationCommandOptionType.String,
            required: false,
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

    const rest = new REST({ version: '9' }).setToken(DISCORD_BOT_TOKEN);

    console.log('Registering Discord slash commands...');

    const data = await rest.put(
      Routes.applicationCommands(DISCORD_CLIENT_ID),
      { body: commands }
    );

    console.log(`Successfully registered ${data.length} application commands.`);

    res.status(200).json({
      success: true,
      message: `Registered ${data.length} commands`,
      commands: data
    });

  } catch (error) {
    console.error('Error registering commands:', error);
    res.status(500).json({
      error: 'Failed to register commands',
      details: error.message
    });
  }
}
