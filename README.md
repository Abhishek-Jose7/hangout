This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🚀 Hangout Planner - Plan the Perfect Meetup Together

A modern web application for planning group meetups with smart location suggestions, voting, and real-time coordination.

## ✨ Features

- **📍 Smart Location Suggestions** - AI-powered location finding based on group preferences
- **💬 Group Voting** - Democratic decision making for meetup spots
- **⚡ Real-time Coordination** - Live updates and tracking
- **💰 Budget Matching** - Cost-aware location suggestions
- **🎭 Vibe Selector** - Mood-based recommendations

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Clerk Auth with Google OAuth
- **Real-time**: Socket.io for live updates
- **AI**: Google Gemini for location suggestions

## 📋 Prerequisites

- Node.js 18+ and npm
- A Clerk application ([Create one here](https://clerk.com))
- A Supabase project ([Create one here](https://supabase.com))
- Google Cloud Project with Gemini API enabled

## 🔧 Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd hangout-planner
npm install
```

### 2. Clerk + Supabase Setup

#### **Clerk Authentication Setup**
1. **Create a Clerk Application**
   - Go to [clerk.com](https://clerk.com)
   - Click "Add application"
   - Fill in your application details

2. **Configure Google OAuth**
   - In your Clerk dashboard, go to **Authentication** > **Social providers**
   - Enable Google OAuth and configure:
     - Client ID: Your Google OAuth client ID
     - Client Secret: Your Google OAuth client secret

3. **Configure Redirect URLs**
   - In Clerk dashboard, go to **Authentication** > **URLs**
   - Add these URLs:
     - Production: `https://your-domain.com`
     - Development: `http://localhost:3000`

4. **Get Your Clerk API Keys**
   - In Clerk dashboard, go to **API Keys**
   - Copy your **Publishable key** and **Secret key**

#### **Supabase Database Setup**
1. **Create a Supabase Project**
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Click "New Project"
   - Fill in your project details

2. **Configure Database Schema**
   - In your Supabase dashboard, go to **SQL Editor**
   - Run the following SQL to create tables:

```sql
-- Groups table
CREATE TABLE groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Members table (uses Clerk user IDs)
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  budget DECIMAL(10,2) NOT NULL,
  mood_tags TEXT NOT NULL,
  clerk_user_id TEXT NOT NULL,
  email TEXT,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Itinerary votes table
CREATE TABLE itinerary_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  itinerary_idx INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_members_group_id ON members(group_id);
CREATE INDEX idx_members_clerk_user_id ON members(clerk_user_id);
CREATE INDEX idx_votes_group_id ON itinerary_votes(group_id);
CREATE INDEX idx_votes_member_id ON itinerary_votes(member_id);
```

3. **Get Your Supabase API Keys**
   - In Supabase dashboard, go to **Settings** → **API**
   - Copy your **Project URL** and **anon/public key**

#### **Environment Variables**
Update your `.env.local` file with all required keys:

```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Supabase Configuration (for data storage)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini API (for location suggestions)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
```

### 3. Google Gemini API Setup

1. **Enable Gemini API**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the Gemini API for your project
   - Create an API key

2. **Add to Environment**
   - Add your Gemini API key to `.env.local`

### 4. Run the Application

```bash
npm run dev
# or
npm run build && npm start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔐 Authentication Flow

1. Users sign in with Google OAuth via Clerk Auth
2. Authentication state is managed globally via React Context
3. Protected routes and API endpoints verify authentication with Clerk
4. User data is managed by Clerk with unique user IDs

## 💾 Data Storage (Supabase)

Application data is stored in Supabase (PostgreSQL):

- **groups**: Persistent storage with unique codes
- **members**: Linked to Clerk user IDs (`clerk_user_id`)
- **itinerary_votes**: Real-time voting data

**Database Schema**: See setup instructions above for complete SQL schema.

## 🚀 Deployment

The app is ready for deployment to platforms like Vercel, Netlify, or any Node.js hosting service.

### **Vercel Deployment (Recommended)**

1. **Connect your GitHub repository** to Vercel
2. **Set Environment Variables** in Vercel Dashboard:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GOOGLE_GENERATIVE_AI_API_KEY`

3. **Deploy automatically** on push to main branch

### **Local Development**

1. **Set up environment variables** in `.env.local`
2. **Run the development server**:
   ```bash
   npm run dev
   ```
3. **Socket.io will work locally** for real-time features

### **Important Notes**

- **Real-time features** (Socket.io) work locally but are disabled on Vercel
- **Supabase handles data persistence** across all environments
- **Clerk handles authentication** across all environments

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Socket.io](https://socket.io/docs/)

## 🔧 Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Issues**
   - Ensure Google OAuth is properly configured in Clerk
   - Check that your Clerk publishable and secret keys are correct
   - Verify redirect URLs match your environment

2. **Database Connection Errors**
   - Verify your Supabase URL and anon key are correct
   - Check that your Supabase project is active
   - Ensure database tables are created with correct schema

3. **Build Errors**
   - Clear `.next` folder and node_modules
   - Reinstall dependencies: `rm -rf node_modules && npm install`
   - Check that all environment variables are set correctly

4. **Runtime Errors**
   - Make sure Clerk middleware is properly configured
   - Verify API routes are using Clerk's `auth()` function correctly
   - Check Supabase client configuration

For more help:
- [Clerk Documentation](https://docs.clerk.com)
- [Supabase Documentation](https://supabase.com/docs)

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Environment Variables

Create a `.env` at the project root (do not commit it), or set these in Vercel Project Settings → Environment Variables:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
MAPS_API_KEY=your_google_maps_places_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### Supabase (Postgres)
- In Supabase → Project Settings → Database → Connection string → copy the URI (use `?sslmode=require`).
- Set `DATABASE_URL` locally and on Vercel.
- On Vercel, the build runs:
  - `prisma generate` (postinstall)
  - `prisma migrate deploy && next build`

Initial setup locally:
```
npx prisma generate
npx prisma migrate dev --name init
```

## Vercel troubleshooting

- Ensure `DATABASE_URL` and `GEMINI_API_KEY` are configured in the Vercel Project → Settings → Environment Variables (Production and Preview as needed).
- Do not commit `.env` with real secrets. Use `.env.example` as a template.
- If Prisma fails during build on Vercel, enable the `POSTINSTALL` or ensure `prisma generate` runs during install. The `build` script already runs `prisma migrate deploy && next build`.