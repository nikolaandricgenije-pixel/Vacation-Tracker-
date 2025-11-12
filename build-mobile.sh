#!/bin/bash

# Vacation Tracker Pro - Mobile Build Script
# This script builds both Android APK and iOS app

echo "🏗️  Building Vacation Tracker Pro for Mobile..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the Vacation Tracker root directory"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Installing dependencies..."
npm install

print_status "Building web application..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed. Please fix the errors and try again."
    exit 1
fi

print_success "Web application built successfully!"

# Android Build
print_status "Building Android APK..."
if command -v npx &> /dev/null; then
    npx cap sync android

    if [ $? -eq 0 ]; then
        print_success "Android project synced successfully!"
        print_status "To build APK:"
        echo "  1. Open Android Studio: npm run open:android"
        echo "  2. Wait for Gradle sync"
        echo "  3. Go to Build → Generate Signed APK/Bundle"
        echo "  4. Follow the wizard to create signed APK"
        echo "  5. APK will be in: android/app/build/outputs/apk/release/"
    else
        print_warning "Android sync failed. You may need to install Android Studio."
    fi
else
    print_error "npx not found. Please install Node.js properly."
fi

# iOS Build (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    print_status "Building iOS app..."
    npx cap sync ios

    if [ $? -eq 0 ]; then
        print_success "iOS project synced successfully!"
        print_status "To build iOS app:"
        echo "  1. Open Xcode: npm run open:ios"
        echo "  2. Select your development team"
        echo "  3. Choose device/simulator"
        echo "  4. Product → Archive for distribution"
    else
        print_warning "iOS sync failed. Make sure Xcode is installed."
    fi
else
    print_warning "iOS build skipped (not on macOS)"
fi

print_success "Mobile build process completed!"
print_status "Check the README.md for detailed deployment instructions."
print_status "PWA is ready to deploy from the 'dist' folder."