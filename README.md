# Hiring Pipeline & Intelligence Platform

A comprehensive hiring pipeline and intelligence platform built with React, Node.js/Express, and MongoDB Atlas. The application provides a complete solution for managing candidates through various stages of the hiring process, featuring a streamlined Kanban-style pipeline, real-time interview capabilities with AI assistance, and intelligent analytics with calendar synchronization.

## 📈 Recent Updates (August 2025)

- **MongoDB Atlas Integration**: Successfully migrated from PostgreSQL to MongoDB Atlas with ideofuzion database
- **Modern UI Design**: Implemented glass-morphism effects across all pages (Dashboard, Pipeline, Candidates)
- **Enhanced Live Interview**: Added mini reload button, current candidate detection, and searchable dropdown
- **Calendar Management**: Dual slot system (available/busy) with webhook integration to EC2 instance
- **Webhook Automation**: Multiple N8N workflow integrations for calendar updates and session management
- **Responsive Design**: Optimized for all screen sizes with consistent modern aesthetics
- **Real-time Features**: WebSocket integration for live updates and interview assistance

## 🚀 Key Features

### Pipeline Management
- **Streamlined Hiring Pipeline**: Three-stage pipeline (Interview Scheduled → Analysis Phase → Hired)
- **Candidate Management**: Comprehensive profiles with resume links and 3-dot action menus
- **Automatic Status Updates**: Candidates with past interview dates automatically move to Analysis Phase
- **Calendar Integration**: N8N workflow integration for calendar event management

### Live Interview Hub  
- **AI Interview Assistant**: Real-time transcript analysis with mini reload button
- **Transcript Integration**: MongoDB-based transcript storage and retrieval by Google Meet ID
- **Current Candidate Detection**: Automatic detection of ongoing interviews based on timing
- **Searchable Candidate Dropdown**: Unified combobox interface for candidate selection
- **Live Analysis Trigger**: "Fetch Analysis" button with dual webhook integration
- **Start Session**: Webhook integration for session initiation
- **Responsive Design**: Modern glass-morphism effects optimized for all devices

### Calendar & Slot Management
- **Available Slots**: Interactive calendar popup for adding available time slots
- **Busy Slots Management**: Separate busy slots tracking with orange theme
- **Multiple Time Slots**: Add multiple time slots per day with 15-minute intervals
- **ISO Format Storage**: All dates and times stored in MongoDB in ISO format
- **Dashboard Integration**: Both "Add Available Slots" and "Add Busy Slots" buttons
- **Webhook Integration**: Automatic EC2 instance notifications for calendar updates

### Analytics & Dashboard
- **Modern Glass Design**: Sleek glass-morphism effects with gradient cards
- **Real-time Metrics**: Total candidates, interviews scheduled, analysis phase tracking
- **Hiring Funnel**: Visual pipeline progression with streamlined stages
- **Status Tracking**: Distinctive color schemes (emerald green for hired candidates)
- **Calendar Widgets**: Available and busy slots display with modern UI
- **Upcoming Interviews**: Interview management with extend meeting functionality

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript using Vite for development
- **Tailwind CSS** with shadcn/ui component library
- **TanStack Query** (React Query) for server state management
- **Wouter** for lightweight client-side routing
- **Radix UI** primitives for accessible components

### Backend
- **Node.js** with Express.js framework
- **TypeScript** with ES modules
- **WebSocket** server for real-time interview features
- **JWT** authentication with bcryptjs password hashing
- **RESTful API** with comprehensive error handling

### Database & Storage
- **MongoDB Atlas** cloud database (ideofuzion database)
- **Mongoose** ODM for object modeling and operations
- **Collections**: candidates, transcripts, available_slots, busy_slots, jobCriteria
- **Zod** schemas for runtime type validation

### External Integrations
- **N8N Workflows**: Multiple EC2 instance endpoints for different automation tasks
- **Calendar Sync**: Webhook integration for calendar event management and updates
- **Meeting Extensions**: Automatic webhook triggers for meeting time changes
- **Busy Slots Sync**: Real-time busy slot updates via webhook integration
- **Pakistani Timezone**: Automatic interview date parsing and status updates
- **Dual Webhook Support**: Fallback webhook system for maximum reliability

## 📋 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account and connection string
- Environment variables configuration

