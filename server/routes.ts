import type { Express } from "express";
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcryptjs";
import { z } from "zod"; // Import Zod for validation
import { storage } from "./storage.js";
import { insertUserSchema, insertCandidateSchema, insertTranscriptSchema, insertUnavailableSlotSchema, insertBusySlotSchema, insertExtendedMeetingSchema, type Candidate } from "../shared/schema.js";
import { createN8nCredential, createN8nCredentialsFromAccessInfo, refreshTokensAndRecreateCredentials } from "./n8nService.js";
import { createUserWorkflows, ensureUserWorkflows, getUserWorkflows } from "./workflowService.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// ✨ Enhanced schema for job form data with optional skills support
const jobFormDataSchema = z.object({
  jobId: z.string().min(1, { message: "Job ID is required" }),
  jobTitle: z.string().min(1, { message: "Job Title is required" }),
  requiredSkills: z.array(z.string()).min(1, { message: "At least one required skill is necessary" }),
  optionalSkills: z.array(z.string()).optional().default([]), // Add optional skills support
});

// Authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ✨ HELPER FUNCTION to parse ISO date strings from Interview Start field
const parseInterviewDateTime = (interviewStart?: string): Date | null => {
  if (!interviewStart) {
    console.log('Missing Interview Start:', interviewStart);
    return null;
  }

  try {
    const date = new Date(interviewStart);
    if (isNaN(date.getTime())) {
      console.log('Invalid Interview Start format:', interviewStart);
      return null;
    }
    console.log('Successfully parsed Interview Start:', { input: interviewStart, output: date.toISOString() });
    return date;
  } catch (e) {
    console.error("Error parsing Interview Start:", interviewStart, e);
    return null;
  }
};


