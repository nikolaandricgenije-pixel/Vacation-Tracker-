# 🔧 Discord Vacation Tracker - Deployment Checklist

## ✅ Problemi popravljeni:

### 1. **Ed25519 Signature Verification** ✅
- **Problem**: Neispravna verifikacija potpisa (koristio SHA256 umesto Ed25519)
- **Rešenje**: Implementirana ispravna Ed25519 verifikacija koristeći `webcrypto`
- **Fajl**: `api/discord/interactions.js:6-32`

### 2. **Import Paths** ✅
- **Problem**: Pogrešne import putanje (`./" umesto `../`)
- **Rešenje**: Popravljene sve import putanje u `interactions.js`
- **Fajl**: `api/discord/interactions.js:1-3`

### 3. **Database Connection Validation** ✅
- **Problem**: Nedostaje validacija DATABASE_URL
- **Rešenje**: Dodato bacanje greške ako DATABASE_URL nije postavljen
- **Fajl**: `api/drizzle/db.js:4-6`

### 4. **User Duplication** ✅
- **Problem**: Potencijalna duplikacija korisnika zbog race conditions
- **Rešenje**: Dodato hvatanje PostgreSQL unique constraint greške (23505)
- **Fajl**: `api/auth/discord/callback.js:117-129`

---

## 📋 Discord Developer Portal Setup

### Korak 1: Kreiraj Discord Application
1. Idi na https://discord.com/developers/applications
2. Klikni "New Application"
3. Ime aplikacije: "Vacation Tracker"

### Korak 2: Bot Setup
1. Idi na "Bot" tab
2. Klikni "Reset Token" i kopiraj **DISCORD_BOT_TOKEN**
3. Omogući sledeće Privileged Gateway Intents (NIJE obavezno za slash commands, ali dobro za budućnost):
   - SERVER MEMBERS INTENT
   - MESSAGE CONTENT INTENT

### Korak 3: OAuth2 Setup
1. Idi na "OAuth2" > "General"
2. Dodaj Redirect URL: `https://vacation-tracker-j5zk.vercel.app/api/auth/discord/callback`
3. Kopiraj **CLIENT ID** i **CLIENT SECRET**

### Korak 4: General Information
1. Idi na "General Information" tab
2. Kopiraj **PUBLIC KEY** (ovo je DISCORD_PUBLIC_KEY)

---

## 🔑 Environment Variables

### Vercel Environment Variables (KRITIČNO!)

Postavi sledeće environment variables u Vercel Dashboard:

```bash
# Discord OAuth
DISCORD_CLIENT_ID=tvoj_client_id
DISCORD_CLIENT_SECRET=tvoj_client_secret
DISCORD_CALLBACK_URL=https://vacation-tracker-j5zk.vercel.app/api/auth/discord/callback

# Discord Bot
DISCORD_BOT_TOKEN=tvoj_bot_token
DISCORD_PUBLIC_KEY=tvoj_public_key  # ⚠️ KRITIČNO za komande!

# Database
DATABASE_URL=postgresql://neondb_owner:npg_SgfQJFbI0qR4@ep-still-firefly-agq7qdhw-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require

# Frontend
CLIENT_URL=https://vacation-tracker-j5zk.vercel.app
VITE_API_URL=https://vacation-tracker-j5zk.vercel.app

# Settings
DEFAULT_VACATION_DAYS=20
DEFAULT_PAID_LEAVE_DAYS=7
OVERTIME_THRESHOLD_HOURS=40
```

---

## 🤖 Registracija Discord Slash Commands

### Metod 1: API Endpoint (Preporučeno)
```bash
curl -X POST https://vacation-tracker-j5zk.vercel.app/api/discord/register
```

### Metod 2: Lokalni Node.js skript
```javascript
// register-commands.js
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

const token = 'DISCORD_BOT_TOKEN';
const clientId = 'DISCORD_CLIENT_ID';

const rest = new REST({ version: '9' }).setToken(token);

const commands = [
  {
    name: 'vacation-status',
    description: 'Check your vacation status'
  },
  {
    name: 'request-vacation',
    description: 'Request vacation time',
    options: [
      {
        name: 'start_date',
        description: 'Start date (YYYY-MM-DD)',
        type: 3,
        required: true
      },
      {
        name: 'end_date',
        description: 'End date (YYYY-MM-DD)',
        type: 3,
        required: true
      },
      {
        name: 'days',
        description: 'Number of days',
        type: 4,
        required: true
      }
    ]
  },
  {
    name: 'check-hours',
    description: 'Check your weekly hours'
  },
  {
    name: 'clock-in',
    description: 'Clock in for work',
    options: [
      {
        name: 'work_type',
        description: 'Type of work',
        type: 3,
        required: false,
        choices: [
          { name: 'Office', value: 'Office' },
          { name: 'Home', value: 'Home' },
          { name: 'Business Trip', value: 'BusinessTrip' }
        ]
      }
    ]
  },
  {
    name: 'clock-out',
    description: 'Clock out from work'
  }
];

try {
  await rest.put(
    Routes.applicationCommands(clientId),
    { body: commands }
  );
  console.log('Successfully registered commands!');
} catch (error) {
  console.error(error);
}
```

Pokretanje:
```bash
node register-commands.js
```

---

## 🔗 Interactions Endpoint URL Setup

1. Idi na Discord Developer Portal
2. Otvori svoju aplikaciju
3. Idi na "General Information"
4. **INTERACTIONS ENDPOINT URL**: `https://vacation-tracker-j5zk.vercel.app/api/discord/interactions`
5. Klikni "Save Changes"

Discord će automatski poslati PING request da testira endpoint. Ako vidi grešku:
- Proveri da li je `DISCORD_PUBLIC_KEY` postavljen u Vercel
- Proveri Vercel logs za detalje

---

## 🔍 Testiranje

### 1. Test OAuth Login
Poseti: `https://vacation-tracker-j5zk.vercel.app/api/auth/discord`

Trebalo bi da:
- Preusmeri na Discord OAuth
- Vrati te na frontend sa `?discord_login=success&user_email=...`
- Kreira user u bazi sa `discord_id`

### 2. Test Slash Commands
U Discord serveru gde je bot dodat, pokreni:
```
/vacation-status
```

Trebalo bi da dobiješ:
- Ako si ulogovan: Prikaz vacation statusa
- Ako nisi ulogovan: "Your Discord account is not linked. Please login via Discord OAuth first."

---

## 🛠️ Debugging

### Komande ne rade

**Provera 1: Discord Public Key**
```bash
# Proveri Vercel logs
vercel logs --follow

# Traži ovu liniju:
[DISCORD] Missing DISCORD_PUBLIC_KEY
```

**Provera 2: Signature Verification**
```bash
# Traži greške u logovima:
[DISCORD] Signature verification error
[DISCORD] Invalid signature
```

**Rešenje**:
- Proveri da li je `DISCORD_PUBLIC_KEY` postavljen u Vercel Environment Variables
- Kopiraj PUBLIC KEY iz Discord Developer Portal > General Information
- Format: hex string (64 karaktera)

**Provera 3: Interactions Endpoint**
- Discord Developer Portal > General Information > INTERACTIONS ENDPOINT URL
- Mora biti: `https://vacation-tracker-j5zk.vercel.app/api/discord/interactions`
- Klikni "Save Changes" i sačekaj Discord da pošalje PING

**Provera 4: Bot Permissions**
Bot mora imati sledeće permissions:
- `applications.commands` (za slash commands)

Invite link format:
```
https://discord.com/api/oauth2/authorize?client_id=TVOJ_CLIENT_ID&permissions=0&scope=bot%20applications.commands
```

---

### User se kreira svaki put

**Provera 1: DATABASE_URL**
```bash
# Proveri da li je DATABASE_URL postavljen
vercel env ls

# Proveri Vercel logs
vercel logs --follow

# Traži:
[DEBUG] DATABASE_URL is missing!
[DEBUG] Database error creating user
```

**Provera 2: Database Connection**
```bash
# Test direktno iz Node.js
node -e "
import { db } from './api/drizzle/db.js';
import { users } from './api/drizzle/schema.js';
const result = await db.select().from(users).limit(1);
console.log('DB connected:', result.length >= 0);
"
```

**Rešenje**:
- Postavi DATABASE_URL u Vercel Environment Variables
- Proveri da li connection string radi:
  ```bash
  psql "postgresql://neondb_owner:npg_SgfQJFbI0qR4@ep-still-firefly-agq7qdhw-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
  ```

**Provera 3: Discord ID Link**
```sql
-- Proveri da li korisnik ima discord_id
SELECT id, name, email, discord_id FROM users;

-- Ako nema discord_id, onda se kreira novi user svaki put
```

---

## 📊 Vercel Deployment Checklist

### Pre Deploy:
- [ ] Postavi sve Environment Variables u Vercel Dashboard
- [ ] Proveri `vercel.json` konfiguraciju
- [ ] Test build lokalno: `npm run build`

### Nakon Deploy:
- [ ] Proveri Vercel logs: `vercel logs --follow`
- [ ] Testiraj OAuth: `/api/auth/discord`
- [ ] Registruj slash commands: `POST /api/discord/register`
- [ ] Postavi Interactions Endpoint URL u Discord Developer Portal
- [ ] Testiraj slash commands u Discord serveru

---

## 🚀 Quick Fix Commands

```bash
# Redeploy Vercel
vercel --prod

# Proveri environment variables
vercel env ls

# Dodaj environment variable
vercel env add DISCORD_PUBLIC_KEY

# Proveri logs
vercel logs --follow

# Registruj Discord commands
curl -X POST https://vacation-tracker-j5zk.vercel.app/api/discord/register
```

---

## 📞 Još uvek ima problema?

Proveri:
1. Vercel logs za detalje greške
2. Discord Developer Portal > Webhooks da vidiš request/response
3. Browser DevTools Network tab za OAuth flow
4. Database da vidiš da li se users kreiraju

Sve promene su napravljene u:
- ✅ `api/discord/interactions.js` - Ed25519 signature verification
- ✅ `api/drizzle/db.js` - Database validation
- ✅ `api/auth/discord/callback.js` - Race condition handling
- ✅ `.env.local` - DISCORD_PUBLIC_KEY dodato
- ✅ `.env.example` - Discord bot fields dodati