### Environment Setup
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ideofuzion
JWT_SECRET=your-super-secure-jwt-secret-key
NODE_ENV=development
```

### Installation Steps
```bash
# Clone the repository
git clone <repository-url>
cd hiring-pipeline-platform

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`

## ⚡ Current Status

- **Database**: ✅ MongoDB Atlas connected (ideofuzion database)
- **Server**: ✅ Running on port 5000 with Express and WebSocket
- **Authentication**: ✅ JWT-based auth system active
- **API Endpoints**: ✅ All routes functional (candidates, slots, transcripts)
- **Frontend**: ✅ React application with modern UI and glass effects
- **N8N Integration**: ✅ Webhook endpoints configured for calendar sync
- **Real-time Features**: ✅ WebSocket server for live interview updates

### Verified Working Features
- MongoDB Atlas connection and data persistence
- Available and busy slots management with calendar popup
- Candidate management with 3-dot action menus
- Live interview hub with transcript integration
- Dashboard analytics with hiring funnel
- Webhook integration for calendar events

## 🏗️ Project Structure

```
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/       # UI components including AddAvailableSlotsDialog
│   │   ├── pages/           # Dashboard, Candidates, Live Interview pages
│   │   ├── lib/             # Authentication and query client utilities
│   │   └── hooks/           # Custom React hooks
├── server/                   # Backend Express application
│   ├── routes.ts            # API routes including available slots endpoints
│   ├── storage.ts           # MongoDB storage interface
│   └── index.ts             # Server entry point with WebSocket setup
├── shared/                   # Shared types and schemas
│   └── schema.ts            # Mongoose schemas and Zod validation
└── attached_assets/          # Generated images and uploaded files
```

## 🔄 Architecture Overview

### Enhanced Features
- **Status Text Update**: Changed "Analysis Complete" to "Analysis Ongoing" across all UI elements
- **Calendar Popup**: Full implementation of available slots management with date picker
- **3-Dot Menu**: Enhanced candidate actions (View, Edit, Delete) with proper dialog separation
- **MongoDB Integration**: Complete migration to MongoDB Atlas with proper field mapping
- **Webhook Integration**: N8N calendar synchronization with comprehensive error handling
- **Responsive Design**: Improved mobile and tablet compatibility for Live Interview page

### Database Collections
- **candidates**: Candidate profiles with interview scheduling
- **transcripts**: AI interview transcripts with timestamp data
- **available_slots**: Calendar slots in ISO format with date/time ranges
- **jobCriteria**: Job requirements and criteria data

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication with JWT
- `POST /api/auth/register` - User registration

### Candidates
- `GET /api/candidates` - List all candidates with status filtering
- `POST /api/candidates` - Create new candidate
- `PUT /api/candidates/:id` - Update candidate with N8N webhook trigger
- `DELETE /api/candidates/:id` - Delete candidate

### Transcripts
- `GET /api/transcripts/latest` - Get latest interview transcript
- `POST /api/transcripts` - Create new transcript

### Available Slots
- `GET /api/available-slots` - List available time slots
- `POST /api/available-slots` - Create new time slot
- `DELETE /api/available-slots/:id` - Remove time slot

### Analytics
- `GET /api/dashboard/metrics` - Dashboard metrics and funnel data

## 🔒 Security & Authentication

- **JWT Authentication** with localStorage token storage
- **Protected Routes** with middleware validation
- **Password Hashing** using bcryptjs
- **MongoDB Atlas Security** with connection string encryption
- **CORS Protection** for cross-origin requests

## 🚀 Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Single Command**: `npm run dev` handles both frontend and backend

### Environment Configuration
- **MongoDB Atlas**: Cloud database connection via MONGODB_URI
- **JWT Secret**: Secure token generation and validation
- **WebSocket Support**: Real-time communication for live interviews
- **Static File Serving**: Optimized asset delivery

## 🎯 Usage Guide

### Managing Candidates
1. View all candidates in the streamlined candidates page
2. Use 3-dot menu for View, Edit, Delete actions
3. Filter by status including "Analysis Ongoing"
4. Automatic status progression based on interview dates

### Scheduling Available Slots
1. Click "Add Available Slots" on Dashboard
2. Select date using calendar popup
3. Add multiple time slots for the day
4. Slots saved in MongoDB in ISO format

### Live Interview Assistant
1. Access Live Interview Hub for real-time assistance
2. AI analyzes transcripts and provides insights
3. Reload functionality for latest transcript data
4. Full-screen responsive design for all devices

### Dashboard Analytics
1. Monitor key metrics and hiring funnel
2. Track candidates through three pipeline stages
3. View distinctive status indicators
4. Access upcoming interview schedules

## 📈 Performance Features

- **MongoDB Atlas**: Cloud-optimized database performance
- **React Query**: Efficient data fetching and caching
- **WebSocket Optimization**: Real-time communication with connection management
- **Lazy Loading**: Component-based code splitting
- **TypeScript**: Full-stack type safety and error prevention

## 🤝 Contributing

This project follows modern web development best practices with comprehensive TypeScript support, MongoDB integration, and real-time features. The modular architecture allows for easy scaling and maintenance while providing a rich user experience for hiring teams.

---

Built for modern hiring teams seeking efficient, intelligent recruitment solutions with real-time collaboration and AI-powered insights!
