# Firebase Authentication Setup

This app now includes Firebase authentication to remember user logins and provide a better experience.

## Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Google Authentication:
   - Go to Authentication > Sign-in method
   - Enable Google provider
   - Add your domain to authorized domains

### 2. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select Web
4. Register your app and copy the configuration

### 3. Add Environment Variables

Create a `.env.local` file in your project root and add:

```env
# Database
DATABASE_URL="your_database_url"

# Google Gemini API
GEMINI_API_KEY="your_gemini_api_key"

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="your_firebase_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
```

### 4. Run Database Migration

```bash
npx prisma migrate dev --name add_firebase_auth
```

### 5. Start the Development Server

```bash
npm run dev
```

## Features Added

- **Firebase Authentication**: Users can sign in with Google
- **Persistent Login**: User sessions are remembered across browser sessions
- **Member Tracking**: Each user can only join a group once per account
- **Improved Event Suggestions**: More realistic hangout activities like:
  - Arcades and gaming centers
  - Bowling alleys
  - Cafes and coffee shops
  - Museums and galleries
  - Parks and outdoor spaces
  - Beaches and waterfront areas
  - Shopping centers and malls
  - Movie theaters
  - Escape rooms
  - Mini golf
  - Karaoke bars
  - Food courts and restaurants
  - Board game cafes
  - Trampoline parks
  - Laser tag
  - Ice skating rinks
  - Botanical gardens
  - Aquariums
  - Zoos
  - Sports activities

## How It Works

1. Users must sign in with Google to join groups
2. Their Firebase UID is stored with their member profile
3. If they return to a group they've already joined, they're automatically recognized
4. Event suggestions now focus on real, accessible activities people actually do when hanging out
