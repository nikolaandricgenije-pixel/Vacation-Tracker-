# Vacation Tracker Pro - PWA & Mobile App

A comprehensive time tracking and vacation management application with PWA capabilities and native mobile wrappers.

## 🚀 Features

- **Multi-level Approval System**: Employee → Project Manager → Admin/CEO
- **Time Tracking**: Clock in/out with break management and overtime calculation
- **Vacation Management**: Request, approve, and track vacation time
- **PWA Support**: Installable web app with offline capabilities
- **Mobile Apps**: Native Android APK and iOS app wrappers
- **Real-time Notifications**: Push notifications and in-app alerts
- **Responsive Design**: Optimized for desktop, tablet, and mobile

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

## 🛠️ Development Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- Android Studio (for Android builds)
- Xcode (for iOS builds, macOS only)

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## 📱 Mobile App Builds

### Android APK Build

#### Prerequisites
- Android Studio installed
- Android SDK configured

#### Build Steps
```bash
# Build the web app
npm run build

# Sync with Capacitor
npm run build:android

# Open in Android Studio
npm run open:android
```

#### In Android Studio:
1. Wait for Gradle sync to complete
2. Go to Build → Generate Signed APK/Bundle
3. Follow the wizard to create a signed APK
4. The APK will be in `android/app/build/outputs/apk/release/`

### iOS App Build (macOS only)

#### Prerequisites
- Xcode installed
- iOS Simulator or physical device
- Apple Developer Account (for App Store distribution)

#### Build Steps
```bash
# Build the web app
npm run build

# Sync with Capacitor
npm run build:ios

# Open in Xcode
npm run open:ios
```

#### In Xcode:
1. Select your development team
2. Choose a device/simulator
3. Click Product → Archive for distribution
4. Follow Apple's distribution guide

## 🔧 Configuration

### PWA Settings
- **Manifest**: `public/manifest.json`
- **Service Worker**: `public/sw.js`
- **Icons**: Add PNG icons to `public/` directory

### Capacitor Configuration
- **Config**: `capacitor.config.ts`
- **Android**: `android/` directory
- **iOS**: `ios/` directory

## 📋 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build

# Mobile Builds
npm run build:android    # Build and sync Android app
npm run build:ios        # Build and sync iOS app
npm run open:android     # Open Android project in Android Studio
npm run open:ios         # Open iOS project in Xcode

# Code Quality
npm run lint             # Run ESLint
```

## 🎯 User Roles & Permissions

### Employee
- Clock in/out and track time
- Request vacation, paid leave, sick leave
- View personal requests and time data

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

- **Time Synchronization**: Prevents time manipulation
- **Local Storage**: All data stored locally
- **Offline Capability**: Works without internet
- **Push Notifications**: Secure notification system

## 📊 Data Storage

- **Local Storage**: All user data stored in browser
- **IndexedDB**: Large data sets and offline cache
- **Service Worker**: Background sync and caching

## 🚀 Deployment

### Web Deployment
```bash
npm run build
# Deploy the 'dist' folder to your web server
```

### App Store Deployment
1. **Android**: Generate signed APK and upload to Google Play
2. **iOS**: Archive in Xcode and upload to App Store Connect

## 🐛 Troubleshooting

### PWA Issues
- Clear browser cache and service worker
- Check browser compatibility
- Ensure HTTPS in production

### Mobile Build Issues
- Ensure all prerequisites are installed
- Check Capacitor configuration
- Verify Android/iOS SDK versions

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting guide
