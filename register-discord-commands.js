import { REST } from '@discordjs/rest';
import { Routes, ApplicationCommandOptionType } from 'discord-api-types/v9';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!DISCORD_BOT_TOKEN || DISCORD_BOT_TOKEN === 'your-discord-bot-token-here') {
  console.error('❌ DISCORD_BOT_TOKEN nije postavljen u .env.local');
  console.log('📋 Idi na: https://discord.com/developers/applications');
  console.log('   1. Odaberi svoju aplikaciju');
  console.log('   2. Bot tab > Reset Token');
  console.log('   3. Kopiraj token i postavi u .env.local');
  process.exit(1);
}

if (!DISCORD_CLIENT_ID || DISCORD_CLIENT_ID === 'your-discord-client-id-here') {
  console.error('❌ DISCORD_CLIENT_ID nije postavljen u .env.local');
  console.log('📋 Idi na: https://discord.com/developers/applications');
  console.log('   1. Odaberi svoju aplikaciju');
  console.log('   2. General Information > Application ID');
  console.log('   3. Kopiraj i postavi u .env.local');
  process.exit(1);
}

const commands = [
  {
    name: 'vacation-status',
    description: 'Proveri svoj vacation status',
  },
  {
    name: 'request-vacation',
    description: 'Zatraži godišnji odmor',
    options: [
      {
        name: 'start_date',
        description: 'Datum početka (YYYY-MM-DD)',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'end_date',
        description: 'Datum kraja (YYYY-MM-DD)',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'days',
        description: 'Broj dana',
        type: ApplicationCommandOptionType.Integer,
        required: true,
      },
      {
        name: 'reason',
        description: 'Razlog za godišnji',
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },
  {
    name: 'check-hours',
    description: 'Proveri sedmične sate',
  },
  {
    name: 'clock-in',
    description: 'Prijavi se na posao',
    options: [
      {
        name: 'work_type',
        description: 'Tip rada',
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: 'Kancelarija', value: 'Office' },
          { name: 'Kuća', value: 'Home' },
          { name: 'Poslovno putovanje', value: 'BusinessTrip' },
        ],
      },
    ],
  },
  {
    name: 'clock-out',
    description: 'Odjavi se sa posla',
  },
  {
    name: 'start-off',
    description: 'Započni off-duty period (timer pauziran)',
  },
  {
    name: 'end-off',
    description: 'Završi off-duty period (nastavi timer)',
  },
];

const rest = new REST({ version: '9' }).setToken(DISCORD_BOT_TOKEN);

console.log('🤖 Registrujem Discord slash komande...\n');

try {
  const data = await rest.put(
    Routes.applicationCommands(DISCORD_CLIENT_ID),
    { body: commands }
  );

  console.log(`✅ Uspešno registrovano ${data.length} komandi:\n`);
  
  data.forEach((cmd) => {
    console.log(`   /${cmd.name} - ${cmd.description}`);
  });

  console.log('\n🎉 Komande su dostupne u svim Discord serverima gde je bot dodat!');
  console.log('\n📌 Sledeći korak:');
  console.log('   1. Idi na Discord Developer Portal');
  console.log('   2. General Information > INTERACTIONS ENDPOINT URL');
  console.log('   3. Unesi: https://vacation-tracker-j5zk.vercel.app/api/discord/interactions');
  console.log('   4. Klikni Save Changes');
  console.log('\n💡 Test komande u Discord serveru: /vacation-status');

} catch (error) {
  console.error('❌ Greška pri registraciji komandi:', error);
  
  if (error.code === 50001) {
    console.log('\n📋 Bot nema potrebne permissions:');
    console.log('   Invite bot sa: applications.commands scope');
  } else if (error.code === 401) {
    console.log('\n📋 Nevažeći BOT_TOKEN - proveri token u .env.local');
  }
  
  process.exit(1);
}
