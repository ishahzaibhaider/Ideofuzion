# Hiring Pipeline & Intelligence Platform

## Overview

This is a full-stack hiring pipeline and intelligence platform built with React, Node.js/Express, and PostgreSQL. The application provides a comprehensive solution for managing candidates through various stages of the hiring process, featuring a Kanban-style pipeline, real-time interview capabilities, and intelligent analytics.

## Recent Changes

**January 31, 2025 - Migration Complete + Enhanced Candidate Management with 3-Dot Menu**
- Successfully completed migration from Replit Agent to standard Replit environment
- Configured MongoDB Atlas connection with MONGODB_URI environment variable
- Fixed all TypeScript compilation errors and LSP diagnostics issues
- Enhanced Live Interview page responsiveness for all screen sizes including laptops
- Implemented functional "View Full Resume" button that opens candidate resume links from database
- Added distinctive color scheme for hired candidates in dashboard (emerald green highlighting)
- Removed sync CVs button from navigation bar as requested
- Improved grid layout for Live Interview page (better mobile/tablet/desktop responsiveness)
- Updated candidate schema to properly include "Resume Link" field
- Streamlined pipeline structure: removed "Qualified" and "New Application" sections, renamed "Analysis Complete" to "Analysis Phase"
- Implemented automatic status updates: candidates with past interview dates (Pakistan time) auto-move to Analysis Phase
- Updated dashboard funnel to reflect new pipeline structure (removed Qualified section)
- All existing candidate and job criteria data preserved from ideofuzion database
- Application now runs cleanly on Replit with proper client/server separation
- Maintained secure environment variable configuration for database connection
- **LATEST:** Added 3-dot dropdown menu for candidate actions (View, Edit, Delete) in candidates page
- **LATEST:** Fixed dropdown menu dialog conflicts by separating dialogs from dropdown menu structure
- **LATEST:** Fixed MongoDB data update mapping between frontend and database field names with proper logging
- **LATEST:** Enhanced webhook integration with EC2 instance (http://54.226.92.93:5678/) for calendar updates
- **LATEST:** Improved candidate update process with proper field mapping and comprehensive webhook data
- **LATEST:** Changed "Analysis Complete" status text to "Analysis Ongoing" across all UI elements including badges and dropdowns
- **LATEST:** Implemented "Add Available Slots" button on Dashboard with full calendar popup functionality
- **LATEST:** Created calendar component with date picker and multiple time slot management
- **LATEST:** Added available slots API endpoints with MongoDB integration storing data in ISO format
- **LATEST:** Updated README.md to reflect current project state with MongoDB Atlas, N8N integration, and latest features
- **LATEST (August 5, 2025):** Successfully completed migration from Replit Agent to standard Replit environment
- **LATEST:** Enhanced Live Interview page with automatic current candidate detection based on interview timing
- **LATEST:** Fixed MongoDB transcript integration - AI Assistant now properly fetches and displays transcript data
- **LATEST:** Implemented real-time current candidate API that detects ongoing vs upcoming interviews
- **LATEST:** Added proper authentication for transcript endpoints and enhanced debugging
- **LATEST:** Live Interview page now automatically shows current candidate during interview time and updates every 30 seconds
- **LATEST:** Enhanced Live Interview page with unified searchable candidate dropdown
- **LATEST:** Fixed transcript fetching to properly match candidates by Google Meet ID
- **LATEST:** Implemented single combobox interface for candidate selection with search functionality
- **LATEST:** Added support for selecting any candidate (including past interviews) from dropdown
- **LATEST:** Fixed interview date/time display formatting using actual database fields
- **LATEST:** Added proper candidate-specific transcript API endpoint (/api/transcripts/by-meet-id/:meetId)
- **LATEST (August 6, 2025):** Successfully completed migration from Replit Agent to standard Replit environment with secure environment variables
- **LATEST:** Added "Fetch Analysis" button in Live Interview page that triggers analysis webhook with candidate meeting ID
- **LATEST:** Implemented webhook integration (http://54.226.92.93:5678/webhook/8a9f52c1-7a9d-44d9-8501-3787fbf302ff) for manual analysis triggering

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for development and bundling
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with custom styling via shadcn/ui

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Real-time Communication**: WebSocket server for live interview features
- **Authentication**: JWT-based stateless authentication

### Database Architecture
- **Database**: MongoDB Atlas cloud database (ACTIVE)
- **ODM**: Mongoose for MongoDB object modeling and operations
- **Schema Management**: Mongoose schemas with built-in validation
- **Validation**: Zod schemas for runtime type validation
- **Storage**: MongoStorage implementation using live MongoDB Atlas database

## Key Components

### Authentication System
- JWT-based authentication with token storage in localStorage
- Protected routes with middleware validation
- User registration and login endpoints
- Automatic token refresh handling

### Hiring Pipeline Management
- Kanban board interface with drag-and-drop functionality
- Streamlined pipeline stages: Interview Scheduled, Analysis Phase, Hired
- Automatic status updates: candidates with past interviews move to Analysis Phase
- Real-time candidate status updates based on Pakistani timezone
- Bulk operations for candidate management

### Live Interview Hub
- WebSocket-based real-time communication
- Interview session management
- Live transcript capture and analysis
- AI-powered interview insights and suggestions

### Dashboard Analytics
- Key metrics tracking (total candidates, interviews scheduled, etc.)
- Hiring funnel visualization
- Upcoming interviews management
- Performance analytics and reporting

### Candidate Management
- Comprehensive candidate profiles
- CV/Resume upload and storage
- Skills assessment and scoring
- Interview scheduling and tracking

## Data Flow

1. **Authentication Flow**: User logs in → JWT token generated → Token stored locally → Protected API requests include token
2. **Candidate Pipeline Flow**: New candidate → CV analysis → Qualification assessment → Interview scheduling → Live interview → Analysis → Hiring decision
3. **Real-time Updates Flow**: User action → WebSocket message → Real-time UI updates across connected clients
4. **Data Persistence Flow**: Frontend mutations → API endpoints → Drizzle ORM → PostgreSQL database

## External Dependencies

### Core Framework Dependencies
- React 18 with TypeScript support
- Express.js for backend API
- Mongoose ODM with MongoDB driver
- TanStack Query for data fetching
- Wouter for routing

### UI and Styling
- Tailwind CSS for utility-first styling
- Radix UI primitives for accessible components
- shadcn/ui component library
- Lucide React for icons

### Development Tools
- Vite for development server and bundling
- TypeScript for type safety
- ESBuild for production bundling
- PostCSS for CSS processing

### Authentication and Security
- JSON Web Tokens (jsonwebtoken)
- bcryptjs for password hashing
- CORS handling for cross-origin requests

### Real-time Features
- WebSocket (ws) for real-time communication
- Custom WebSocket manager for connection handling

## Deployment Strategy

### Build Process
- Frontend: Vite builds optimized static assets to `dist/public`
- Backend: ESBuild bundles server code to `dist/index.js`
- Single build command handles both frontend and backend

### Environment Configuration
- MongoDB Atlas connection string (MONGODB_URI) from environment variables
- JWT secret configuration
- Development vs production mode handling
- Replit-specific optimizations and integrations

### Hosting Requirements
- Node.js runtime environment
- MongoDB Atlas cloud database connection
- WebSocket support for real-time features
- Static file serving for frontend assets

The application is designed as a monorepo with shared TypeScript types and schemas between frontend and backend, ensuring type safety across the entire stack. The modular architecture allows for easy scaling and maintenance while providing a rich user experience for hiring teams.