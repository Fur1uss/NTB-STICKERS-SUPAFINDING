# 🎮 NTB Stickers SupaFinding

> **A competitive sticker hunting game built for Supabase Launch Week 15 Hackathon - where players discover, collect, and compete with digital stickers in real-world locations.**

[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=flat&logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Hackathon](https://img.shields.io/badge/Hackathon-LW15-FF6B6B?style=flat&logo=trophy&logoColor=white)](https://supabase.com/launch-week)

## 🏆 Supabase Launch Week 15 Hackathon Entry

This project was built for **Supabase Launch Week 15 Hackathon**, showcasing the power of Supabase's real-time database, authentication, and storage capabilities in a fun, competitive gaming experience.

### 🚀 **Supabase Features Used**
- **📊 Real-time Database**: Live leaderboard updates and player statistics
- **🔐 Authentication**: User management and session handling  
- **💾 Storage**: Sticker image uploads and file management
- **⚡ Edge Functions**: Server-side logic and API endpoints
- **🔄 Real-time Subscriptions**: Live updates for competitive gameplay

## 📖 Table of Contents

- [🎯 Overview](#-overview)
- [🏆 Hackathon Features](#-hackathon-features)
- [✨ Game Features](#-game-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Supabase Setup](#️-supabase-setup)
- [📱 Usage](#-usage)
- [🛠️ Development](#️-development)
- [📁 Project Structure](#-project-structure)
- [🔌 API Integration](#-api-integration)
- [🎮 Game Mechanics](#-game-mechanics)
- [🎯 Contributing](#-contributing)

## 🎯 Overview

**NTB Stickers SupaFinding** is an innovative location-based competitive game that leverages Supabase's powerful backend-as-a-service platform. Players explore real-world locations to discover hidden digital stickers, build collections, and compete on real-time leaderboards.

### 🎮 Core Concept

Transform everyday locations into treasure hunting grounds powered by Supabase's real-time capabilities:
- **Discover** stickers with live location tracking
- **Collect** unique digital assets stored in Supabase Storage
- **Compete** on real-time leaderboards with live updates
- **Create** and share content through Supabase's robust API

## 🏆 Hackathon Features

### 🔥 **Supabase Integration Highlights**

#### 📊 **Real-time Database**
```sql
-- Users table with live stats tracking
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  stickers_collected INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stickers table with location data
CREATE TABLE stickers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  user_id UUID REFERENCES users(id),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### ⚡ **Real-time Subscriptions**
```javascript
// Live leaderboard updates
const { data, error } = await supabase
  .from('users')
  .select('*')
  .order('stickers_collected', { ascending: false })
  .limit(10);

// Real-time subscription for live updates
supabase
  .channel('leaderboard')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, 
    (payload) => updateLeaderboard(payload)
  )
  .subscribe();
```

#### 💾 **Storage Integration**
```javascript
// Upload sticker images to Supabase Storage
const { data, error } = await supabase.storage
  .from('stickers')
  .upload(`${userId}/${Date.now()}-${file.name}`, file);
```

#### 🔐 **Authentication Flow**
- Anonymous user creation for quick game start
- Session management with Supabase Auth
- User persistence across sessions

## ✨ Game Features

### 🔍 **Real-time Sticker Discovery**
- **Live location tracking** with Supabase real-time updates
- **Proximity-based discovery** using PostGIS extensions
- **Instant collection feedback** with real-time database changes

### 📊 **Live Competitive Leaderboards**
- **Real-time rankings** updated instantly across all clients
- **Global player statistics** with Supabase aggregations
- **Live player count** and activity tracking

### 📤 **Cloud-based Content Creation**
- **Supabase Storage** for sticker image hosting
- **Real-time content sharing** across the platform
- **CDN-powered delivery** for fast image loading

## 🏗️ Architecture

### **Frontend** (React.js + Supabase Client)
```
📱 React Application
├── 🎨 Component-based UI
├── 🔄 Supabase real-time subscriptions
├── 📡 Supabase Client integration
├── 🎭 Custom animations
└── 📱 Responsive design
```

### **Backend** (Supabase)
```
🚀 Supabase Backend
├── 📊 PostgreSQL database
├── ⚡ Real-time subscriptions
├── 💾 Storage buckets
├── 🔐 Authentication
├── 🛡️ Row Level Security
└── 🔌 Auto-generated APIs
```

## 🚀 Getting Started

### 📋 Prerequisites

- **Node.js** 18.0 or higher
- **Supabase Account** (free tier works!)
- **Git** for version control

### ⚙️ Supabase Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Set up Database Tables**
   ```sql
   -- Run these in your Supabase SQL editor
   
   -- Users table
   CREATE TABLE users (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     stickers_collected INTEGER DEFAULT 0,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Stickers table
   CREATE TABLE stickers (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     description TEXT,
     image_url TEXT,
     user_id UUID REFERENCES users(id),
     latitude DECIMAL(10,8),
     longitude DECIMAL(11,8),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Enable Row Level Security
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE stickers ENABLE ROW LEVEL SECURITY;
   
   -- Create policies for public read access
   CREATE POLICY "Public read access" ON users FOR SELECT USING (true);
   CREATE POLICY "Public read access" ON stickers FOR SELECT USING (true);
   ```

3. **Set up Storage Bucket**
   ```sql
   -- Create storage bucket for sticker images
   INSERT INTO storage.buckets (id, name, public) VALUES ('stickers', 'stickers', true);
   
   -- Create policy for public access
   CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'stickers');
   CREATE POLICY "Authenticated upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'stickers');
   ```

### 🔧 Installation

1. **Clone and Setup**
   ```bash
   git clone https://github.com/yourusername/NTB-STICKERS-SUPAFINDING.git
   cd NTB-STICKERS-SUPAFINDING
   ```

2. **Install Dependencies**
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend (if using additional Node.js services)
   cd ../backend
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Create .env in frontend directory
   cd frontend
   cp .env.example .env
   ```
   
   ```env
   # .env file
   REACT_APP_SUPABASE_URL=your-supabase-url
   REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

### ▶️ Running the Application

```bash
cd frontend
npm start
# Application runs on http://localhost:3000
```

## 🔌 API Integration

### 🔄 **Real-time Subscriptions**
```javascript
// Subscribe to leaderboard changes
useEffect(() => {
  const channel = supabase
    .channel('leaderboard-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'users' },
      (payload) => {
        console.log('Leaderboard updated:', payload);
        fetchLeaderboard();
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);
```

### 💾 **Storage Operations**
```javascript
// Upload sticker image
const uploadSticker = async (file, metadata) => {
  const fileName = `${userId}/${Date.now()}-${file.name}`;
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('stickers')
    .upload(fileName, file);
    
  if (uploadError) throw uploadError;
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('stickers')
    .getPublicUrl(fileName);
    
  return publicUrl;
};
```

### 📊 **Database Queries**
```javascript
// Get leaderboard with real-time updates
const fetchLeaderboard = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('stickers_collected', { ascending: false })
    .limit(10);
    
  if (error) throw error;
  return data;
};

// Add new sticker
const createSticker = async (stickerData) => {
  const { data, error } = await supabase
    .from('stickers')
    .insert([stickerData])
    .select();
    
  if (error) throw error;
  return data[0];
};
```

## 🎮 Game Mechanics

### 🎯 **Scoring System**
- **Real-time point updates** via Supabase triggers
- **Automatic leaderboard ranking** with PostgreSQL functions
- **Achievement tracking** in user profiles

### 🗺️ **Location-based Discovery**
- **PostGIS integration** for geographic queries
- **Proximity detection** using Supabase functions
- **Real-time location updates** for multiplayer features

### 🏆 **Competitive Features**
- **Live leaderboards** with real-time subscriptions
- **Global player statistics** aggregated in real-time
- **Achievement system** powered by database triggers

## 🛠️ Development

### 🧪 **Testing with Supabase**
```javascript
// Test database connections
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// Test query
const testConnection = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('count');
  
  console.log('Connection test:', { data, error });
};
```

### 🚀 **Deployment**
- **Frontend**: Deploy to Vercel/Netlify with Supabase environment variables
- **Database**: Managed by Supabase (PostgreSQL)
- **Storage**: Handled by Supabase Storage with CDN

## 🎯 Contributing

This project showcases Supabase capabilities for the LW15 Hackathon. Contributions that enhance the Supabase integration are especially welcome!

### 🔄 **Contribution Focus Areas**
- **Real-time features** using Supabase subscriptions
- **Advanced PostgreSQL** queries and functions
- **Storage optimization** for game assets
- **Authentication enhancements** with Supabase Auth

---

## 🏆 **Hackathon Submission**

**Built for Supabase Launch Week 15 Hackathon**

**Team**: NTB Development Team  
**Category**: Gaming & Real-time Applications  
**Supabase Features**: Database, Storage, Real-time, Auth

### 🌟 **Why Supabase?**

Supabase enabled us to build a complex, real-time multiplayer game with:
- ⚡ **Instant setup** - Database and APIs ready in minutes
- 🔄 **Real-time magic** - Live leaderboards without complex WebSocket management
- 💾 **Powerful storage** - Image uploads with CDN delivery out of the box
- 🛡️ **Security first** - Row Level Security for data protection
- 📈 **Scalability** - PostgreSQL performance for competitive gaming

---

**Happy Sticker Hunting!** 🎯✨

*Powered by Supabase - The open source Firebase alternative*
