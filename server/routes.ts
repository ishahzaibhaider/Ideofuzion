import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod"; // Import Zod for validation
import { storage } from "./storage.js";
import { insertUserSchema, insertCandidateSchema, insertTranscriptSchema, insertUnavailableSlotSchema, type Candidate } from "../shared/schema.js";

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

// ✨ HELPER FUNCTION to parse date and time strings into a proper Date object in PKT
const parsePakistanTime = (dateStr?: string, timeStr?: string): Date | null => {
  if (!dateStr || !timeStr) {
    console.log('Missing date or time:', { dateStr, timeStr });
    return null;
  }

  // Try multiple time formats
  let timeParts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!timeParts) {
    // Try 24-hour format without AM/PM
    timeParts = timeStr.match(/(\d+):(\d+)/);
    if (!timeParts) {
      console.log('Invalid time format:', timeStr);
      return null;
    }
  }

  let [_, hours, minutes, modifier] = timeParts;
  let hour = parseInt(hours, 10);

  // Convert to 24-hour format if AM/PM is present
  if (modifier) {
    if (modifier.toUpperCase() === 'PM' && hour < 12) {
      hour += 12;
    }
    if (modifier.toUpperCase() === 'AM' && hour === 12) { // Handle midnight case (12 AM is 00 hours)
      hour = 0;
    }
  }

  // Try different date formats
  let isoString;
  
  // Check if date is already in YYYY-MM-DD format
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    isoString = `${dateStr}T${String(hour).padStart(2, '0')}:${minutes}:00.000+05:00`;
  } else {
    // Try converting other formats (DD/MM/YYYY, MM/DD/YYYY, etc.)
    const dateObj = new Date(dateStr);
    if (!isNaN(dateObj.getTime())) {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      isoString = `${year}-${month}-${day}T${String(hour).padStart(2, '0')}:${minutes}:00.000+05:00`;
    } else {
      console.log('Invalid date format:', dateStr);
      return null;
    }
  }

  try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) {
        console.log('Failed to create valid date:', isoString);
        return null;
      }
      console.log('Successfully parsed date:', { input: `${dateStr} ${timeStr}`, output: d.toISOString() });
      return d;
  } catch (e) {
      console.error("Error parsing date:", isoString, e);
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
      
      // --- DATE & TIME LOGIC ---
      const now = new Date(); // Current time on the server

      // Map all candidates to include a parsed interview Date object
      const candidatesWithParsedDate = candidates.map(c => ({
        ...c,
        interviewDateTime: parsePakistanTime(c["Interview Date"], c["Interview Time"]),
      }));

      // Auto-move candidates with past interviews to Analysis Phase
      const pastInterviewCandidates = candidatesWithParsedDate.filter(c => 
        c.status === 'Interview Scheduled' && 
        c.interviewDateTime && 
        c.interviewDateTime < now
      );

      // Update candidates with past interviews to Analysis Complete status
      for (const candidate of pastInterviewCandidates) {
        await storage.updateCandidate(candidate.id, { status: 'Analysis Complete' });
      }

      // Get updated candidates list after status changes
      const updatedCandidates = await storage.getCandidates();
      res.json(updatedCandidates);
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

      // Get candidate data before update to access Calendar Event ID
      const existingCandidate = await storage.getCandidate(id);
      if (!existingCandidate) {
        return res.status(404).json({ message: 'Candidate not found' });
      }

      const candidate = await storage.updateCandidate(id, updates);
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
            interviewDate: candidate["Interview Date"],
            interviewTime: candidate["Interview Time"],
            status: candidate.status,
            updates: updates,
            timestamp: new Date().toISOString(),
            // Send the updated candidate data for calendar sync
            updatedCandidate: {
              name: candidate["Candidate Name"],
              email: candidate.Email,
              jobTitle: candidate["Job Title"],
              interviewDate: candidate["Interview Date"],
              interviewTime: candidate["Interview Time"],
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

  app.post('/api/candidates', authenticateToken, async (req, res) => {
    try {
      const candidateData = insertCandidateSchema.parse(req.body);
      const candidate = await storage.createCandidate(candidateData);
      res.status(201).json(candidate);
    } catch (error) {
      res.status(400).json({ message: 'Invalid input data', error });
    }
  });

  app.delete('/api/candidates/:id', authenticateToken, async (req, res) => {
    try {
      const id = req.params.id;
      
      // Get candidate data before deletion to access Calendar Event ID
      const existingCandidate = await storage.getCandidate(id);
      if (!existingCandidate) {
        return res.status(404).json({ message: 'Candidate not found' });
      }

      const success = await storage.deleteCandidate(id);
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
            interviewDate: existingCandidate["Interview Date"],
            interviewTime: existingCandidate["Interview Time"],
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
  app.get('/api/interviews/upcoming', authenticateToken, async (req, res) => {
    try {
      const candidates = await storage.getCandidates();
      
      // --- DATE & TIME LOGIC ---
      const now = new Date(); // Current time on the server

      // Map all candidates to include a parsed interview Date object
      const candidatesWithParsedDate = candidates.map(c => ({
        ...c,
        interviewDateTime: parsePakistanTime(c["Interview Date"], c["Interview Time"]),
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
        time: c["Interview Time"] || '',
        date: c["Interview Date"] || '',
        calendarLink: c["Calender Event Link"] || `https://calendar.google.com/calendar/event?eid=${c["Calendar Event ID"]}`
      }));

      res.json(upcomingInterviews);
    } catch (error) {
      console.error("Error fetching upcoming interviews:", error);
      res.status(500).json({ message: 'Server error', error });
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

  // ✨ Enhanced route to handle job creation with optional skills
  app.post('/api/jobs', authenticateToken, async (req, res) => {
    try {
      // Validate the incoming data against our enhanced schema
      const jobData = jobFormDataSchema.parse(req.body);
      // Call the storage method which now expects both required and optional skills
      const jobCriteria = await storage.createJobCriteria(jobData);
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
  app.put('/api/jobs/:id', authenticateToken, async (req, res) => {
    try {
      const id = req.params.id;
      // Validate the incoming data against our enhanced schema
      const jobData = jobFormDataSchema.parse(req.body);

      // The storage layer expects the DB format, so we map it here
      const updates = {
        "Job ID": jobData.jobId,
        "Job Title": jobData.jobTitle,
        "Required Skills": jobData.requiredSkills,
        "Optional Skills": jobData.optionalSkills || [] // Include optional skills
      };

      const jobCriteria = await storage.updateJobCriteria(id, updates);

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
  app.delete('/api/jobs/:id', authenticateToken, async (req, res) => {
    try {
      const id = req.params.id;

      if (!id) {
        return res.status(400).json({ message: "Job ID is required" });
      }

      // Check if job exists before attempting to delete
      const existingJob = await storage.getJobCriteriaById(id);
      if (!existingJob) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Attempt to delete the job
      const deleteSuccess = await storage.deleteJobCriteria(id);

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

  // ✨ MODIFIED Dashboard metrics route
  app.get('/api/dashboard/metrics', authenticateToken, async (req, res) => {
    try {
      const candidates = await storage.getCandidates();
      const jobCriteria = await storage.getJobCriteria();

      console.log('Dashboard - Raw candidates count:', candidates.length);
      console.log('Dashboard - Sample candidate statuses:', candidates.slice(0, 3).map(c => ({ id: c.id, status: c.status })));
      console.log('Dashboard - Sample candidate interview data:', candidates.slice(0, 3).map(c => ({ 
        id: c.id, 
        date: c["Interview Date"], 
        time: c["Interview Time"],
        parsedDateTime: parsePakistanTime(c["Interview Date"], c["Interview Time"])
      })));

      // --- DATE & TIME LOGIC ---
      const now = new Date(); // Current time on the server

      // Map all candidates to include a parsed interview Date object
      const candidatesWithParsedDate = candidates.map(c => ({
        ...c,
        interviewDateTime: parsePakistanTime(c["Interview Date"], c["Interview Time"]),
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
        await storage.updateCandidate(candidate.id, { status: 'Analysis Complete' });
      }

      // Get updated candidates list after status changes
      const updatedCandidates = await storage.getCandidates();
      const updatedCandidatesWithParsedDate = updatedCandidates.map(c => ({
        ...c,
        interviewDateTime: parsePakistanTime(c["Interview Date"], c["Interview Time"]),
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
            time: c["Interview Time"] || '',
            date: c["Interview Date"] || '',
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
            time: c["Interview Time"] || 'Time TBD',
            date: c["Interview Date"] || 'Date TBD',
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
  app.get("/api/transcripts", authenticateToken, async (req, res) => {
    try {
      const transcripts = await storage.getTranscripts();
      res.json(transcripts);
    } catch (error) {
      console.error("Error getting transcripts:", error);
      res.status(500).json({ error: "Failed to get transcripts" });
    }
  });

  app.get("/api/transcripts/latest", authenticateToken, async (req, res) => {
    try {
      const transcript = await storage.getLatestTranscript();
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

  app.post("/api/transcripts", authenticateToken, async (req, res) => {
    try {
      const { error, data } = insertTranscriptSchema.safeParse(req.body);
      if (error) {
        return res.status(400).json({ error: "Invalid input", details: error.issues });
      }
      const transcript = await storage.createTranscript(data);
      res.status(201).json(transcript);
    } catch (error) {
      console.error("Error creating transcript:", error);
      res.status(500).json({ error: "Failed to create transcript" });
    }
  });

  // Unavailable Slots routes
  app.get("/api/unavailable-slots", authenticateToken, async (req, res) => {
    try {
      const slots = await storage.getUnavailableSlots();
      res.json(slots);
    } catch (error) {
      console.error("Error getting unavailable slots:", error);
      res.status(500).json({ error: "Failed to get unavailable slots" });
    }
  });

  app.post("/api/unavailable-slots", authenticateToken, async (req, res) => {
    try {
      const { error, data } = insertUnavailableSlotSchema.safeParse(req.body);
      if (error) {
        return res.status(400).json({ error: "Invalid input", details: error.issues });
      }
      const slot = await storage.createUnavailableSlot(data);
      res.status(201).json(slot);
    } catch (error) {
      console.error("Error creating unavailable slot:", error);
      res.status(500).json({ error: "Failed to create unavailable slot" });
    }
  });

  app.put("/api/unavailable-slots/:id", authenticateToken, async (req, res) => {
    try {
      const { error, data } = insertUnavailableSlotSchema.safeParse(req.body);
      if (error) {
        return res.status(400).json({ error: "Invalid input", details: error.issues });
      }
      const slot = await storage.updateUnavailableSlot(req.params.id, data);
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

  app.delete("/api/unavailable-slots/:id", authenticateToken, async (req, res) => {
    try {
      const success = await storage.deleteUnavailableSlot(req.params.id);
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

  return httpServer;
}
