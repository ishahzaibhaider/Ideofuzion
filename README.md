# Hiring Pipeline & Intelligence Platform

A comprehensive hiring pipeline and intelligence platform built with modern web technologies. This application streamlines the entire hiring process from candidate sourcing to final decision-making, featuring automated workflows, real-time collaboration, and intelligent analytics.

## Features

### 🎯 Core Functionality
- **Kanban Pipeline Board** - Visual drag-and-drop candidate management across hiring stages
- **Live Interview Hub** - Real-time interview sessions with transcript capture and analysis
- **Dashboard Analytics** - Comprehensive hiring metrics and performance tracking
- **Candidate Management** - Complete candidate profiles with CV analysis and scoring
- **N8N Integration** - Automated CV syncing and interview bot workflows
- **User Authentication** - Secure JWT-based authentication system

### 🔄 Hiring Pipeline Stages
1. **New** - Incoming candidates from various sources
2. **Qualified** - Candidates who meet initial requirements
3. **Interview Scheduled** - Candidates with confirmed interview appointments
4. **Analysis Complete** - Post-interview evaluation and scoring
5. **Hired** - Successful candidates ready for onboarding

### 🤖 Automation Features
- **CV Sync Automation** - Automatic candidate data import via N8N webhooks
- **Interview Bot** - Automated interview scheduling and management
- **Real-time Updates** - Live notifications and status changes across the platform
- **Intelligent Scoring** - AI-powered candidate evaluation and recommendations

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for development and bundling
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **TanStack Query** for state management
- **Wouter** for routing
- **Radix UI** primitives

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **WebSocket** for real-time communication
- **JWT** authentication
- **RESTful API** design

### Database
- **MongoDB Atlas** cloud database
- **Mongoose ODM** for MongoDB object modeling
- **Mongoose Schema** with built-in validation
- **Zod** for runtime validation

### External Integrations
- **N8N** workflow automation platform
- **WebSocket** real-time communication
- **JWT** secure authentication

## Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account and cluster
- N8N workspace (for automation features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hiring-pipeline-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # MongoDB Atlas connection string
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
   
   # JWT Secret
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Database Setup**
   - Create a MongoDB Atlas account at https://www.mongodb.com/atlas
   - Create a new cluster (free tier available)
   - Get your connection string and add it as MONGODB_URI
   - Database collections are created automatically when first used

5. **Start the application**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## Recent Migration: PostgreSQL to MongoDB Atlas

This project was recently migrated from PostgreSQL with Drizzle ORM to MongoDB Atlas with Mongoose. Here are the key changes:

### Files Modified/Created During Migration:

#### `server/db.ts` - Database Connection
- **Before**: PostgreSQL connection using Neon serverless driver
- **After**: MongoDB Atlas connection using Mongoose
- **New functionality**: `connectToDatabase()` and `disconnectFromDatabase()` functions
- **Environment variable**: Now requires `MONGODB_URI` instead of `DATABASE_URL`

#### `shared/schema.ts` - Database Schemas
- **Before**: Drizzle pgTable definitions with PostgreSQL-specific types
- **After**: Mongoose Schema definitions with MongoDB document structure
- **New exports**: `UserModel`, `JobModel`, `CandidateModel` Mongoose models
- **New interfaces**: `IUser`, `IJob`, `ICandidate` extending Mongoose Document
- **ID format**: Changed from integer IDs to MongoDB ObjectId strings

#### `server/storage.ts` - Database Storage Layer
- **Before**: `DatabaseStorage` class using Drizzle ORM queries
- **After**: `MongoStorage` class using Mongoose operations
- **New methods**: Helper functions to convert MongoDB documents to application types
- **ID handling**: Updated all methods to use string IDs instead of numbers
- **Error handling**: Enhanced error logging for MongoDB operations

#### `server/routes.ts` - API Routes
- **Modified**: Updated ID parsing from `parseInt(req.params.id)` to `req.params.id`
- **Compatibility**: All routes now handle MongoDB ObjectId strings
- **No functional changes**: All endpoints work the same way for frontend

#### Files Removed:
- `drizzle.config.ts` - No longer needed (Drizzle configuration)
- PostgreSQL dependencies removed from package.json

### Migration Benefits:
- **Scalability**: MongoDB Atlas provides automatic scaling
- **Cloud-native**: Fully managed database service
- **Flexibility**: Document-based structure for complex candidate data
- **Global distribution**: Built-in replication and backup
- **Performance**: Optimized for read-heavy workloads

## Database Schema (MongoDB Collections)

### Users Collection
- User authentication and profile information
- Stores admin and recruiter accounts
- Fields: _id, name, email, password (hashed), createdAt

### Jobs Collection
- Job postings and position details
- Required skills and status tracking
- Fields: _id, title, description, requiredSkills[], status, createdAt

### Candidates Collection
- Complete candidate profiles
- CV data, interview details, and analysis results
- Skills assessment and scoring
- Fields: _id, name, email, cvUrl, status, jobAppliedFor, interviewDetails{}, analysis{}, appliedDate, skills[], experience, previousRole, education, score

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/me` - Get current user

### Dashboard
- `GET /api/dashboard/metrics` - Get hiring metrics
- `GET /api/dashboard/upcoming-interviews` - Get scheduled interviews

### Candidates
- `GET /api/candidates` - List all candidates
- `POST /api/candidates` - Create new candidate
- `PUT /api/candidates/:id` - Update candidate
- `DELETE /api/candidates/status/:status` - Bulk delete by status

### Jobs
- `GET /api/jobs` - List all jobs
- `POST /api/jobs` - Create new job

### N8N Integration
- `GET /api/n8n/sync-cvs` - Trigger CV sync workflow
- `GET /api/n8n/start-interview` - Start interview bot workflow

## N8N Workflow Integration

The platform integrates with N8N for workflow automation:

### CV Sync Workflow
- **Webhook URL**: `https://ali-shoaib.app.n8n.cloud/webhook-test/9f3916ff-5ef8-47e2-8170-fea53c456554`
- **Purpose**: Automatically import candidate data from external sources
- **Trigger**: Manual sync via dashboard or scheduled automation

### Interview Bot Workflow  
- **Webhook URL**: `https://ali-shoaib.app.n8n.cloud/webhook-test/022f198b-9bb8-4ec8-8457-53df00516dbb`
- **Purpose**: Automate interview scheduling and management
- **Trigger**: When candidate moves to "Interview Scheduled" stage

### Setup Instructions
1. Ensure N8N workflows are activated in your N8N workspace
2. Click "Execute workflow" button in N8N for each workflow to enable webhooks
3. Test integration using the "Sync New CVs" and "Start Session" buttons in the platform

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and configurations
│   │   └── App.tsx         # Main application component
├── server/                 # Backend Express application
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route definitions  
│   ├── storage.ts         # MongoDB storage layer with MongoStorage class
│   ├── db.ts              # MongoDB Atlas connection configuration
│   └── vite.ts            # Vite integration
├── shared/                # Shared types and schemas
│   └── schema.ts          # Mongoose schemas and Zod validation
├── package.json           # Dependencies and scripts
├── tailwind.config.ts     # Tailwind CSS configuration
└── vite.config.ts         # Vite configuration
```

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run check` - TypeScript type checking

### Database Operations
- **Schema Changes**: Modify Mongoose schemas in `shared/schema.ts`
- **Data Queries**: Use MongoDB Atlas dashboard or connect with MongoDB Compass
- **Collections**: Created automatically when first document is inserted
- **Indexes**: Managed through MongoDB Atlas interface

## Deployment

The application is designed for deployment on Replit with the following features:
- Single build process for frontend and backend
- Environment variable configuration
- MongoDB Atlas cloud database integration
- WebSocket support for real-time features

### Production Build
```bash
npm run build
```

This creates optimized production builds:
- Frontend: Static assets in `dist/public`
- Backend: Bundled server code in `dist/index.js`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Architecture Decisions

### Why MongoDB Atlas + Mongoose?
- Cloud-hosted database with automatic scaling
- Flexible document-based data model
- Built-in replication and backup
- Excellent performance and reliability
- Easy integration with JavaScript/TypeScript

### Why React + Express?
- Proven full-stack JavaScript ecosystem
- Shared type definitions between frontend and backend
- Rich ecosystem of libraries and tools
- Easy deployment and scaling

### Why N8N Integration?
- No-code workflow automation
- Easy integration with external services
- Flexible trigger and action system
- Reduces manual data entry and processing

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Review the documentation above
- Check the project issues on GitHub
- Contact the development team

---

Built with ❤️ using modern web technologies for efficient hiring pipeline management.