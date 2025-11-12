# Vacation Tracker Pro - PWA & Mobile App

A comprehensive time tracking and vacation management application with PWA capabilities, native mobile wrappers, SSO authentication, and push notifications.

## 🚀 Features

- **🔐 SSO Authentication**: Sign in with Google (free OAuth integration)
- **📱 Push Notifications**: Real-time notifications for browser, Android, and iOS
- **Multi-level Approval System**: Employee → Project Manager → Admin/CEO
- **Time Tracking**: Clock in/out with break management and overtime calculation
- **Vacation Management**: Request, approve, and track vacation time
- **PWA Support**: Installable web app with offline capabilities
- **Mobile Apps**: Native Android APK and iOS app wrappers
- **Real-time Notifications**: Push notifications and in-app alerts
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Backend API**: Express server for authentication and notifications

## 📋 New in this version

### 🔐 Single Sign-On (SSO)
- Google OAuth integration (100% FREE)
- Secure JWT-based authentication
- Automatic user registration
- Seamless login experience

### 📲 Advanced Push Notifications
- **Web Push**: Browser notifications with Web Push API
- **Android**: Native push notifications via Capacitor
- **iOS**: Native push notifications via Capacitor
- **Interactive Actions**: Quick actions from notifications
- **Contextual Messages**: Time-based notification content

## 🛠️ Quick Start

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

Copy the example environment file and configure:

```bash
cp .env.example .env
```

See [SSO_PUSH_SETUP.md](./SSO_PUSH_SETUP.md) for detailed configuration instructions.

### 3. Development

Run frontend and backend servers:

**Terminal 1** - Frontend:
```bash
npm run dev
```

**Terminal 2** - Backend:
```bash
npm run server
```

Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 📱 PWA (Progressive Web App)

### Installation
1. Open the app in a modern browser (Chrome, Firefox, Safari, Edge)
2. Look for the install prompt or click the menu button
3. Click "Install Vacation Tracker Pro"
4. The app will be installed as a native app on your device

### Offline Capabilities
- All data is stored locally in your browser
- Works offline for time tracking and basic operations
- Syncs data when back online

## 🔐 SSO Configuration

### Google OAuth Setup (FREE)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3001/api/auth/google/callback`
6. Copy Client ID and Secret to `.env.local`:

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

📚 Detailed guide: [SSO_PUSH_SETUP.md](./SSO_PUSH_SETUP.md)

## 📲 Push Notifications Setup

### Web Push (FREE)

Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

Add to `.env.local`:
```env
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
```

### Mobile Push

**Android (FREE):**
- Setup Firebase Cloud Messaging
- Download `google-services.json`
- Place in `android/app/` directory

**iOS (Requires Apple Developer Account - $99/year):**
- Configure Push Notifications in Xcode
- Add APNs certificate/key

📚 Complete guide: [SSO_PUSH_SETUP.md](./SSO_PUSH_SETUP.md)

## 📱 Mobile App Builds

### Android APK Build

```bash
npm run build
npm run build:android
npm run open:android
```

In Android Studio:
1. Wait for Gradle sync
2. Build → Generate Signed APK/Bundle
3. APK location: `android/app/build/outputs/apk/release/`

### iOS App Build (macOS only)

```bash
npm run build
npm run build:ios
npm run open:ios
```

In Xcode:
1. Select development team
2. Choose device/simulator
3. Product → Archive

## 📋 Available Scripts

```bash
# Frontend
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build

# Backend
npm run server           # Start backend server
npm run server:dev       # Start backend in dev mode

# Mobile Builds
npm run build:android    # Build and sync Android app
npm run build:ios        # Build and sync iOS app
npm run open:android     # Open Android project
npm run open:ios         # Open iOS project

# Code Quality
npm run lint             # Run ESLint
```

## 🔌 API Endpoints

### Authentication
- `GET /api/auth/google` - Start Google OAuth flow
- `GET /api/auth/google/callback` - OAuth callback
- `POST /api/auth/verify-token` - Verify JWT token
- `GET /api/auth/logout` - Logout user
- `GET /api/auth/user` - Get current user

### Push Notifications
- `POST /api/push/subscribe` - Register device
- `POST /api/push/send` - Send notification
- `POST /api/push/broadcast` - Broadcast to all
- `GET /api/push/vapid-public-key` - Get VAPID key

## 🎯 User Roles & Permissions

### Employee
- Clock in/out and track time
- Request vacation, paid leave, sick leave
- View personal requests and time data
- Receive push notifications

### Project Manager
- All Employee permissions
- Approve vacation requests (first level)
- View team member requests

### Admin
- All Project Manager permissions
- Approve paid leave requests
- Manage users and view analytics
- Full system administration

### CEO
- All Admin permissions
- Highest level approval authority

## 🔒 Security Features

- **SSO Authentication**: Secure OAuth 2.0 flow
- **JWT Tokens**: Stateless authentication
- **Session Management**: Secure cookie-based sessions
- **CORS Protection**: Configurable origins
- **Time Synchronization**: Prevents time manipulation
- **HTTPS Ready**: Production-ready security
- **Environment Variables**: Sensitive data protection

## 🚀 Deployment

### Web Deployment
```bash
npm run build
# Deploy 'dist' folder to your web server
```

### Backend Deployment
```bash
# Deploy 'server' folder with Node.js
# Set environment variables
# Ensure PORT and CORS are configured
```

### App Store Deployment
1. **Android**: Generate signed APK → Google Play
2. **iOS**: Archive in Xcode → App Store Connect

## 🐛 Troubleshooting

### SSO Issues
- Verify Google credentials in `.env.local`
- Check callback URL in Google Console
- Ensure backend is running on port 3001

### Push Notification Issues
- **Web**: Check VAPID keys and service worker
- **Android**: Verify Firebase configuration
- **iOS**: Check certificates and capabilities

### Build Issues
- Clear `node_modules` and reinstall
- Check Node.js version (16+)
- Verify all dependencies installed

## 📚 Documentation

- [SSO & Push Setup Guide](./SSO_PUSH_SETUP.md) - Detailed configuration
- [API Documentation](./SSO_PUSH_SETUP.md#-api-endpoints) - Endpoint reference

## 💰 Cost Breakdown

- ✅ **Google OAuth**: FREE
- ✅ **Web Push**: FREE
- ✅ **Android Push** (Firebase): FREE
- ⚠️ **iOS Push**: Requires Apple Developer Account ($99/year)
- ✅ **Backend Hosting**: FREE tier available (Vercel, Heroku, Railway)

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support and questions:
- Check [SSO_PUSH_SETUP.md](./SSO_PUSH_SETUP.md) for setup help
- Create an issue on GitHub
- Review the troubleshooting guide
