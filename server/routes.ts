import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { insertUserSchema, insertCandidateSchema } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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
      const id = parseInt(req.params.id);
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
      const id = parseInt(req.params.id);
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

  // Jobs routes
  app.get('/api/jobs', authenticateToken, async (req, res) => {
    try {
      const jobs = await storage.getJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
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
      const candidateId = parseInt(req.params.candidateId);
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
      const jobs = await storage.getJobs();
      
      const totalCandidates = candidates.length;
      const activeInterviews = candidates.filter(c => c.status === 'Interview Scheduled').length;
      const hiredCount = candidates.filter(c => c.status === 'Hired').length;
      const hireRate = totalCandidates > 0 ? Math.round((hiredCount / totalCandidates) * 100) : 0;
      
      // Calculate average time to hire (simplified)
      const hiredCandidates = candidates.filter(c => c.status === 'Hired');
      const avgTimeToHire = hiredCandidates.length > 0 ? '14d' : '0d';

      // Funnel data
      const funnelStages = [
        { name: 'Applications', count: candidates.filter(c => c.status === 'New').length, color: 'blue' },
        { name: 'Qualified', count: candidates.filter(c => c.status === 'Qualified').length, color: 'green' },
        { name: 'Interview Scheduled', count: candidates.filter(c => c.status === 'Interview Scheduled').length, color: 'yellow' },
        { name: 'Analysis Complete', count: candidates.filter(c => c.status === 'Analysis Complete').length, color: 'purple' },
        { name: 'Hired', count: hiredCount, color: 'success' }
      ];

      // Upcoming interviews
      const upcomingInterviews = candidates
        .filter(c => c.status === 'Interview Scheduled' && c.interviewDetails?.dateTime)
        .map(c => ({
          id: c.id,
          candidateName: c.name,
          position: c.previousRole || 'N/A',
          time: c.interviewDetails?.dateTime ? new Date(c.interviewDetails.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          date: c.interviewDetails?.dateTime ? new Date(c.interviewDetails.dateTime).toLocaleDateString() : ''
        }))
        .slice(0, 4);

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
