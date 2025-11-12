# SSO i Push Notifikacije - Upute za postavljanje

## 📋 Pregled

Ova aplikacija sada podržava:
- **Google OAuth SSO** - Jednostavna prijava pomoću Google računa
- **Push notifikacije** - Za browser, Android i iOS platforme
- **Backend API** - Express server za autentikaciju i notifikacije

## 🚀 Brzi start

### 1. Instalacija zavisnosti

```bash
npm install
```

### 2. Postavljanje environment varijabli

Kopirajte `.env.example` u `.env` i popunite potrebne vrijednosti:

```bash
cp .env.example .env
```

### 3. Google OAuth postavljanje

#### Kreiranje Google OAuth kredencijala (BESPLATNO):

1. Idite na [Google Cloud Console](https://console.cloud.google.com/)
2. Kreirajte novi projekt ili izaberite postojeći
3. Omogućite **Google+ API**
4. Idite na **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Konfigurirajte OAuth consent screen
6. Za **Authorized redirect URIs** dodajte:
   - `http://localhost:3001/api/auth/google/callback` (development)
   - `https://your-domain.com/api/auth/google/callback` (production)
7. Kopirajte **Client ID** i **Client Secret** u `.env` fajl:

```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
```

### 4. VAPID keys za Web Push (BESPLATNO)

Generirajte VAPID ključeve za web push notifikacije:

```bash
npx web-push generate-vapid-keys
```

Kopirajte generirane ključeve u `.env`:

```env
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
```

### 5. Pokretanje aplikacije

#### Development mode:

**Terminal 1** - Pokreni frontend:
```bash
npm run dev
```

**Terminal 2** - Pokreni backend:
```bash
npm run server
```

Aplikacija će biti dostupna na:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 📱 Mobilne aplikacije (Android/iOS)

### Build i pokretanje

```bash
# Android
npm run build:android
npm run open:android

# iOS (samo na macOS sa Xcode)
npm run build:ios
npm run open:ios
```

### Push notifikacije za Android

1. **Firebase postavljanje** (besplatno):
   - Idite na [Firebase Console](https://console.firebase.google.com/)
   - Kreirajte novi projekt
   - Dodajte Android aplikaciju sa package name: `com.vacationtracker.pro`
   - Preuzmite `google-services.json` i stavite ga u `android/app/`
   - Kopirajte **Server Key** iz Cloud Messaging settings

2. **Konfiguracija**:
   - Dodajte Firebase konfiguraciju u `android/app/build.gradle`
   - Push notifikacije će automatski raditi nakon instalacije

### Push notifikacije za iOS

1. **Apple Developer Account** potreban (99$/godišnje)
2. Konfigurirajte Push Notifications capability u Xcode
3. Dodajte APNs authentication key ili certificate
4. Više informacija: [Apple Push Notifications Guide](https://developer.apple.com/documentation/usernotifications)

## 🔐 Sigurnost

### Produkcija checklist:

- [ ] Promijenite sve default secrets u `.env`
- [ ] Postavite `NODE_ENV=production`
- [ ] Omogućite HTTPS
- [ ] Konfigurirajte CORS sa specifičnim domenama
- [ ] Koristite environment varijable umjesto hardcodiranih vrijednosti
- [ ] Dodajte rate limiting na API endpoints

### Preporučene izmjene za produkciju:

```env
# Sigurni secrets (generirajte nove!)
JWT_SECRET=use-strong-random-string-here
SESSION_SECRET=use-another-strong-random-string-here

# Production URLs
CLIENT_URL=https://your-production-domain.com
NODE_ENV=production
```

## 🧪 Testiranje

### Test SSO funkcionalnosti:

1. Otvorite aplikaciju: http://localhost:5173
2. Kliknite "Sign in with Google"
3. Odaberite Google račun
4. Bit ćete preusmjereni nazad u aplikaciju kao prijavljeni korisnik

### Test Push notifikacija:

1. **Browser**:
   - Otvorite Settings (ikona zupčanika)
   - Kliknite "Enable Push Notifications"
   - Dozvolite notifikacije u browseru
   - Kliknite "Test Push Notification" dugme

2. **Mobile** (nakon deploya):
   - Instalirajte aplikaciju na uređaj
   - Dozvolite notifikacije u system settings
   - Notifikacije će stizati automatski od servera

## 📚 API Endpoints

### Autentikacija

- `GET /api/auth/google` - Inicijalizuje Google OAuth flow
- `GET /api/auth/google/callback` - Callback nakon Google autentikacije
- `POST /api/auth/verify-token` - Verifikuje JWT token
- `GET /api/auth/logout` - Odjavljuje korisnika
- `GET /api/auth/user` - Vraća trenutnog korisnika

### Push notifikacije

- `POST /api/push/subscribe` - Registruje device/browser za push
- `POST /api/push/unsubscribe` - Odregistruje device/browser
- `POST /api/push/send` - Šalje notifikaciju pojedinačnom korisniku
- `POST /api/push/broadcast` - Šalje notifikaciju svim korisnicima
- `GET /api/push/vapid-public-key` - Vraća VAPID public key

### Primjer slanja notifikacije:

```bash
curl -X POST http://localhost:3001/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user@example.com",
    "type": "morning",
    "title": "Good Morning!",
    "body": "Ready to start your day?"
  }'
```

## 🛠 Troubleshooting

### SSO ne radi:
- Provjerite da li su Google credentials ispravno postavljeni u `.env`
- Provjerite da li je callback URL dodan u Google Console
- Provjerite da li backend server radi na portu 3001

### Push notifikacije ne rade (browser):
- Provjerite da li su VAPID ključevi generirani i postavljeni
- Provjerite da li je service worker registrovan (Developer Tools → Application → Service Workers)
- Provjerite browser permissions (treba biti "granted")

### Push notifikacije ne rade (mobile):
- Android: Provjerite Firebase konfiguraciju
- iOS: Provjerite Push Notifications capability i certificates
- Provjerite da su permisije dozvoljene u system settings

## 📝 Dodatne napomene

- **SSO** je potpuno besplatno za Google OAuth
- **Web Push** ne zahtijeva plaćanje niti eksterni servis
- **Mobile Push** za Android je besplatan (Firebase)
- **Mobile Push** za iOS zahtijeva Apple Developer Account ($99/god)

Za dodatnu pomoć, provjerite:
- [Google OAuth dokumentaciju](https://developers.google.com/identity/protocols/oauth2)
- [Web Push dokumentaciju](https://web.dev/push-notifications-overview/)
- [Capacitor dokumentaciju](https://capacitorjs.com/docs)
