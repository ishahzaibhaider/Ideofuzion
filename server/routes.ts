import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod"; // Import Zod for validation
import { storage } from "./storage";
import { insertUserSchema, insertCandidateSchema } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Define a schema for the incoming job form data to validate the request body
const jobFormDataSchema = z.object({
  jobId: z.string().min(1, { message: "Job ID is required" }),
  jobTitle: z.string().min(1, { message: "Job Title is required" }),
  requiredSkills: z.array(z.string()).min(1, { message: "At least one skill is required" }),
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

  // Candidates routes
  app.get('/api/candidates', authenticateToken, async (req, res) => {
    try {
      const candidates = await storage.getCandidates();
      res.json(candidates);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.get('/api/candidates/:id', authenticateToken, async (req, res) => {
    try {
      const id = req.params.id;
      const candidate = await storage.getCandidate(id);
      if (!candidate) {
        return res.status(404).json({ message: 'Candidate not found' });
      }
      res.json(candidate);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.put('/api/candidates/:id', authenticateToken, async (req, res) => {
    try {
      const id = req.params.id;
      const updates = req.body;

      const candidate = await storage.updateCandidate(id, updates);
      if (!candidate) {
        return res.status(404).json({ message: 'Candidate not found' });
      }

      res.json(candidate);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.post('/api/candidates', authenticateToken, async (req, res) => {
    try {
      const candidateData = insertCandidateSchema.parse(req.body);
      const candidate = await storage.createCandidate(candidateData);
      res.status(201).json(candidate);
    } catch (error) {
      res.status(400).json({ message: 'Invalid input data', error });
    }
  });

  // Job routes
  app.get('/api/job-criteria', authenticateToken, async (req, res) => {
    try {
      const jobCriteria = await storage.getJobCriteria();
      res.json(jobCriteria);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.get('/api/job-criteria/:id', authenticateToken, async (req, res) => {
    try {
      const id = req.params.id;
      const jobCriteria = await storage.getJobCriteriaById(id);
      if (!jobCriteria) {
        return res.status(404).json({ message: 'Job criteria not found' });
      }
      res.json(jobCriteria);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // ✨ New route to handle job creation from the frontend form
  app.post('/api/jobs', authenticateToken, async (req, res) => {
    try {
      // Validate the incoming data against our new schema
      const jobData = jobFormDataSchema.parse(req.body);
      // Call the storage method which now expects this data structure
      const jobCriteria = await storage.createJobCriteria(jobData);
      res.status(201).json(jobCriteria);
    } catch (error) {
      // Handle validation errors from Zod or other errors
      res.status(400).json({ message: 'Invalid input data', error });
    }
  });

  // Add this inside your registerRoutes function in server/services/routes.ts

  app.put('/api/jobs/:id', authenticateToken, async (req, res) => {
    try {
      const id = req.params.id;
      // Validate the incoming data
      const jobData = jobFormDataSchema.parse(req.body);

      // The storage layer expects the DB format, so we map it here
      const updates = {
        "Job ID": jobData.jobId,
        "Job Title": jobData.jobTitle,
        "Required Skills": jobData.requiredSkills
      };

      // You will need to add an `updateJobCriteria` method to your storage class
      const jobCriteria = await storage.updateJobCriteria(id, updates);

      if (!jobCriteria) {
        return res.status(404).json({ message: 'Job not found' });
      }

      res.status(200).json(jobCriteria);
    } catch (error) {
      res.status(400).json({ message: 'Invalid input data', error });
    }
  });


  // N8N Integration routes
  app.post('/api/n8n/update-candidate', async (req, res) => {
    try {
      const { candidateId, updates } = req.body;

      if (!candidateId) {
        return res.status(400).json({ message: 'candidateId is required' });
      }

      const candidate = await storage.updateCandidate(candidateId, updates);
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
      const { analysis } = req.body;

      const candidate = await storage.updateCandidate(candidateId, {
        analysis,
        status: 'Analysis Complete'
      });

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

      const webhookUrl = `https://ali-shoaib.app.n8n.cloud/webhook-test/022f198b-9bb8-4ec8-8457-53df00516dbb?${params}`;

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
      res.status(500).json({ message: 'Failed to start interview bot', error: error.message });
    }
  });

  // Dashboard metrics
  app.get('/api/dashboard/metrics', authenticateToken, async (req, res) => {
    try {
      const candidates = await storage.getCandidates();
      const jobCriteria = await storage.getJobCriteria();

      const totalCandidates = candidates.length;
      const activeInterviews = candidates.filter(c => c.status === 'Interview Scheduled').length;
      const hiredCount = candidates.filter(c => c.status === 'Hired').length;
      const hireRate = totalCandidates > 0 ? Math.round((hiredCount / totalCandidates) * 100) : 0;

      // Calculate average time to hire (simplified)
      const hiredCandidates = candidates.filter(c => c.status === 'Hired');
      const avgTimeToHire = hiredCandidates.length > 0 ? '14d' : '0d';

      // Funnel data - removed Applications, moved future interviews to Interview Scheduled
      const today = new Date();
      const pakistanOffset = 5 * 60; // Pakistan is UTC+5
      const pakistanTime = new Date(today.getTime() + pakistanOffset * 60 * 1000);

      // Filter candidates with future interview dates for Interview Scheduled
      const interviewScheduledCount = candidates.filter(c => {
        if (!c["Interview Date"]) return false;
        const interviewDate = new Date(c["Interview Date"]);
        return interviewDate >= pakistanTime;
      }).length;

      const funnelStages = [
        { name: 'Qualified', count: candidates.filter(c => c.status === 'Qualified').length, color: 'green' },
        { name: 'Interview Scheduled', count: interviewScheduledCount, color: 'yellow' },
        { name: 'Analysis Complete', count: candidates.filter(c => c.status === 'Analysis Complete').length, color: 'purple' },
        { name: 'Hired', count: hiredCount, color: 'success' }
      ];

      // Since you mentioned your candidate has interview date "2025-07-28", let's show all interviews regardless of date for now
      // This will help us see what's happening with the data
      const upcomingInterviews = candidates
        .filter(c => {
          // Show all candidates that have interview date and time
          return c["Interview Date"] && c["Interview Time"];
        })
        .map(c => ({
          id: c.id,
          candidateName: c["Candidate Name"],
          position: c["Job Title"] || 'N/A',
          time: c["Interview Time"] || '',
          date: c["Interview Date"] || '',
          calendarLink: c["Calender Event Link"] || `https://calendar.google.com/calendar/event?eid=${c["Calendar Event ID"]}` // Use provided link or fallback
        }))
        .slice(0, 4);

      console.log('All interviews found:', upcomingInterviews.length);
      console.log('Interview data:', upcomingInterviews);

      res.json({
        totalCandidates,
        activeInterviews,
        hireRate,
        avgTimeToHire,
        funnelStages,
        upcomingInterviews
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  return httpServer;
}
