// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z as z2 } from "zod";

// shared/schema.ts
import mongoose, { Schema } from "mongoose";
import { z } from "zod";
var userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
var UserModel = mongoose.model("User", userSchema, "users");
var jobCriteriaSchema = new Schema({
  "Job ID": { type: String, required: true },
  "Job Title": { type: String, required: true },
  "Required Skills": [{ type: String, required: true }],
  "Optional Skills": [{ type: String }]
  // Add this line
}, { collection: "jobCriteria" });
var JobCriteriaModel = mongoose.model("JobCriteria", jobCriteriaSchema);
var candidateSchema = new Schema({
  "Candidate Name": { type: String, required: true },
  Email: { type: String, required: true },
  "Job Title": { type: String, required: true },
  "Interview Date": { type: String, required: true },
  "Interview Time": { type: String, required: true },
  "Calendar Event ID": { type: String, required: true },
  "Calender Event Link": { type: String },
  "Google Meet Id": { type: String },
  "Resume Link": { type: String },
  status: { type: String, default: "New" },
  cvUrl: { type: String },
  analysis: {
    transcript: { type: String },
    summary: { type: String },
    technicalScore: { type: Number },
    psychometricAnalysis: { type: String },
    finalRecommendation: { type: String }
  },
  appliedDate: { type: Date, default: Date.now },
  skills: [{ type: String }],
  experience: { type: String },
  education: { type: String },
  score: { type: Number }
}, { collection: "candidates" });
var CandidateModel = mongoose.model("Candidate", candidateSchema);
var transcriptSchema = new Schema({
  fid: { type: Number, required: true },
  Speaker1: { type: String },
  Speaker2: { type: String },
  Speaker3: { type: String },
  suggestedQuestions: [{ type: String }],
  summary: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { collection: "transcripts" });
var TranscriptModel = mongoose.model("Transcript", transcriptSchema);
var insertUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string()
});
var insertJobCriteriaSchema = z.object({
  "Job ID": z.string(),
  "Job Title": z.string(),
  "Required Skills": z.array(z.string()),
  "Optional Skills": z.array(z.string()).optional()
});
var insertCandidateSchema = z.object({
  "Candidate Name": z.string(),
  Email: z.string().email(),
  "Job Title": z.string(),
  "Interview Date": z.string(),
  "Interview Time": z.string(),
  "Calendar Event ID": z.string(),
  status: z.string().optional(),
  cvUrl: z.string().optional(),
  analysis: z.object({
    transcript: z.string().optional(),
    summary: z.string().optional(),
    technicalScore: z.number().optional(),
    psychometricAnalysis: z.string().optional(),
    finalRecommendation: z.string().optional()
  }).optional(),
  skills: z.array(z.string()).optional(),
  experience: z.string().optional(),
  education: z.string().optional(),
  score: z.number().optional()
});
var insertTranscriptSchema = z.object({
  fid: z.number(),
  Speaker1: z.string().optional(),
  Speaker2: z.string().optional(),
  Speaker3: z.string().optional(),
  suggestedQuestions: z.array(z.string()).optional(),
  summary: z.string().optional()
});
var availableSlotSchema = new Schema({
  date: { type: String, required: true },
  // ISO date format
  startTime: { type: String, required: true },
  // ISO datetime format
  endTime: { type: String, required: true },
  // ISO datetime format
  isBooked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { collection: "available_slots" });
var AvailableSlotModel = mongoose.model("AvailableSlot", availableSlotSchema);
var insertAvailableSlotSchema = z.object({
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  isBooked: z.boolean().optional()
});

// server/db.ts
import mongoose2 from "mongoose";
import dotenv from "dotenv";
dotenv.config();
if (!process.env.MONGODB_URI) {
  throw new Error(
    "MONGODB_URI must be set. Please provide your MongoDB Atlas connection string."
  );
}
var connectToDatabase = async () => {
  try {
    if (mongoose2.connection.readyState === 0) {
      await mongoose2.connect(process.env.MONGODB_URI, {
        dbName: "ideofuzion"
      });
      console.log("Connected to MongoDB Atlas - ideofuzion database");
    }
  } catch (error) {
    console.error("Failed to connect to MongoDB Atlas:", error);
    throw error;
  }
};

// server/storage.ts
import dotenv2 from "dotenv";
dotenv2.config();
var MongoStorage = class {
  constructor() {
    connectToDatabase();
    this.initializeBasicData();
  }
  async initializeBasicData() {
    try {
      console.log("Connected to existing ideofuzion database with candidates and jobCriteria collections");
    } catch (error) {
      console.log("Unable to initialize basic data, database may not be connected yet");
    }
  }
  // Helper function to convert MongoDB document to our type format
  mongoDocToUser(doc) {
    return {
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      password: doc.password,
      createdAt: doc.createdAt
    };
  }
  mongoDocToJobCriteria(doc) {
    return {
      id: doc._id.toString(),
      "Job ID": doc["Job ID"],
      "Job Title": doc["Job Title"],
      "Required Skills": doc["Required Skills"],
      "Optional Skills": doc["Optional Skills"] || []
      // Add optional skills with fallback
    };
  }
  // In storage.ts
  mongoDocToCandidate(doc) {
    return {
      id: doc._id.toString(),
      // Database field names (required)
      "Candidate Name": doc["Candidate Name"],
      Email: doc.Email,
      "Job Title": doc["Job Title"],
      "Interview Date": doc["Interview Date"],
      "Interview Time": doc["Interview Time"],
      "Calendar Event ID": doc["Calendar Event ID"],
      "Calender Event Link": doc["Calender Event Link"],
      "Google Meet Id": doc["Google Meet Id"],
      "Resume Link": doc["Resume Link"],
      // <--- This is the line I added
      status: doc.status || "New",
      cvUrl: doc.cvUrl,
      analysis: doc.analysis,
      appliedDate: doc.appliedDate,
      skills: doc.skills,
      experience: doc.experience,
      education: doc.education,
      score: doc.score,
      // Frontend-friendly mapped fields
      name: doc["Candidate Name"],
      email: doc.Email,
      previousRole: doc["Job Title"],
      interviewDate: doc["Interview Date"],
      interviewTime: doc["Interview Time"],
      calendarEventId: doc["Calendar Event ID"],
      calenderEventLink: doc["Calender Event Link"],
      googleMeetId: doc["Google Meet Id"]
    };
  }
  async getUser(id) {
    try {
      const user = await UserModel.findById(id);
      return user ? this.mongoDocToUser(user) : void 0;
    } catch (error) {
      console.error("Error getting user:", error);
      return void 0;
    }
  }
  async getUserByEmail(email) {
    try {
      const user = await UserModel.findOne({ email });
      return user ? this.mongoDocToUser(user) : void 0;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return void 0;
    }
  }
  async createUser(insertUser) {
    try {
      const user = await UserModel.create(insertUser);
      return this.mongoDocToUser(user);
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
  async getJobCriteria() {
    try {
      const jobCriteria = await JobCriteriaModel.find();
      return jobCriteria.map((criteria) => this.mongoDocToJobCriteria(criteria));
    } catch (error) {
      console.error("Error getting job criteria:", error);
      return [];
    }
  }
  async getJobCriteriaById(id) {
    try {
      const jobCriteria = await JobCriteriaModel.findById(id);
      return jobCriteria ? this.mongoDocToJobCriteria(jobCriteria) : void 0;
    } catch (error) {
      console.error("Error getting job criteria:", error);
      return void 0;
    }
  }
  async createJobCriteria(jobData) {
    try {
      const jobToCreate = {
        "Job ID": jobData.jobId,
        "Job Title": jobData.jobTitle,
        "Required Skills": jobData.requiredSkills,
        "Optional Skills": jobData.optionalSkills || []
        // Add optional skills support
      };
      const jobCriteria = await JobCriteriaModel.create(jobToCreate);
      return this.mongoDocToJobCriteria(jobCriteria);
    } catch (error) {
      console.error("Error creating job criteria:", error);
      throw error;
    }
  }
  // ✨ Implementation for updating a job
  async updateJobCriteria(id, updates) {
    try {
      const updatedJob = await JobCriteriaModel.findByIdAndUpdate(
        id,
        updates,
        { new: true }
        // Return the updated document
      );
      return updatedJob ? this.mongoDocToJobCriteria(updatedJob) : void 0;
    } catch (error) {
      console.error("Error updating job criteria:", error);
      return void 0;
    }
  }
  // ✨ Implementation for deleting a job
  async deleteJobCriteria(id) {
    try {
      const result = await JobCriteriaModel.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      console.error("Error deleting job criteria:", error);
      return false;
    }
  }
  async getCandidates() {
    try {
      const candidates = await CandidateModel.find();
      return candidates.map((candidate) => this.mongoDocToCandidate(candidate));
    } catch (error) {
      console.error("Error getting candidates:", error);
      return [];
    }
  }
  async getCandidate(id) {
    try {
      const candidate = await CandidateModel.findById(id);
      return candidate ? this.mongoDocToCandidate(candidate) : void 0;
    } catch (error) {
      console.error("Error getting candidate:", error);
      return void 0;
    }
  }
  async createCandidate(insertCandidate) {
    try {
      const candidate = await CandidateModel.create(insertCandidate);
      return this.mongoDocToCandidate(candidate);
    } catch (error) {
      console.error("Error creating candidate:", error);
      throw error;
    }
  }
  async updateCandidate(id, updates) {
    try {
      const mongoUpdates = {};
      if (updates.name) mongoUpdates["Candidate Name"] = updates.name;
      if (updates.email) mongoUpdates.Email = updates.email;
      if (updates.previousRole) mongoUpdates["Job Title"] = updates.previousRole;
      if (updates.interviewDate) mongoUpdates["Interview Date"] = updates.interviewDate;
      if (updates.interviewTime) mongoUpdates["Interview Time"] = updates.interviewTime;
      if (updates.status) mongoUpdates.status = updates.status;
      if (updates.cvUrl) mongoUpdates.cvUrl = updates.cvUrl;
      if (updates.analysis) mongoUpdates.analysis = updates.analysis;
      if (updates.skills) mongoUpdates.skills = updates.skills;
      if (updates.experience) mongoUpdates.experience = updates.experience;
      if (updates.education) mongoUpdates.education = updates.education;
      if (updates.score) mongoUpdates.score = updates.score;
      console.log("Updating candidate with ID:", id);
      console.log("Frontend updates:", updates);
      console.log("Mapped MongoDB updates:", mongoUpdates);
      const candidate = await CandidateModel.findByIdAndUpdate(
        id,
        mongoUpdates,
        { new: true }
      );
      if (candidate) {
        console.log("Successfully updated candidate in MongoDB");
        return this.mongoDocToCandidate(candidate);
      } else {
        console.log("Candidate not found in MongoDB");
        return void 0;
      }
    } catch (error) {
      console.error("Error updating candidate:", error);
      return void 0;
    }
  }
  async deleteCandidate(id) {
    try {
      const result = await CandidateModel.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      console.error("Error deleting candidate:", error);
      return false;
    }
  }
  async deleteCandidatesByStatus(status) {
    try {
      await CandidateModel.deleteMany({ status });
    } catch (error) {
      console.error("Error deleting candidates by status:", error);
      throw error;
    }
  }
  // Helper method to convert MongoDB document to Transcript
  mongoDocToTranscript(doc) {
    return {
      id: doc._id.toString(),
      fid: doc.fid,
      Speaker1: doc.Speaker1,
      Speaker2: doc.Speaker2,
      Speaker3: doc.Speaker3,
      suggestedQuestions: doc.suggestedQuestions || [],
      summary: doc.summary,
      createdAt: doc.createdAt
    };
  }
  async getTranscripts() {
    try {
      const transcripts = await TranscriptModel.find();
      return transcripts.map((transcript) => this.mongoDocToTranscript(transcript));
    } catch (error) {
      console.error("Error getting transcripts:", error);
      return [];
    }
  }
  async getLatestTranscript() {
    try {
      const transcript = await TranscriptModel.findOne().sort({ createdAt: -1 });
      return transcript ? this.mongoDocToTranscript(transcript) : void 0;
    } catch (error) {
      console.error("Error getting latest transcript:", error);
      return void 0;
    }
  }
  async createTranscript(insertTranscript) {
    try {
      const transcript = await TranscriptModel.create(insertTranscript);
      return this.mongoDocToTranscript(transcript);
    } catch (error) {
      console.error("Error creating transcript:", error);
      throw error;
    }
  }
  // Helper method to convert MongoDB document to AvailableSlot
  mongoDocToAvailableSlot(doc) {
    return {
      id: doc._id.toString(),
      date: doc.date,
      startTime: doc.startTime,
      endTime: doc.endTime,
      isBooked: doc.isBooked,
      createdAt: doc.createdAt
    };
  }
  async getAvailableSlots() {
    try {
      const slots = await AvailableSlotModel.find().sort({ date: 1, startTime: 1 });
      return slots.map((slot) => this.mongoDocToAvailableSlot(slot));
    } catch (error) {
      console.error("Error getting available slots:", error);
      return [];
    }
  }
  async createAvailableSlot(insertSlot) {
    try {
      const slot = await AvailableSlotModel.create(insertSlot);
      return this.mongoDocToAvailableSlot(slot);
    } catch (error) {
      console.error("Error creating available slot:", error);
      throw error;
    }
  }
  async deleteAvailableSlot(id) {
    try {
      const result = await AvailableSlotModel.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      console.error("Error deleting available slot:", error);
      return false;
    }
  }
};
var storage = new MongoStorage();

// server/routes.ts
import dotenv3 from "dotenv";
dotenv3.config();
var JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
var jobFormDataSchema = z2.object({
  jobId: z2.string().min(1, { message: "Job ID is required" }),
  jobTitle: z2.string().min(1, { message: "Job Title is required" }),
  requiredSkills: z2.array(z2.string()).min(1, { message: "At least one required skill is necessary" }),
  optionalSkills: z2.array(z2.string()).optional().default([])
  // Add optional skills support
});
var authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};
var parsePakistanTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) {
    console.log("Missing date or time:", { dateStr, timeStr });
    return null;
  }
  let timeParts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!timeParts) {
    timeParts = timeStr.match(/(\d+):(\d+)/);
    if (!timeParts) {
      console.log("Invalid time format:", timeStr);
      return null;
    }
  }
  let [_, hours, minutes, modifier] = timeParts;
  let hour = parseInt(hours, 10);
  if (modifier) {
    if (modifier.toUpperCase() === "PM" && hour < 12) {
      hour += 12;
    }
    if (modifier.toUpperCase() === "AM" && hour === 12) {
      hour = 0;
    }
  }
  let isoString;
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    isoString = `${dateStr}T${String(hour).padStart(2, "0")}:${minutes}:00.000+05:00`;
  } else {
    const dateObj = new Date(dateStr);
    if (!isNaN(dateObj.getTime())) {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      isoString = `${year}-${month}-${day}T${String(hour).padStart(2, "0")}:${minutes}:00.000+05:00`;
    } else {
      console.log("Invalid date format:", dateStr);
      return null;
    }
  }
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      console.log("Failed to create valid date:", isoString);
      return null;
    }
    console.log("Successfully parsed date:", { input: `${dateStr} ${timeStr}`, output: d.toISOString() });
    return d;
  } catch (e) {
    console.error("Error parsing date:", isoString, e);
    return null;
  }
};
async function registerRoutes(app2) {
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const activeConnections = /* @__PURE__ */ new Map();
  wss.on("connection", (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const interviewId = url.searchParams.get("interviewId");
    if (interviewId) {
      activeConnections.set(interviewId, ws);
      console.log(`WebSocket connected for interview: ${interviewId}`);
    }
    ws.on("close", () => {
      if (interviewId) {
        activeConnections.delete(interviewId);
        console.log(`WebSocket disconnected for interview: ${interviewId}`);
      }
    });
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });
  const broadcast = (interviewId, data) => {
    const ws = activeConnections.get(interviewId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  };
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });
      res.status(201).json({
        user: { id: user.id, name: user.name, email: user.email },
        token
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid input data", error });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });
      res.json({
        user: { id: user.id, name: user.name, email: user.email },
        token
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ id: user.id, name: user.name, email: user.email });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.get("/api/candidates", authenticateToken, async (req, res) => {
    try {
      const candidates = await storage.getCandidates();
      const now = /* @__PURE__ */ new Date();
      const candidatesWithParsedDate = candidates.map((c) => ({
        ...c,
        interviewDateTime: parsePakistanTime(c["Interview Date"], c["Interview Time"])
      }));
      const pastInterviewCandidates = candidatesWithParsedDate.filter(
        (c) => c.status === "Interview Scheduled" && c.interviewDateTime && c.interviewDateTime < now
      );
      for (const candidate of pastInterviewCandidates) {
        await storage.updateCandidate(candidate.id, { status: "Analysis Complete" });
      }
      const updatedCandidates = await storage.getCandidates();
      res.json(updatedCandidates);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.get("/api/candidates/:id", authenticateToken, async (req, res) => {
    try {
      const id = req.params.id;
      const candidate = await storage.getCandidate(id);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      res.json(candidate);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.put("/api/candidates/:id", authenticateToken, async (req, res) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const existingCandidate = await storage.getCandidate(id);
      if (!existingCandidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      const candidate = await storage.updateCandidate(id, updates);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      try {
        const calendarEventId = candidate["Calendar Event ID"];
        if (calendarEventId) {
          console.log("Triggering N8N update webhook for candidate:", candidate["Candidate Name"], "Calendar Event ID:", calendarEventId);
          const webhookPayload = {
            candidateId: candidate.id,
            candidateName: candidate["Candidate Name"],
            calendarEventId,
            interviewDate: candidate["Interview Date"],
            interviewTime: candidate["Interview Time"],
            status: candidate.status,
            updates,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
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
          const response = await fetch("http://54.226.92.93:5678/webhook-test/update-calendar-event", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(webhookPayload)
          });
          if (!response.ok) {
            console.error("N8N update webhook failed:", response.status, await response.text());
          } else {
            const responseData = await response.json();
            console.log("N8N update webhook success:", responseData);
          }
        } else {
          console.log("No Calendar Event ID found for candidate, skipping webhook");
        }
      } catch (webhookError) {
        console.error("Error calling N8N update webhook:", webhookError);
      }
      res.json(candidate);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.post("/api/candidates", authenticateToken, async (req, res) => {
    try {
      const candidateData = insertCandidateSchema.parse(req.body);
      const candidate = await storage.createCandidate(candidateData);
      res.status(201).json(candidate);
    } catch (error) {
      res.status(400).json({ message: "Invalid input data", error });
    }
  });
  app2.delete("/api/candidates/:id", authenticateToken, async (req, res) => {
    try {
      const id = req.params.id;
      const existingCandidate = await storage.getCandidate(id);
      if (!existingCandidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      const success = await storage.deleteCandidate(id);
      if (!success) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      try {
        const calendarEventId = existingCandidate["Calendar Event ID"];
        if (calendarEventId) {
          console.log("Triggering N8N delete webhook for candidate:", existingCandidate["Candidate Name"], "Calendar Event ID:", calendarEventId);
          const webhookPayload = {
            candidateId: existingCandidate.id,
            candidateName: existingCandidate["Candidate Name"],
            calendarEventId,
            interviewDate: existingCandidate["Interview Date"],
            interviewTime: existingCandidate["Interview Time"],
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          };
          const response = await fetch("http://54.226.92.93:5678/webhook-test/delete-calendar-event", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(webhookPayload)
          });
          if (!response.ok) {
            console.error("N8N delete webhook failed:", response.status, await response.text());
          } else {
            const responseData = await response.json();
            console.log("N8N delete webhook success:", responseData);
          }
        } else {
          console.log("No Calendar Event ID found for candidate, skipping webhook");
        }
      } catch (webhookError) {
        console.error("Error calling N8N delete webhook:", webhookError);
      }
      res.json({ message: "Candidate deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.get("/api/interviews/upcoming", authenticateToken, async (req, res) => {
    try {
      const candidates = await storage.getCandidates();
      const now = /* @__PURE__ */ new Date();
      const candidatesWithParsedDate = candidates.map((c) => ({
        ...c,
        interviewDateTime: parsePakistanTime(c["Interview Date"], c["Interview Time"])
      }));
      const futureInterviews = candidatesWithParsedDate.filter(
        (c) => c.interviewDateTime && c.interviewDateTime > now
      );
      const upcomingInterviews = futureInterviews.map((c) => ({
        id: c.id,
        candidateName: c["Candidate Name"],
        position: c["Job Title"] || "N/A",
        time: c["Interview Time"] || "",
        date: c["Interview Date"] || "",
        calendarLink: c["Calender Event Link"] || `https://calendar.google.com/calendar/event?eid=${c["Calendar Event ID"]}`
      }));
      res.json(upcomingInterviews);
    } catch (error) {
      console.error("Error fetching upcoming interviews:", error);
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.get("/api/job-criteria", authenticateToken, async (req, res) => {
    try {
      const jobCriteria = await storage.getJobCriteria();
      res.json(jobCriteria);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.get("/api/job-criteria/:id", authenticateToken, async (req, res) => {
    try {
      const id = req.params.id;
      const jobCriteria = await storage.getJobCriteriaById(id);
      if (!jobCriteria) {
        return res.status(404).json({ message: "Job criteria not found" });
      }
      res.json(jobCriteria);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.post("/api/jobs", authenticateToken, async (req, res) => {
    try {
      const jobData = jobFormDataSchema.parse(req.body);
      const jobCriteria = await storage.createJobCriteria(jobData);
      res.status(201).json(jobCriteria);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message
          }))
        });
      }
      res.status(400).json({ message: "Invalid input data", error });
    }
  });
  app2.put("/api/jobs/:id", authenticateToken, async (req, res) => {
    try {
      const id = req.params.id;
      const jobData = jobFormDataSchema.parse(req.body);
      const updates = {
        "Job ID": jobData.jobId,
        "Job Title": jobData.jobTitle,
        "Required Skills": jobData.requiredSkills,
        "Optional Skills": jobData.optionalSkills || []
        // Include optional skills
      };
      const jobCriteria = await storage.updateJobCriteria(id, updates);
      if (!jobCriteria) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.status(200).json(jobCriteria);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message
          }))
        });
      }
      res.status(400).json({ message: "Invalid input data", error });
    }
  });
  app2.delete("/api/jobs/:id", authenticateToken, async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: "Job ID is required" });
      }
      const existingJob = await storage.getJobCriteriaById(id);
      if (!existingJob) {
        return res.status(404).json({ message: "Job not found" });
      }
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
  app2.post("/api/n8n/update-candidate", async (req, res) => {
    try {
      const { candidateId, updates } = req.body;
      if (!candidateId) {
        return res.status(400).json({ message: "candidateId is required" });
      }
      const candidate = await storage.updateCandidate(candidateId, updates);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      res.json({ success: true, candidate });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.post("/api/n8n/live-data/:interviewId", async (req, res) => {
    try {
      const { interviewId } = req.params;
      const { transcript, suggestions, analysis } = req.body;
      broadcast(interviewId, {
        type: "live-update",
        data: {
          transcript,
          suggestions,
          analysis,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.post("/api/n8n/final-report/:candidateId", async (req, res) => {
    try {
      const candidateId = req.params.candidateId;
      const { analysis } = req.body;
      const candidate = await storage.updateCandidate(candidateId, {
        analysis,
        status: "Analysis Complete"
      });
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      res.json({ success: true, candidate });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.post("/api/sync-cvs", authenticateToken, async (req, res) => {
    try {
      const params = new URLSearchParams({
        action: "sync_cvs",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        userId: req.user.userId.toString()
      });
      const webhookUrl = `https://ali-shoaib.app.n8n.cloud/webhook-test/9f3916ff-5ef8-47e2-8170-fea53c456554?${params}`;
      const response = await fetch(webhookUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("N8N webhook error:", response.status, errorText);
        if (response.status === 404) {
          throw new Error(`N8N webhook not active. Please activate your workflow in N8N by clicking 'Execute workflow' button first.`);
        }
        throw new Error(`Failed to trigger CV sync: ${response.status} - ${errorText}`);
      }
      const responseData = await response.json();
      console.log("N8N CV sync response:", responseData);
      res.json({ success: true, message: "CV sync triggered successfully", data: responseData });
    } catch (error) {
      console.error("CV sync error:", error);
      res.status(500).json({ message: "Failed to sync CVs", error: error.message });
    }
  });
  app2.post("/api/start-interview-bot", authenticateToken, async (req, res) => {
    try {
      const { meetingId, candidateId } = req.body;
      const params = new URLSearchParams({
        action: "start_interview_bot",
        meetingId: meetingId || `interview-${Date.now()}`,
        candidateId: candidateId?.toString() || "",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      const webhookUrl = `https://ali-shoaib.app.n8n.cloud/webhook-test/022f198b-9bb8-4ec8-8457-53df00516dbb?${params}`;
      const response = await fetch(webhookUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("N8N interview webhook error:", response.status, errorText);
        if (response.status === 404) {
          throw new Error(`N8N interview webhook not active. Please activate your workflow in N8N by clicking 'Execute workflow' button first.`);
        }
        throw new Error(`Failed to start interview bot: ${response.status} - ${errorText}`);
      }
      const responseData = await response.json();
      console.log("N8N interview bot response:", responseData);
      res.json({ success: true, message: "Interview bot started successfully", data: responseData });
    } catch (error) {
      console.error("Interview bot error:", error);
      res.status(500).json({ message: "Failed to start interview bot", error: error.message });
    }
  });
  app2.get("/api/dashboard/metrics", authenticateToken, async (req, res) => {
    try {
      const candidates = await storage.getCandidates();
      const jobCriteria = await storage.getJobCriteria();
      console.log("Dashboard - Raw candidates count:", candidates.length);
      console.log("Dashboard - Sample candidate statuses:", candidates.slice(0, 3).map((c) => ({ id: c.id, status: c.status })));
      console.log("Dashboard - Sample candidate interview data:", candidates.slice(0, 3).map((c) => ({
        id: c.id,
        date: c["Interview Date"],
        time: c["Interview Time"],
        parsedDateTime: parsePakistanTime(c["Interview Date"], c["Interview Time"])
      })));
      const now = /* @__PURE__ */ new Date();
      const candidatesWithParsedDate = candidates.map((c) => ({
        ...c,
        interviewDateTime: parsePakistanTime(c["Interview Date"], c["Interview Time"])
      }));
      const pastInterviewCandidates = candidatesWithParsedDate.filter(
        (c) => c.status === "Interview Scheduled" && c.interviewDateTime && c.interviewDateTime < now
      );
      console.log("Dashboard - Past interview candidates to move:", pastInterviewCandidates.length);
      for (const candidate of pastInterviewCandidates) {
        await storage.updateCandidate(candidate.id, { status: "Analysis Complete" });
      }
      const updatedCandidates = await storage.getCandidates();
      const updatedCandidatesWithParsedDate = updatedCandidates.map((c) => ({
        ...c,
        interviewDateTime: parsePakistanTime(c["Interview Date"], c["Interview Time"])
      }));
      const totalCandidates = updatedCandidates.length;
      const hiredCount = updatedCandidates.filter((c) => c.status === "Hired").length;
      const hireRate = totalCandidates > 0 ? Math.round(hiredCount / totalCandidates * 100) : 0;
      const avgTimeToHire = hiredCount > 0 ? "14d" : "0d";
      const futureInterviews = updatedCandidatesWithParsedDate.filter(
        (c) => c.interviewDateTime && c.interviewDateTime > now
      );
      console.log("Dashboard - Future interviews count:", futureInterviews.length);
      console.log("Dashboard - Status counts:", {
        "Interview Scheduled": updatedCandidates.filter((c) => c.status === "Interview Scheduled").length,
        "Analysis Complete": updatedCandidates.filter((c) => c.status === "Analysis Complete").length,
        "Hired": hiredCount
      });
      const interviewScheduledCount = updatedCandidates.filter((c) => c.status === "Interview Scheduled").length;
      const analysisCompleteCount = updatedCandidates.filter((c) => c.status === "Analysis Complete").length;
      const funnelStages = [
        { name: "Interview Scheduled", count: interviewScheduledCount, color: "yellow" },
        { name: "Analysis Phase", count: analysisCompleteCount, color: "purple" },
        { name: "Hired", count: hiredCount, color: "success" }
      ];
      let upcomingInterviews;
      if (futureInterviews.length > 0) {
        upcomingInterviews = futureInterviews.map((c) => ({
          id: c.id,
          candidateName: c["Candidate Name"],
          position: c["Job Title"] || "N/A",
          time: c["Interview Time"] || "",
          date: c["Interview Date"] || "",
          calendarLink: c["Calender Event Link"] || `https://calendar.google.com/calendar/event?eid=${c["Calendar Event ID"]}`
        })).slice(0, 4);
      } else {
        console.log("No future interviews parsed, falling back to all Interview Scheduled candidates");
        upcomingInterviews = updatedCandidates.filter((c) => c.status === "Interview Scheduled").map((c) => ({
          id: c.id,
          candidateName: c["Candidate Name"],
          position: c["Job Title"] || "N/A",
          time: c["Interview Time"] || "Time TBD",
          date: c["Interview Date"] || "Date TBD",
          calendarLink: c["Calender Event Link"] || `https://calendar.google.com/calendar/event?eid=${c["Calendar Event ID"]}`
        })).slice(0, 4);
      }
      console.log("Dashboard - Upcoming interviews:", upcomingInterviews.length);
      console.log("Dashboard - Final funnel stages:", funnelStages);
      res.json({
        totalCandidates,
        activeInterviews: futureInterviews.length,
        // This metric is also now accurate
        hireRate,
        avgTimeToHire,
        funnelStages,
        upcomingInterviews
      });
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.get("/api/transcripts", authenticateToken, async (req, res) => {
    try {
      const transcripts = await storage.getTranscripts();
      res.json(transcripts);
    } catch (error) {
      console.error("Error getting transcripts:", error);
      res.status(500).json({ error: "Failed to get transcripts" });
    }
  });
  app2.get("/api/transcripts/latest", authenticateToken, async (req, res) => {
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
  app2.post("/api/transcripts", authenticateToken, async (req, res) => {
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
  app2.get("/api/available-slots", authenticateToken, async (req, res) => {
    try {
      const slots = await storage.getAvailableSlots();
      res.json(slots);
    } catch (error) {
      console.error("Error getting available slots:", error);
      res.status(500).json({ error: "Failed to get available slots" });
    }
  });
  app2.post("/api/available-slots", authenticateToken, async (req, res) => {
    try {
      const { error, data } = insertAvailableSlotSchema.safeParse(req.body);
      if (error) {
        return res.status(400).json({ error: "Invalid input", details: error.issues });
      }
      const slot = await storage.createAvailableSlot(data);
      res.status(201).json(slot);
    } catch (error) {
      console.error("Error creating available slot:", error);
      res.status(500).json({ error: "Failed to create available slot" });
    }
  });
  app2.delete("/api/available-slots/:id", authenticateToken, async (req, res) => {
    try {
      const success = await storage.deleteAvailableSlot(req.params.id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Available slot not found" });
      }
    } catch (error) {
      console.error("Error deleting available slot:", error);
      res.status(500).json({ error: "Failed to delete available slot" });
    }
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
import { fileURLToPath as fileURLToPath2 } from "url";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import dotenv4 from "dotenv";
dotenv4.config();
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
