# 🚀 Brzi vodič za pokretanje

## ✅ Što je implementirano

### 1. Google OAuth SSO
- ✅ Backend Express server sa Passport.js
- ✅ Google OAuth 2.0 integracija
- ✅ JWT autentikacija
- ✅ Frontend login sa Google dugmetom
- ✅ Automatska registracija korisnika

### 2. Push Notifikacije
- ✅ Web Push API za browser
- ✅ Capacitor Push Notifications za Android/iOS
- ✅ Backend API za slanje notifikacija
- ✅ VAPID keys setup
- ✅ Interaktivne akcije u notifikacijama

### 3. Backend API
- ✅ Express server (port 3001)
- ✅ CORS konfiguracija
- ✅ Session management
- ✅ Push notification endpoints
- ✅ Auth endpoints

## 📦 Instalirane zavisnosti

```json
{
  "dependencies": {
    "@capacitor/push-notifications": "^5.1.2",
    "express": "^5.1.0",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "jsonwebtoken": "^9.0.2",
    "web-push": "^3.6.7",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3"
  }
}
```

## 🎯 Kako pokrenuti (Development)

### Korak 1: Instaliraj zavisnosti
```bash
npm install
```

### Korak 2: Konfiguriraj Google OAuth (OPCIONO za testiranje)

Ako želite testirati SSO, dobijte Google OAuth credentials:

1. Idite na https://console.cloud.google.com/
2. Kreirajte projekt
3. Omogućite Google+ API
4. Kreirajte OAuth 2.0 credentials
5. Dodajte redirect URI: `http://localhost:3001/api/auth/google/callback`
6. Kopirajte Client ID i Secret u `.env.local`

**NAPOMENA**: Aplikacija će raditi i BEZ Google credentials - koristit će demo mode!

### Korak 3: Generiraj VAPID ključeve (OPCIONO)

```bash
npx web-push generate-vapid-keys
```

Kopirajte ključeve u `.env.local` (ili koristite default demo keys).

### Korak 4: Pokreni aplikaciju

**Terminal 1** - Frontend:
```bash
npm run dev
```

**Terminal 2** - Backend:
```bash
npm run server
```

### Korak 5: Otvori u browseru

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 🧪 Kako testirati

### Test 1: Magic Link Login (RADI ODMAH)
1. Otvorite http://localhost:5173
2. Unesite bilo koji email
3. Kliknite "Send Magic Link"
4. Dobijete kod - kopirajte ga
5. Unesite kod i prijavite se ✅

### Test 2: Google SSO (Zahtijeva konfiguraciju)
1. Konfigurirajte Google OAuth credentials
2. Kliknite "Sign in with Google"
3. Odaberite Google račun
4. Automatski login ✅

### Test 3: Push Notifikacije (Browser)
1. Nakon logina, idite u Settings (ikona zupčanika)
2. Kliknite "Enable Push Notifications"
3. Dozvolite notifikacije u browseru
4. Kliknite "Test Push Notification" ✅

### Test 4: Mobile Push (Zahtijeva build)
```bash
npm run build
npm run build:android
npm run open:android
```

## 📁 Struktura projekta

```
vacation-tracker/
├── server/                    # Backend Express server
│   ├── index.js              # Main server file
│   ├── config/
│   │   └── passport.js       # Passport configuration
│   └── routes/
│       ├── auth.js           # Auth endpoints
│       └── push.js           # Push notification endpoints
├── components/               # React components
│   ├── Login.tsx            # Updated with SSO
│   └── Header.tsx           # Updated with push settings
├── utils/
│   └── pushNotifications.ts # Unified push notification helper
├── .env.local               # Environment variables
├── SSO_PUSH_SETUP.md       # Detailed setup guide
└── QUICK_START.md          # This file
```

## 🔑 Environment varijable (.env.local)

```env
# Google OAuth (opciono - koristit će demo mode ako nije postavljeno)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# VAPID Keys (opciono - ima default vrijednosti)
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key

# Backend URL
VITE_API_URL=http://localhost:3001
```

## ✨ Funkcionalnosti

### Login ekran
- ✅ Google SSO dugme sa ikonom
- ✅ Email Magic Link (postojeće)
- ✅ Automatska detekcija SSO tokena
- ✅ Push notifikacija nakon logina

### Settings panel
- ✅ "Enable Push Notifications" dugme
- ✅ Test notifikacija dugmad
- ✅ Notifikacija status

### Push notifikacije
- ✅ Web Push za browser
- ✅ Capacitor Push za mobile
- ✅ Kontekstualne poruke (morning, lunch, end-of-day)
- ✅ Interaktivne akcije (clock-in, break, etc.)

## 🎨 Novi UI elementi

### Login.tsx
```tsx
// Google SSO dugme sa logo
<Button onClick={handleGoogleSSO}>
  <GoogleIcon /> Sign in with Google
</Button>

// Divider
<div>Or continue with email</div>
```

### Header.tsx
```tsx
// Push notification settings
<Button onClick={requestNotificationPermission}>
  Enable Push Notifications
</Button>

<Button onClick={testPushNotification}>
  Test Push Notification
</Button>
```

## 🔧 Troubleshooting

### "Cannot find module 'express'"
```bash
npm install
```

### Backend ne radi
```bash
cd server
node index.js
```

### Push ne rade
- Provjerite da li je service worker aktivan (F12 → Application → Service Workers)
- Provjerite permissions (F12 → Application → Notifications)

### SSO ne radi
- Provjerite Google credentials
- Backend mora biti na http://localhost:3001
- Callback URL mora biti dodan u Google Console

## 📚 Dodatni resursi

- **Detaljna dokumentacija**: [SSO_PUSH_SETUP.md](./SSO_PUSH_SETUP.md)
- **API dokumentacija**: [SSO_PUSH_SETUP.md#-api-endpoints](./SSO_PUSH_SETUP.md#-api-endpoints)
- **README**: [README.md](./README.md)

## ✅ Checklist za produkciju

- [ ] Konfiguriraj prave Google OAuth credentials
- [ ] Generiraj nove VAPID ključeve
- [ ] Postavi environment varijable
- [ ] Promijeni JWT_SECRET i SESSION_SECRET
- [ ] Omogući HTTPS
- [ ] Konfiguriraj Firebase za Android push
- [ ] Postavi APNs za iOS push
- [ ] Deploy backend na server
- [ ] Ažuriraj CORS settings

## 🎉 Gotovo!

Sada imate potpuno funkcionalnu aplikaciju sa:
- ✅ Google SSO autentikacijom
- ✅ Push notifikacijama za sve platforme
- ✅ Backend API serverom
- ✅ Mobile app podrškom

Za bilo kakva pitanja, provjerite [SSO_PUSH_SETUP.md](./SSO_PUSH_SETUP.md)!