export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store active WebSocket connections
  const activeConnections = new Map<string, WebSocket>();

  wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const interviewId = url.searchParams.get('interviewId');

    if (interviewId) {
      activeConnections.set(interviewId, ws);
      console.log(`WebSocket connected for interview: ${interviewId}`);
    }

    ws.on('close', () => {
      if (interviewId) {
        activeConnections.delete(interviewId);
        console.log(`WebSocket disconnected for interview: ${interviewId}`);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Broadcast function for real-time updates
  const broadcast = (interviewId: string, data: any) => {
    const ws = activeConnections.get(interviewId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  };

  // Google OAuth routes
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  const clientRedirectPath = process.env.OAUTH_SUCCESS_REDIRECT || "/login";
  
  // REMOVED: Old conflicting OAuth callback route
  // The correct route is /auth/google/callback below

  app.get('/auth/google',
    passport.authenticate('google', { 
      scope: [
        'profile', 
        'email',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.send'
      ],
      accessType: 'offline',
      prompt: 'consent',
      includeGrantedScopes: true
    })
  );

  // REMOVED: Debug route for old callback URL

  app.get(
    '/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login?error=google' }),
    async (req: any, res) => {
      console.log(`🎯 [CALLBACK] /auth/google/callback route triggered`);
      console.log(`🎯 [CALLBACK] Request URL: ${req.url}`);
      console.log(`🎯 [CALLBACK] Request method: ${req.method}`);
      console.log(`🎯 [CALLBACK] User object exists: ${!!req.user}`);
      try {
        console.log(`🚀 [OAUTH] Google OAuth callback triggered`);
        console.log(`👤 [OAUTH] User object received:`, {
          id: req.user?.id,
          name: req.user?.name,
          email: req.user?.email,
          hasAccessToken: !!req.user?.accessToken,
          hasRefreshToken: !!req.user?.refreshToken,
          hasScope: !!req.user?.scope
        });
        
        const user = req.user as { 
          id: string; 
          name: string; 
          email: string; 
          accessToken?: string; 
          refreshToken?: string;
          scope?: string;
        };
        
        // Store OAuth tokens and credentials in MongoDB
        console.log(`📝 [OAUTH] Storing OAuth tokens for Google OAuth user: ${user.email}`);
        console.log(`🔑 [OAUTH] Has Google tokens: ${!!user.accessToken && !!user.refreshToken}`);
        console.log(`📋 [OAUTH] Scope received: ${user.scope || 'NO SCOPE'}`);
        
        if (user.accessToken && user.refreshToken) {
          try {
            // Calculate token expiry (1 hour from now)
            const expiresAt = new Date(Date.now() + (3600 * 1000));
            
            // Store access info in MongoDB
            console.log(`💾 [OAUTH] Attempting to store access info in MongoDB...`);
            console.log(`🔧 [OAUTH] Environment variables:`, {
              hasClientId: !!process.env.GOOGLE_CLIENT_ID,
              hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
              clientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0
            });
            
            const accessInfoData = {
              userId: user.id,
              email: user.email,
              accessToken: user.accessToken,
              refreshToken: user.refreshToken,
              clientId: process.env.GOOGLE_CLIENT_ID || '',
              clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
              scope: user.scope || '',
              tokenType: 'Bearer',
              expiresAt: expiresAt
            };
            
            console.log(`📝 [OAUTH] Access info data prepared:`, {
              userId: accessInfoData.userId,
              email: accessInfoData.email,
              hasAccessToken: !!accessInfoData.accessToken,
              hasRefreshToken: !!accessInfoData.refreshToken,
              hasClientId: !!accessInfoData.clientId,
              hasClientSecret: !!accessInfoData.clientSecret,
              scope: accessInfoData.scope,
              expiresAt: accessInfoData.expiresAt
            });
            
            try {
              const accessInfo = await storage.createAccessInfo(accessInfoData);
              
              console.log(`✅ [OAUTH] Access info stored in MongoDB for ${user.email}`);
              console.log(`📄 [OAUTH] Access info ID: ${accessInfo.id}`);
              
              // Create n8n credentials from the stored access_info
              console.log(`📝 [OAUTH] Creating n8n credentials from access_info for ${user.email}`);
              
              const n8nCredentials = await createN8nCredentialsFromAccessInfo(accessInfo);
              
              if (n8nCredentials && n8nCredentials.length > 0) {
                console.log(`✅ [OAUTH] Created ${n8nCredentials.length} n8n credentials for ${user.email}`);
                console.log(`📋 [OAUTH] Created credentials:`, n8nCredentials);
              } else {
                console.log(`⚠️ [OAUTH] No n8n credentials were created for ${user.email}`);
              }

              // Create workflows for the user
              console.log(`📝 [OAUTH] Creating workflows for Google OAuth user: ${user.email}`);
              try {
                const workflows = await createUserWorkflows(user.id, user.email);
                if (workflows.length > 0) {
                  console.log(`✅ [OAUTH] Created ${workflows.length} workflows for ${user.email}`);
                } else {
                  console.log(`⚠️ [OAUTH] No workflows created for ${user.email}`);
                }
              } catch (error) {
                console.error(`❌ [OAUTH] Error during workflow creation for ${user.email}:`, error);
              }
            } catch (dbError: any) {
              console.error(`❌ [OAUTH] Database error storing access info:`, dbError);
              console.error(`🚨 [OAUTH] Error details:`, {
                message: dbError?.message || 'Unknown error',
                stack: dbError?.stack || 'No stack trace',
                code: dbError?.code || 'No error code'
              });
              throw dbError; // Re-throw to be caught by outer try-catch
            }
          } catch (error) {
            console.error(`❌ [OAUTH] Error during OAuth token storage or n8n credential creation for ${user.email}:`, error);
          }
        } else {
          console.log(`⚠️ [OAUTH] No OAuth tokens received for ${user.email}`);
        }
        
        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '24h' });

        const redirectUrl = new URL(clientRedirectPath, baseUrl);
        redirectUrl.searchParams.set('token', token);
        res.redirect(redirectUrl.toString());
      } catch (err) {
        console.error('OAuth callback error:', err);
        res.redirect('/login?error=oauth');
      }
    }
  );

  // N8N Credential Management Routes
  app.post('/api/n8n/create-credentials/:userId', authenticateToken, async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get access_info for the user
      const accessInfo = await storage.getAccessInfo(userId);
      if (!accessInfo) {
        return res.status(404).json({ message: 'Access info not found for this user' });
      }
      
      // Create n8n credentials from access_info
      const credentials = await createN8nCredentialsFromAccessInfo(accessInfo);
      
      res.json({
        message: `Created ${credentials.length} n8n credentials`,
        credentials: credentials
      });
    } catch (error) {
      console.error('Error creating n8n credentials:', error);
      res.status(500).json({ message: 'Failed to create n8n credentials' });
    }
  });

  app.post('/api/n8n/create-credentials-for-all', authenticateToken, async (req, res) => {
    try {
      // This endpoint would require admin privileges in a real application
      // For now, we'll just return a message indicating this is for admin use
      res.json({ 
        message: 'This endpoint is for admin use to create credentials for all users with access_info',
        note: 'Implementation would iterate through all access_info entries and create credentials'
      });
    } catch (error) {
      console.error('Error creating n8n credentials for all users:', error);
      res.status(500).json({ message: 'Failed to create n8n credentials for all users' });
    }
  });

  // NEW: Refresh tokens and recreate credentials for a specific user
  app.post('/api/n8n/refresh-tokens/:userId', authenticateToken, async (req, res) => {
    try {
      const { userId } = req.params;
      
      console.log(`🔄 [API] Manual token refresh requested for user: ${userId}`);
      
      // Refresh tokens and recreate credentials
      const credentials = await refreshTokensAndRecreateCredentials(userId);
      
      if (credentials.length > 0) {
        res.json({
          message: `Successfully refreshed tokens and recreated ${credentials.length} n8n credentials`,
          credentials: credentials
        });
      } else {
        res.status(404).json({ 
          message: 'No credentials were created. User may not have access_info or required scopes.' 
        });
      }
    } catch (error) {
      console.error('Error refreshing tokens and recreating credentials:', error);
      res.status(500).json({ message: 'Failed to refresh tokens and recreate credentials' });
    }
  });

  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });

      // Create n8n credential for the new user
      console.log(`📝 [SIGNUP] Creating n8n credential for new user: ${user.email}`);
      try {
        const n8nResult = await createN8nCredential({
          id: user.id,
          name: user.name,
          email: user.email
        });
        if (n8nResult) {
          console.log(`✅ [SIGNUP] n8n credential created successfully for ${user.email}`);
        } else {
          console.log(`⚠️ [SIGNUP] n8n credential creation returned null for ${user.email}`);
        }
      } catch (error) {
        console.error(`❌ [SIGNUP] Error during n8n credential creation for ${user.email}:`, error);
      }

      // Create workflows for the new user
      console.log(`📝 [SIGNUP] Creating workflows for new user: ${user.email}`);
      try {
        const workflows = await createUserWorkflows(user.id, user.email);
        if (workflows.length > 0) {
          console.log(`✅ [SIGNUP] Created ${workflows.length} workflows for ${user.email}`);
        } else {
          console.log(`⚠️ [SIGNUP] No workflows created for ${user.email}`);
        }
      } catch (error) {
        console.error(`❌ [SIGNUP] Error during workflow creation for ${user.email}:`, error);
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

      res.status(201).json({
        user: { id: user.id, name: user.name, email: user.email },
        token
      });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input data', error });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        user: { id: user.id, name: user.name, email: user.email },
        token
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // Get current user
  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ id: user.id, name: user.name, email: user.email });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // Ensure user has workflows (creates if missing)
  app.post('/api/workflows/ensure', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const workflows = await ensureUserWorkflows(userId, user.email);
      
      res.json({
        message: `Ensured ${workflows.length} workflows exist for user`,
        workflows: workflows
      });
    } catch (error) {
      console.error('Error ensuring workflows:', error);
      res.status(500).json({ message: 'Failed to ensure workflows', error });
    }
  });

  // Get user's workflows
  app.get('/api/workflows', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const workflows = await getUserWorkflows(userId);
      
      res.json({
        workflows: workflows
      });
    } catch (error) {
      console.error('Error getting workflows:', error);
      res.status(500).json({ message: 'Failed to get workflows', error });
    }
  });

  // Candidates routes
  app.get('/api/candidates', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const candidates = await storage.getCandidates(userId);
      
      // --- DATE & TIME LOGIC ---
      const now = new Date(); // Current time on the server

      // Map all candidates to include a parsed interview Date object
      const candidatesWithParsedDate = candidates.map(c => ({
        ...c,
        interviewDateTime: parseInterviewDateTime(c["Interview Start"]),
      }));

      // Auto-move candidates with past interviews to Analysis Phase
      const pastInterviewCandidates = candidatesWithParsedDate.filter(c => 
        c.status === 'Interview Scheduled' && 
        c.interviewDateTime && 
        c.interviewDateTime < now
      );

      // Update candidates with past interviews to Analysis Complete status
      for (const candidate of pastInterviewCandidates) {
        await storage.updateCandidate(candidate.id, { status: 'Analysis Complete' }, userId);
      }

      // Get updated candidates list after status changes
      const updatedCandidates = await storage.getCandidates(userId);
      res.json(updatedCandidates);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // Extended Meeting routes - MUST come before /api/candidates/:id
  app.get("/api/candidates/with-meetings", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const candidates = await storage.getCandidates(userId);
      const now = new Date();
      
      // Filter candidates with upcoming or ongoing meetings
      const candidatesWithMeetings = candidates
        .map(c => {
          const interviewStart = parseInterviewDateTime(c["Interview Start"]);
          const interviewEnd = parseInterviewDateTime(c["Interview End"]);
          return {
            id: c.id,
            name: c["Candidate Name"],
            jobTitle: c["Job Title"],
            interviewStart: c["Interview Start"],
            interviewEnd: c["Interview End"],
            calendarEventId: c["Calendar Event ID"],
            status: c.status || "Interview Scheduled",
            parsedStart: interviewStart,
            parsedEnd: interviewEnd
          };
        })
        .filter(c => {
          // Include candidates with valid parsed dates that are either ongoing or in the future
          // Also include candidates with Interview Scheduled status regardless of time
          const hasValidDates = c.parsedStart && c.parsedEnd;
          const isFutureOrOngoing = hasValidDates && c.parsedStart && c.parsedEnd && 
            (c.parsedEnd > now || (c.parsedStart <= now && c.parsedEnd >= now));
          const isScheduled = c.status === 'Interview Scheduled';
          
          console.log(`Candidate ${c.name}: hasValidDates=${hasValidDates}, isFutureOrOngoing=${isFutureOrOngoing}, isScheduled=${isScheduled}, status=${c.status}`);
          
          // Include if it's scheduled OR if it's in the future/ongoing
          return hasValidDates && (isScheduled || isFutureOrOngoing);
        })
        .sort((a, b) => {
          // Sort by interview start time
          return a.parsedStart!.getTime() - b.parsedStart!.getTime();
        });

      // Remove the parsed dates from response (frontend doesn't need them)
      const response = candidatesWithMeetings.map(({ parsedStart, parsedEnd, ...rest }) => rest);
      
      console.log(`Found ${response.length} candidates with upcoming or ongoing meetings`);
      res.json(response);
    } catch (error) {
      console.error("Error getting candidates with meetings:", error);
      res.status(500).json({ error: "Failed to get candidates with meetings" });
    }
  });

  app.get('/api/candidates/:id', authenticateToken, async (req: any, res) => {
    try {
      const id = req.params.id;
      const userId = req.user.userId;
      const candidate = await storage.getCandidate(id, userId);
      if (!candidate) {
        return res.status(404).json({ message: 'Candidate not found' });
      }
      res.json(candidate);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.put('/api/candidates/:id', authenticateToken, async (req: any, res) => {
    try {
      const id = req.params.id;
      const userId = req.user.userId;
      const updates = req.body;

      // Get candidate data before update to access Calendar Event ID
      const existingCandidate = await storage.getCandidate(id, userId);
      if (!existingCandidate) {
        return res.status(404).json({ message: 'Candidate not found' });
      }

      const candidate = await storage.updateCandidate(id, updates, userId);
      if (!candidate) {
        return res.status(404).json({ message: 'Candidate not found' });
      }

      // Trigger N8N webhook for calendar event update
      try {
        const calendarEventId = candidate["Calendar Event ID"];
        if (calendarEventId) {
          console.log('Triggering N8N update webhook for candidate:', candidate["Candidate Name"], 'Calendar Event ID:', calendarEventId);
          
          const webhookPayload = {
            candidateId: candidate.id,
            candidateName: candidate["Candidate Name"],
            calendarEventId: calendarEventId,
            interviewDate: candidate["Interview Start"],
            interviewTime: candidate["Interview Start"],
            status: candidate.status,
            updates: updates,
            timestamp: new Date().toISOString(),
            // Send the updated candidate data for calendar sync
            updatedCandidate: {
              name: candidate["Candidate Name"],
              email: candidate.Email,
              jobTitle: candidate["Job Title"],
              interviewDate: candidate["Interview Start"],
              interviewTime: candidate["Interview Start"],
              status: candidate.status
            }
          };

          const response = await fetch('http://54.226.92.93:5678/webhook-test/update-calendar-event', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookPayload)
          });

          if (!response.ok) {
            console.error('N8N update webhook failed:', response.status, await response.text());
          } else {
            const responseData = await response.json();
            console.log('N8N update webhook success:', responseData);
          }
        } else {
          console.log('No Calendar Event ID found for candidate, skipping webhook');
        }
      } catch (webhookError) {
        console.error('Error calling N8N update webhook:', webhookError);
        // Don't fail the candidate update if webhook fails
      }

      res.json(candidate);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.post('/api/candidates', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const candidateData = insertCandidateSchema.parse(req.body);
      const candidate = await storage.createCandidate(candidateData, userId);
      res.status(201).json(candidate);
    } catch (error) {
      res.status(400).json({ message: 'Invalid input data', error });
    }
  });

  app.delete('/api/candidates/:id', authenticateToken, async (req: any, res) => {
    try {
      const id = req.params.id;
      const userId = req.user.userId;
      
      // Get candidate data before deletion to access Calendar Event ID
      const existingCandidate = await storage.getCandidate(id, userId);
      if (!existingCandidate) {
        return res.status(404).json({ message: 'Candidate not found' });
      }

      const success = await storage.deleteCandidate(id, userId);
      if (!success) {
        return res.status(404).json({ message: 'Candidate not found' });
      }

      // Trigger N8N webhook for calendar event deletion
      try {
        const calendarEventId = existingCandidate["Calendar Event ID"];
        if (calendarEventId) {
          console.log('Triggering N8N delete webhook for candidate:', existingCandidate["Candidate Name"], 'Calendar Event ID:', calendarEventId);
          
          const webhookPayload = {
            candidateId: existingCandidate.id,
            candidateName: existingCandidate["Candidate Name"],
            calendarEventId: calendarEventId,
            interviewDate: existingCandidate["Interview Start"],
            interviewTime: existingCandidate["Interview Start"],
            timestamp: new Date().toISOString()
          };

          const response = await fetch('http://54.226.92.93:5678/webhook-test/delete-calendar-event', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookPayload)
          });

          if (!response.ok) {
            console.error('N8N delete webhook failed:', response.status, await response.text());
          } else {
            const responseData = await response.json();
            console.log('N8N delete webhook success:', responseData);
          }
        } else {
          console.log('No Calendar Event ID found for candidate, skipping webhook');
        }
      } catch (webhookError) {
        console.error('Error calling N8N delete webhook:', webhookError);
        // Don't fail the candidate deletion if webhook fails
      }

      res.json({ message: 'Candidate deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // Get all upcoming interviews
  app.get('/api/interviews/upcoming', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const candidates = await storage.getCandidates(userId);
      
      // --- DATE & TIME LOGIC ---
      const now = new Date(); // Current time on the server

      // Map all candidates to include a parsed interview Date object
      const candidatesWithParsedDate = candidates.map(c => ({
        ...c,
        interviewDateTime: parseInterviewDateTime(c["Interview Start"]),
      }));

      // Filter for interviews that are actually in the future
      const futureInterviews = candidatesWithParsedDate.filter(c => 
          c.interviewDateTime && c.interviewDateTime > now
      );

      // Get all upcoming interviews (no limit)
      const upcomingInterviews = futureInterviews.map(c => ({
        id: c.id,
        candidateName: c["Candidate Name"],
        position: c["Job Title"] || 'N/A',
        time: c.interviewTime || 'TBD',
        date: c.interviewDate || 'TBD',
        calendarLink: c["Calender Event Link"] || `https://calendar.google.com/calendar/event?eid=${c["Calendar Event ID"]}`
      }));

      res.json(upcomingInterviews);
    } catch (error) {
      console.error("Error fetching upcoming interviews:", error);
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // Get current candidate based on interview time
  app.get('/api/interviews/current', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const candidates = await storage.getCandidates(userId);
      const now = new Date();

      // Map candidates with parsed interview times
      const candidatesWithParsedDate = candidates.map(c => {
        const interviewStart = parseInterviewDateTime(c["Interview Start"]);
        const interviewEnd = parseInterviewDateTime(c["Interview End"]);
        return {
          ...c,
          interviewStart,
          interviewEnd,
        };
      });

      console.log('Current time (UTC):', now.toISOString());
      console.log('Current time (Pakistan):', new Date(now.getTime() + (5 * 60 * 60 * 1000)).toISOString());
      console.log('Total candidates with interview dates:', candidatesWithParsedDate.length);

      // Find candidate whose interview is currently happening
      const currentCandidate = candidatesWithParsedDate.find(c => {
        const isOngoing = c.interviewStart && c.interviewEnd &&
          c.interviewStart <= now && c.interviewEnd >= now &&
          c.status === 'Interview Scheduled';
        
        if (c.interviewStart && c.interviewEnd) {
          console.log(`Candidate ${c["Candidate Name"]}: ${c.interviewStart.toISOString()} - ${c.interviewEnd.toISOString()}, Status: ${c.status}, Is Ongoing: ${isOngoing}`);
        }
        
        return isOngoing;
      });

      console.log('Current candidate found:', currentCandidate ? currentCandidate["Candidate Name"] : 'None');

      // Only return ongoing interviews, no upcoming ones
      if (currentCandidate) {
        console.log('Returning current ongoing candidate:', currentCandidate["Candidate Name"]);
        res.json({
          candidate: currentCandidate,
          isCurrentlyInterviewing: true,
          timeStatus: 'ongoing'
        });
      } else {
        console.log('No ongoing interview found, returning 404');
        res.status(404).json({ message: 'No ongoing interview found' });
      }
    } catch (error) {
      console.error("Error fetching current candidate:", error);
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // Job routes
  app.get('/api/job-criteria', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const jobCriteria = await storage.getJobCriteria(userId);
      res.json(jobCriteria);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.get('/api/job-criteria/:id', authenticateToken, async (req: any, res) => {
    try {
      const id = req.params.id;
      const userId = req.user.userId;
      const jobCriteria = await storage.getJobCriteriaById(id, userId);
      if (!jobCriteria) {
        return res.status(404).json({ message: 'Job criteria not found' });
      }
      res.json(jobCriteria);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // ✨ Enhanced route to handle job creation with optional skills
  app.post('/api/jobs', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      // Validate the incoming data against our enhanced schema
      const jobData = jobFormDataSchema.parse(req.body);
      // Call the storage method which now expects both required and optional skills
      const jobCriteria = await storage.createJobCriteria(jobData, userId);
      res.status(201).json(jobCriteria);
    } catch (error) {
      // Handle validation errors from Zod or other errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      res.status(400).json({ message: 'Invalid input data', error });
    }
  });

  // ✨ Enhanced PUT route with optional skills support
  app.put('/api/jobs/:id', authenticateToken, async (req: any, res) => {
    try {
      const id = req.params.id;
      const userId = req.user.userId;
      // Validate the incoming data against our enhanced schema
      const jobData = jobFormDataSchema.parse(req.body);

      // The storage layer expects the DB format, so we map it here
      const updates = {
        "Job ID": jobData.jobId,
        "Job Title": jobData.jobTitle,
        "Required Skills": jobData.requiredSkills,
        "Optional Skills": jobData.optionalSkills || [] // Include optional skills
      };

      const jobCriteria = await storage.updateJobCriteria(id, updates, userId);

      if (!jobCriteria) {
        return res.status(404).json({ message: 'Job not found' });
      }

      res.status(200).json(jobCriteria);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      res.status(400).json({ message: 'Invalid input data', error });
    }
  });

  // ✨ NEW: DELETE route for job deletion
  app.delete('/api/jobs/:id', authenticateToken, async (req: any, res) => {
    try {
      const id = req.params.id;
      const userId = req.user.userId;

      if (!id) {
        return res.status(400).json({ message: "Job ID is required" });
      }

      // Check if job exists before attempting to delete
      const existingJob = await storage.getJobCriteriaById(id, userId);
      if (!existingJob) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Attempt to delete the job
      const deleteSuccess = await storage.deleteJobCriteria(id, userId);

      if (!deleteSuccess) {
        return res.status(500).json({ message: "Failed to delete job" });
      }

      res.status(200).json({
        message: "Job deleted successfully",
        deletedJobId: id,
        deletedJob: {
          id: existingJob.id,
          title: existingJob["Job Title"],
          jobId: existingJob["Job ID"]
        }
      });

    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: "Internal server error", error });
    }
  });

  // N8N Integration routes
  app.post('/api/n8n/update-candidate', async (req, res) => {
    try {
      const { candidateId, updates, userId } = req.body;

      if (!candidateId) {
        return res.status(400).json({ message: 'candidateId is required' });
      }

      if (!userId) {
        return res.status(400).json({ message: 'userId is required for N8N webhook' });
      }

      const candidate = await storage.updateCandidate(candidateId, updates, userId);
      if (!candidate) {
        return res.status(404).json({ message: 'Candidate not found' });
      }

      res.json({ success: true, candidate });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.post('/api/n8n/live-data/:interviewId', async (req, res) => {
    try {
      const { interviewId } = req.params;
      const { transcript, suggestions, analysis } = req.body;

      // Broadcast live data to connected clients
      broadcast(interviewId, {
        type: 'live-update',
        data: {
          transcript,
          suggestions,
          analysis,
          timestamp: new Date().toISOString()
        }
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.post('/api/n8n/final-report/:candidateId', async (req, res) => {
    try {
      const candidateId = req.params.candidateId;
      const { analysis, userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: 'userId is required for N8N webhook' });
      }

      const candidate = await storage.updateCandidate(candidateId, {
        analysis,
        status: 'Analysis Complete'
      }, userId);

      if (!candidate) {
        return res.status(404).json({ message: 'Candidate not found' });
      }

      res.json({ success: true, candidate });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // N8N Webhook triggers
  app.post('/api/sync-cvs', authenticateToken, async (req: any, res) => {
    try {
      // Trigger N8N webhook for CV sync using GET request with query params
      const params = new URLSearchParams({
        action: 'sync_cvs',
        timestamp: new Date().toISOString(),
        userId: req.user.userId.toString()
      });

      const webhookUrl = `https://ali-shoaib.app.n8n.cloud/webhook-test/9f3916ff-5ef8-47e2-8170-fea53c456554?${params}`;

      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('N8N webhook error:', response.status, errorText);

        if (response.status === 404) {
          throw new Error(`N8N webhook not active. Please activate your workflow in N8N by clicking 'Execute workflow' button first.`);
        }

        throw new Error(`Failed to trigger CV sync: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log('N8N CV sync response:', responseData);

      res.json({ success: true, message: 'CV sync triggered successfully', data: responseData });
    } catch (error: any) {
      console.error('CV sync error:', error);
      res.status(500).json({ message: 'Failed to sync CVs', error: error.message });
    }
  });

  app.post('/api/start-interview-bot', authenticateToken, async (req, res) => {
    try {
      const { meetingId, candidateId } = req.body;

      // Trigger N8N webhook for interview bot using GET request with query params
      const params = new URLSearchParams({
        action: 'start_interview_bot',
        meetingId: meetingId || `interview-${Date.now()}`,
        candidateId: candidateId?.toString() || '',
        timestamp: new Date().toISOString()
      });

      const webhookUrl = `http://54.226.92.93:5678/webhook/f04e8b6a-39c9-4654-ac7b-0aee4b6bd4fb?${params}`;

      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('N8N interview webhook error:', response.status, errorText);

        if (response.status === 404) {
          throw new Error(`N8N interview webhook not active. Please activate your workflow in N8N by clicking 'Execute workflow' button first.`);
        }

        throw new Error(`Failed to start interview bot: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log('N8N interview bot response:', responseData);

      res.json({ success: true, message: 'Interview bot started successfully', data: responseData });
    } catch (error: any) {
      console.error('Interview bot error:', error);
      
      // Provide specific error message for connection refused
      if (error.code === 'ECONNREFUSED') {
        res.status(503).json({ 
          message: 'N8N service is not running', 
          error: 'Please ensure N8N is running on localhost:5678 before starting the interview session.',
          suggestion: 'Start your N8N instance and activate the workflow first.'
        });
      } else {
        res.status(500).json({ message: 'Failed to start interview bot', error: error.message });
      }
    }
  });

  // ✨ MODIFIED Dashboard metrics route
  app.get('/api/dashboard/metrics', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const candidates = await storage.getCandidates(userId);
      const jobCriteria = await storage.getJobCriteria(userId);

      console.log('Dashboard - Raw candidates count:', candidates.length);
      console.log('Dashboard - Sample candidate statuses:', candidates.slice(0, 3).map(c => ({ id: c.id, status: c.status })));
      console.log('Dashboard - Sample candidate interview data:', candidates.slice(0, 3).map(c => ({ 
        id: c.id, 
        date: c["Interview Start"], 
        time: c["Interview Start"],
        parsedDateTime: parseInterviewDateTime(c["Interview Start"])
      })));

      // --- DATE & TIME LOGIC ---
      const now = new Date(); // Current time on the server

      // Map all candidates to include a parsed interview Date object
      const candidatesWithParsedDate = candidates.map(c => ({
        ...c,
        interviewDateTime: parseInterviewDateTime(c["Interview Start"]),
      }));

      // Auto-move candidates with past interviews to Analysis Phase
      const pastInterviewCandidates = candidatesWithParsedDate.filter(c => 
        c.status === 'Interview Scheduled' && 
        c.interviewDateTime && 
        c.interviewDateTime < now
      );

      console.log('Dashboard - Past interview candidates to move:', pastInterviewCandidates.length);

      // Update candidates with past interviews to Analysis Complete status
      for (const candidate of pastInterviewCandidates) {
        await storage.updateCandidate(candidate.id, { status: 'Analysis Complete' }, userId);
      }

      // Get updated candidates list after status changes
      const updatedCandidates = await storage.getCandidates(userId);
      const updatedCandidatesWithParsedDate = updatedCandidates.map(c => ({
        ...c,
        interviewDateTime: parseInterviewDateTime(c["Interview Start"]),
      }));

      // --- METRIC CALCULATIONS ---
      const totalCandidates = updatedCandidates.length;
      const hiredCount = updatedCandidates.filter(c => c.status === 'Hired').length;
      const hireRate = totalCandidates > 0 ? Math.round((hiredCount / totalCandidates) * 100) : 0;
      const avgTimeToHire = hiredCount > 0 ? '14d' : '0d'; // Simplified

      // Filter for interviews that are actually in the future
      const futureInterviews = updatedCandidatesWithParsedDate.filter(c => 
          c.interviewDateTime && c.interviewDateTime > now
      );

      // --- FUNNEL & INTERVIEW DATA ---
      console.log('Dashboard - Future interviews count:', futureInterviews.length);
      console.log('Dashboard - Status counts:', {
        'Interview Scheduled': updatedCandidates.filter(c => c.status === 'Interview Scheduled').length,
        'Analysis Complete': updatedCandidates.filter(c => c.status === 'Analysis Complete').length,
        'Hired': hiredCount
      });

      // Show the actual funnel based on current status, not just future interviews
      const interviewScheduledCount = updatedCandidates.filter(c => c.status === 'Interview Scheduled').length;
      const analysisCompleteCount = updatedCandidates.filter(c => c.status === 'Analysis Complete').length;

      const funnelStages = [
        { name: 'Interview Scheduled', count: interviewScheduledCount, color: 'yellow' },
        { name: 'Analysis Phase', count: analysisCompleteCount, color: 'purple' },
        { name: 'Hired', count: hiredCount, color: 'success' }
      ];

      // Get the list of upcoming interviews - if date parsing fails, show all Interview Scheduled candidates
      let upcomingInterviews;
      if (futureInterviews.length > 0) {
        upcomingInterviews = futureInterviews
          .map(c => ({
            id: c.id,
            candidateName: c["Candidate Name"],
            position: c["Job Title"] || 'N/A',
            time: c.interviewTime || 'TBD',
            date: c.interviewDate || 'TBD',
            calendarLink: c["Calender Event Link"] || `https://calendar.google.com/calendar/event?eid=${c["Calendar Event ID"]}`
          }))
          .slice(0, 4);
      } else {
        // Fallback: show all candidates with "Interview Scheduled" status
        console.log('No future interviews parsed, falling back to all Interview Scheduled candidates');
        upcomingInterviews = updatedCandidates
          .filter(c => c.status === 'Interview Scheduled')
          .map(c => ({
            id: c.id,
            candidateName: c["Candidate Name"],
            position: c["Job Title"] || 'N/A',
            time: c.interviewTime || 'Time TBD',
            date: c.interviewDate || 'Date TBD',
            calendarLink: c["Calender Event Link"] || `https://calendar.google.com/calendar/event?eid=${c["Calendar Event ID"]}`
          }))
          .slice(0, 4);
      }

      console.log('Dashboard - Upcoming interviews:', upcomingInterviews.length);
      console.log('Dashboard - Final funnel stages:', funnelStages);

      res.json({
        totalCandidates,
        activeInterviews: futureInterviews.length, // This metric is also now accurate
        hireRate,
        avgTimeToHire,
        funnelStages,
        upcomingInterviews
      });
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // Transcript routes
  app.get("/api/transcripts", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { meetId } = req.query;
      
      if (meetId && typeof meetId === 'string') {
        const transcripts = await storage.getTranscriptsByMeetId(meetId, userId);
        res.json(transcripts);
      } else {
        const transcripts = await storage.getTranscripts(userId);
        res.json(transcripts);
      }
    } catch (error) {
      console.error("Error getting transcripts:", error);
      res.status(500).json({ error: "Failed to get transcripts" });
    }
  });

  // Get transcript by Meet ID (for specific candidate interview data)
  app.get("/api/transcripts/by-meet-id/:meetId", authenticateToken, async (req: any, res) => {
    try {
      const { meetId } = req.params;
      const userId = req.user.userId;
      console.log(`Fetching transcript for Meet ID: ${meetId}`);
      
      const transcripts = await storage.getTranscriptsByMeetId(meetId, userId);
      
      if (!transcripts || transcripts.length === 0) {
        console.log(`No transcripts found for Meet ID: ${meetId}`);
        return res.status(404).json({ message: "No transcript found for this Meet ID" });
      }
      
      // Return the most recent transcript for this Meet ID
      const latestTranscript = transcripts[transcripts.length - 1];
      console.log(`Found transcript for Meet ID ${meetId}:`, { 
        id: latestTranscript.id, 
        hasSummary: !!latestTranscript.Summary,
        hasSuggestions: !!latestTranscript.Suggested_Questions 
      });
      
      res.json(latestTranscript);
    } catch (error) {
      console.error("Error getting transcript by Meet ID:", error);
      res.status(500).json({ error: "Failed to get transcript" });
    }
  });

  // Get analysis by Meet ID (for candidate final analysis)
  app.get("/api/analysis/by-meet-id/:meetId", authenticateToken, async (req: any, res) => {
    try {
      const { meetId } = req.params;
      const userId = req.user.userId;
      console.log(`Fetching analysis for Meet ID: ${meetId}`);
      
      const analysis = await storage.getAnalysisByMeetId(meetId, userId);
      
      if (!analysis) {
        console.log(`No analysis found for Meet ID: ${meetId}`);
        return res.status(404).json({ message: "No analysis found for this Meet ID" });
      }
      
      console.log(`Found analysis for Meet ID ${meetId}:`, { 
        id: analysis.id, 
        recommendation: analysis["Recommended for Hire"]
      });
      
      res.json(analysis);
    } catch (error) {
      console.error("Error getting analysis by Meet ID:", error);
      res.status(500).json({ error: "Failed to get analysis" });
    }
  });

  app.get("/api/transcripts/latest", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const transcript = await storage.getLatestTranscript(userId);
      if (transcript) {
        res.json(transcript);
      } else {
        res.status(404).json({ error: "No transcripts found" });
      }
    } catch (error) {
      console.error("Error getting latest transcript:", error);
      res.status(500).json({ error: "Failed to get latest transcript" });
    }
  });

  app.post("/api/transcripts", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { error, data } = insertTranscriptSchema.safeParse(req.body);
      if (error) {
        return res.status(400).json({ error: "Invalid input", details: error.issues });
      }
      const transcript = await storage.createTranscript(data, userId);
      res.status(201).json(transcript);
    } catch (error) {
      console.error("Error creating transcript:", error);
      res.status(500).json({ error: "Failed to create transcript" });
    }
  });

  // Unavailable Slots routes
  app.get("/api/unavailable-slots", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const slots = await storage.getUnavailableSlots(userId);
      res.json(slots);
    } catch (error) {
      console.error("Error getting unavailable slots:", error);
      res.status(500).json({ error: "Failed to get unavailable slots" });
    }
  });

  app.post("/api/unavailable-slots", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { error, data } = insertUnavailableSlotSchema.safeParse(req.body);
      if (error) {
        return res.status(400).json({ error: "Invalid input", details: error.issues });
      }
      const slot = await storage.createUnavailableSlot(data, userId);
      res.status(201).json(slot);
    } catch (error) {
      console.error("Error creating unavailable slot:", error);
      res.status(500).json({ error: "Failed to create unavailable slot" });
    }
  });

  app.put("/api/unavailable-slots/:id", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { error, data } = insertUnavailableSlotSchema.safeParse(req.body);
      if (error) {
        return res.status(400).json({ error: "Invalid input", details: error.issues });
      }
      const slot = await storage.updateUnavailableSlot(req.params.id, data, userId);
      if (slot) {
        res.json(slot);
      } else {
        res.status(404).json({ error: "Unavailable slot not found" });
      }
    } catch (error) {
      console.error("Error updating unavailable slot:", error);
      res.status(500).json({ error: "Failed to update unavailable slot" });
    }
  });

  app.delete("/api/unavailable-slots/:id", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const success = await storage.deleteUnavailableSlot(req.params.id, userId);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Unavailable slot not found" });
      }
    } catch (error) {
      console.error("Error deleting unavailable slot:", error);
      res.status(500).json({ error: "Failed to delete unavailable slot" });
    }
  });

  // Busy Slots routes
  app.get("/api/busy-slots", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const slots = await storage.getBusySlots(userId);
      res.json(slots);
    } catch (error) {
      console.error("Error getting busy slots:", error);
      res.status(500).json({ error: "Failed to get busy slots" });
    }
  });

  app.post("/api/busy-slots", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { error, data } = insertBusySlotSchema.safeParse(req.body);
      if (error) {
        return res.status(400).json({ error: "Invalid input", details: error.issues });
      }

      // Validate required fields
      if (!data.date || !data.startTime || !data.endTime) {
        return res.status(400).json({ error: "Date, start time, and end time are required" });
      }

      // Validate that end time is after start time
      const startTime = new Date(`2000-01-01T${data.startTime}`);
      const endTime = new Date(`2000-01-01T${data.endTime}`);
      if (endTime <= startTime) {
        return res.status(400).json({ error: "End time must be after start time" });
      }

      const slot = await storage.createBusySlot(data, userId);
      
      // Get the current user data for webhook
      const user = await storage.getUser(userId);
      if (!user) {
        console.error("User not found for webhook data");
      }

      // Trigger webhook after successful busy slot creation
      try {
        console.log("Triggering busy slot webhook...");
        const webhookData = {
          userId: userId,
          userEmail: user?.email || '',
          userName: user?.name || '',
          slotId: slot.id,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          reason: data.reason || 'Busy',
          timestamp: new Date().toISOString(),
          action: "busy_slot_created",
          platform: "ideofuzion"
        };

        // Trigger webhook with timeout protection
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          const webhookResponse = await fetch("https://n8n.hireninja.site/webhook/busyslot-ideofuzion", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "User-Agent": "HiringPlatform/1.0"
            },
            body: JSON.stringify(webhookData),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (webhookResponse.ok) {
            console.log("Busy slot webhook triggered successfully");
          } else {
            const errorText = await webhookResponse.text();
            console.error("Busy slot webhook failed:", {
              status: webhookResponse.status,
              statusText: webhookResponse.statusText,
              error: errorText,
              slotId: slot.id,
              userId: userId
            });
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            console.error("Busy slot webhook request timed out after 10 seconds");
          } else {
            console.error("Error making busy slot webhook request:", fetchError);
          }
        }
      } catch (webhookError) {
        console.error("Error triggering busy slot webhook:", webhookError);
        // Don't fail the busy slot creation if webhook fails
      }
      
      res.status(201).json(slot);
    } catch (error) {
      console.error("Error creating busy slot:", error);
      res.status(500).json({ error: "Failed to create busy slot" });
    }
  });

  app.put("/api/busy-slots/:id", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { error, data } = insertBusySlotSchema.safeParse(req.body);
      if (error) {
        return res.status(400).json({ error: "Invalid input", details: error.issues });
      }
      const slot = await storage.updateBusySlot(req.params.id, data, userId);
      if (slot) {
        res.json(slot);
      } else {
        res.status(404).json({ error: "Busy slot not found" });
      }
    } catch (error) {
      console.error("Error updating busy slot:", error);
      res.status(500).json({ error: "Failed to update busy slot" });
    }
  });

  app.delete("/api/busy-slots/:id", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const success = await storage.deleteBusySlot(req.params.id, userId);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Busy slot not found" });
      }
    } catch (error) {
      console.error("Error deleting busy slot:", error);
      res.status(500).json({ error: "Failed to delete busy slot" });
    }
  });

  app.post("/api/extend-meeting", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { error, data } = insertExtendedMeetingSchema.safeParse(req.body);
      if (error) {
        return res.status(400).json({ error: "Invalid input", details: error.issues });
      }

      // Validate that the calendar event ID exists in candidates
      const candidates = await storage.getCandidates(userId);
      const candidate = candidates.find(c => c["Calendar Event ID"] === data.calendarEventId);
      
      if (!candidate) {
        return res.status(404).json({ error: "Calendar event not found" });
      }

      // Validate that candidate has required fields
      if (!candidate["Interview End"]) {
        return res.status(400).json({ error: "Candidate does not have an interview end time" });
      }

      // Validate that new end time is after current end time
      const currentEndTime = parseInterviewDateTime(candidate["Interview End"]);
      const newEndTime = parseInterviewDateTime(data.newEndTime);
      
      if (!currentEndTime || !newEndTime) {
        return res.status(400).json({ error: "Invalid date format" });
      }

      if (newEndTime <= currentEndTime) {
        return res.status(400).json({ error: "New end time must be after current end time" });
      }

      // Validate that new end time is not too far in the future (e.g., not more than 24 hours later)
      const maxExtensionTime = new Date(currentEndTime.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
      if (newEndTime > maxExtensionTime) {
        return res.status(400).json({ error: "New end time cannot be more than 24 hours after current end time" });
      }

      // Create extended meeting record
      const extendedMeeting = await storage.createExtendedMeeting(data, userId);
      
      console.log(`Extended meeting created for calendar event ${data.calendarEventId}:`, {
        candidateName: candidate["Candidate Name"],
        originalEndTime: candidate["Interview End"],
        newEndTime: data.newEndTime,
        reason: data.reason
      });

      // Get the current user data for webhook
      const user = await storage.getUser(userId);
      if (!user) {
        console.error("User not found for webhook data");
      }

      // Trigger webhook after successful meeting extension
      try {
        console.log("Triggering meeting extension webhook...");
        const webhookData = {
          userId: userId,
          userEmail: user?.email || '',
          userName: user?.name || '',
          candidateId: candidate.id,
          candidateName: candidate["Candidate Name"],
          candidateEmail: candidate.Email,
          jobTitle: candidate["Job Title"],
          calendarEventId: data.calendarEventId,
          originalEndTime: candidate["Interview End"],
          newEndTime: data.newEndTime,
          reason: data.reason,
          timestamp: new Date().toISOString(),
          action: "meeting_extended",
          platform: "ideofuzion"
        };

        // Trigger webhook with timeout protection
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          const webhookResponse = await fetch("https://n8n.hireninja.site/webhook/Extendmeeting-ideofuzion", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "User-Agent": "HiringPlatform/1.0"
            },
            body: JSON.stringify(webhookData),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (webhookResponse.ok) {
            console.log("Meeting extension webhook triggered successfully");
          } else {
            const errorText = await webhookResponse.text();
            console.error("Meeting extension webhook failed:", {
              status: webhookResponse.status,
              statusText: webhookResponse.statusText,
              error: errorText,
              candidateId: candidate.id,
              userId: userId
            });
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            console.error("Meeting extension webhook request timed out after 10 seconds");
          } else {
            console.error("Error making meeting extension webhook request:", fetchError);
          }
        }
      } catch (webhookError) {
        console.error("Error triggering meeting extension webhook:", webhookError);
        // Don't fail the meeting extension if webhook fails
      }

      res.status(201).json({
        success: true,
        extendedMeeting,
        candidate: {
          name: candidate["Candidate Name"],
          originalEndTime: candidate["Interview End"],
          newEndTime: data.newEndTime
        }
      });
    } catch (error) {
      console.error("Error extending meeting:", error);
      res.status(500).json({ error: "Failed to extend meeting" });
    }
  });

  // Simple in-memory rate limiting for webhook calls
  const webhookRateLimit = new Map<string, number>();
  const RATE_LIMIT_WINDOW = 60000; // 1 minute
  const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 requests per minute per user

  // Webhook endpoint for starting interview sessions
  app.post("/api/start-interview-session", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { candidateId } = req.body;

      // Rate limiting check
      const now = Date.now();
      const userKey = `webhook_${userId}`;
      const lastRequestTime = webhookRateLimit.get(userKey) || 0;
      
      if (now - lastRequestTime < RATE_LIMIT_WINDOW) {
        const requestsInWindow = Math.floor((now - lastRequestTime) / (RATE_LIMIT_WINDOW / MAX_REQUESTS_PER_WINDOW));
        if (requestsInWindow >= MAX_REQUESTS_PER_WINDOW) {
          return res.status(429).json({ 
            error: "Rate limit exceeded", 
            message: "Too many webhook requests. Please wait before trying again." 
          });
        }
      }
      
      webhookRateLimit.set(userKey, now);

      if (!candidateId) {
        return res.status(400).json({ error: "Candidate ID is required" });
      }

      // Get the candidate data
      const candidate = await storage.getCandidate(candidateId, userId);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }

      // Validate that candidate has required fields
      if (!candidate["Google Meet Id"]) {
        return res.status(400).json({ error: "Candidate does not have a Google Meet ID" });
      }

      if (!candidate["Interview Start"]) {
        return res.status(400).json({ error: "Candidate does not have an interview start time" });
      }

      // Get the current user data
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Prepare webhook data
      const webhookData = {
        userId: userId,
        userEmail: user.email,
        userName: user.name,
        candidateId: candidate.id,
        candidateName: candidate["Candidate Name"],
        candidateEmail: candidate.Email,
        jobTitle: candidate["Job Title"],
        googleMeetId: candidate["Google Meet Id"],
        interviewStart: candidate["Interview Start"],
        interviewEnd: candidate["Interview End"],
        calendarEventId: candidate["Calendar Event ID"],
        timestamp: new Date().toISOString(),
        action: "interview_session_started",
        sessionId: `${userId}_${candidate.id}_${Date.now()}`, // Unique session identifier
        platform: "ideofuzion"
      };

      // Trigger the production webhook with timeout
      console.log("Triggering interview session webhook...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const webhookResponse = await fetch("https://n8n.hireninja.site/webhook/meetbot-ideofuzion", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "User-Agent": "HiringPlatform/1.0"
          },
          body: JSON.stringify(webhookData),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (webhookResponse.ok) {
          console.log("Interview session webhook triggered successfully");
          res.json({ 
            success: true, 
            message: "Interview session started successfully",
            candidate: {
              name: candidate["Candidate Name"],
              meetId: candidate["Google Meet Id"]
            }
          });
        } else {
          const errorText = await webhookResponse.text();
          console.error("Interview session webhook failed:", {
            status: webhookResponse.status,
            statusText: webhookResponse.statusText,
            error: errorText,
            candidateId: candidate.id,
            userId: userId
          });
          res.status(500).json({ 
            error: "Failed to start interview session",
            webhookStatus: webhookResponse.status,
            webhookError: errorText
          });
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error("Webhook request timed out after 10 seconds");
          res.status(500).json({ 
            error: "Webhook request timed out",
            message: "The webhook request took too long to respond"
          });
        } else {
          console.error("Error making webhook request:", fetchError);
          res.status(500).json({ 
            error: "Failed to connect to webhook",
            message: "Unable to reach the webhook endpoint"
          });
        }
      }
    } catch (error) {
      console.error("Error starting interview session:", error);
      res.status(500).json({ error: "Failed to start interview session" });
    }
  });

  // Health check endpoint for webhook connectivity
  app.get("/api/webhook-health", authenticateToken, async (req: any, res) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const response = await fetch("https://n8n.hireninja.site/webhook/meetbot-ideofuzion", {
          method: "HEAD", // Just check if endpoint is reachable
          headers: { 
            "User-Agent": "HiringPlatform/1.0"
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        res.json({ 
          status: "healthy",
          webhookReachable: true,
          webhookStatus: response.status,
          timestamp: new Date().toISOString()
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        res.json({ 
          status: "unhealthy",
          webhookReachable: false,
          error: fetchError.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error checking webhook health:", error);
      res.status(500).json({ 
        status: "error",
        error: "Failed to check webhook health"
      });
    }
  });

  // Health check endpoint for busy slot webhook connectivity
  app.get("/api/busy-slot-webhook-health", authenticateToken, async (req: any, res) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const response = await fetch("https://n8n.hireninja.site/webhook/busyslot-ideofuzion", {
          method: "HEAD", // Just check if endpoint is reachable
          headers: { 
            "User-Agent": "HiringPlatform/1.0"
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        res.json({ 
          status: "healthy",
          webhookReachable: true,
          webhookStatus: response.status,
          timestamp: new Date().toISOString()
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        res.json({ 
          status: "unhealthy",
          webhookReachable: false,
          error: fetchError.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error checking busy slot webhook health:", error);
      res.status(500).json({ 
        status: "error",
        error: "Failed to check busy slot webhook health"
      });
    }
  });

  // Health check endpoint for extend meeting webhook connectivity
  app.get("/api/extend-meeting-webhook-health", authenticateToken, async (req: any, res) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const response = await fetch("https://n8n.hireninja.site/webhook/Extendmeeting-ideofuzion", {
          method: "HEAD", // Just check if endpoint is reachable
          headers: { 
            "User-Agent": "HiringPlatform/1.0"
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        res.json({ 
          status: "healthy",
          webhookReachable: true,
          webhookStatus: response.status,
          timestamp: new Date().toISOString()
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        res.json({ 
          status: "unhealthy",
          webhookReachable: false,
          error: fetchError.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error checking extend meeting webhook health:", error);
      res.status(500).json({ 
        status: "error",
        error: "Failed to check extend meeting webhook health"
      });
    }
  });

  return httpServer;
}
