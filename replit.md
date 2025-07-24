# Hiring Pipeline & Intelligence Platform

## Overview

This is a full-stack hiring pipeline and intelligence platform built with React, Node.js/Express, and PostgreSQL. The application provides a comprehensive solution for managing candidates through various stages of the hiring process, featuring a Kanban-style pipeline, real-time interview capabilities, and intelligent analytics.

## Recent Changes

**January 24, 2025 - Migration to MongoDB Atlas Complete**
- Migrated from PostgreSQL to MongoDB Atlas
- Replaced Drizzle ORM with Mongoose for MongoDB operations
- Updated all schemas from Drizzle pgTable to Mongoose Schema
- Modified storage layer to use MongoDB ObjectIds instead of integer IDs
- Updated all API routes to handle string-based MongoDB IDs
- Removed PostgreSQL dependencies and added MongoDB/Mongoose packages
- System now requires MONGODB_URI environment variable for connection

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
- Multiple pipeline stages: New, Qualified, Interview Scheduled, Analysis Complete, Hired
- Real-time candidate status updates
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