# 🚀 Group Meetup Planner

A modern, AI-powered web application for planning group meetups with real-time collaboration and interactive maps.

![Group Meetup Planner](https://img.shields.io/badge/Next.js-15.5.0-black) ![React](https://img.shields.io/badge/React-19.1.0-blue) ![Prisma](https://img.shields.io/badge/Prisma-6.14.0-green) ![Firebase](https://img.shields.io/badge/Firebase-12.1.0-orange)

## ✨ Features

- **🤖 AI-Powered Location Suggestions** - Smart recommendations based on group preferences using Google Gemini AI
- **🗺️ Interactive Maps** - Visualize member locations and suggested meetup spots with Leaflet
- **⚡ Real-time Collaboration** - Live updates using Socket.io for instant group synchronization
- **🔐 Secure Authentication** - Firebase Auth with Google OAuth integration
- **📱 Mobile-First Design** - Responsive UI with beautiful animations and modern styling
- **🎯 Smart Voting System** - Real-time voting with automatic location finalization
- **🔔 Live Notifications** - Instant feedback for all group activities

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- A modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd hang2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory with:

   ```env
   # Database (SQLite for development, PostgreSQL for production)
   DATABASE_URL="file:./dev.db"

   # Firebase Configuration (Required)
   NEXT_PUBLIC_FIREBASE_API_KEY="your_firebase_api_key"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
   NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef123456"

   # Google AI (Gemini) API Key (Required for location suggestions)
   GEMINI_API_KEY="your_gemini_api_key"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🚀 Production Deployment

### Option 1: Vercel (Recommended)

1. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel --prod
   ```

2. **Set Environment Variables** in Vercel Dashboard:
   - Go to your project → Settings → Environment Variables
   - Add all variables from `.env.local` (use PostgreSQL for production)

3. **Deploy**
   ```bash
   git push origin main
   ```

### Option 2: Railway

1. Connect your GitHub repository to Railway
2. Add environment variables in Railway dashboard
3. Deploy automatically on push

## 🔧 Configuration

### Database Setup

#### Development (SQLite)
- Uses local SQLite database (dev.db)
- Perfect for development and testing

#### Production (PostgreSQL)
- Recommended: Supabase, Railway, or Neon
- Update `DATABASE_URL` in environment variables

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication with Google provider
4. Copy configuration to `.env.local`

### Google AI Setup

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an API key
3. Add to `GEMINI_API_KEY` in environment variables

## 📊 API Reference

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/groups` | Create a new group |
| GET | `/api/groups/[code]` | Get group details |
| POST | `/api/members` | Join a group |
| GET | `/api/locations?groupId={id}` | Get AI location suggestions |
| POST | `/api/votes` | Vote on locations |

## 🔒 Security

- **Authentication**: Firebase Auth with secure tokens
- **Database**: Parameterized queries prevent SQL injection
- **API**: Input validation and rate limiting
- **Headers**: Security headers configured

## 📈 Performance

- **Bundle Optimization**: Code splitting and tree shaking
- **Image Optimization**: Next.js Image component with WebP/AVIF
- **Database**: Connection pooling and query optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

**Made with ❤️ for group meetup planning**
