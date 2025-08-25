import { UserModel, JobCriteriaModel, CandidateModel, TranscriptModel, UnavailableSlotModel, BusySlotModel, AnalysisModel, ExtendedMeetingModel, AccessInfoModel, UserWorkflowsModel, type User, type InsertUser, type JobCriteria, type InsertJobCriteria, type Candidate, type InsertCandidate, type Transcript, type InsertTranscript, type UnavailableSlot, type InsertUnavailableSlot, type BusySlot, type InsertBusySlot, type Analysis, type InsertAnalysis, type ExtendedMeeting, type InsertExtendedMeeting, type AccessInfo, type InsertAccessInfo, type UserWorkflows } from "../shared/schema.js";
import { connectToDatabase } from "./db.js";

// Define the structure for the data coming from the frontend form
interface JobFormData {
  jobId: string;
  jobTitle: string;
  requiredSkills: string[];
  optionalSkills: string[]; // Add optional skills support
}


export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // User Workflows - Track workflows created for each user
  getUserWorkflows(userId: string): Promise<UserWorkflows | undefined>;
  createUserWorkflows(userId: string): Promise<UserWorkflows>;
  addWorkflowToUser(userId: string, workflowName: string, n8nId: string): Promise<UserWorkflows | undefined>;
  updateWorkflowStatus(userId: string, workflowName: string, active: boolean): Promise<UserWorkflows | undefined>;

  // Job Criteria - USER ISOLATED
  getJobCriteria(userId: string): Promise<JobCriteria[]>;
  getJobCriteriaById(id: string, userId: string): Promise<JobCriteria | undefined>;
  createJobCriteria(jobCriteria: JobFormData, userId: string): Promise<JobCriteria>;
  updateJobCriteria(id: string, updates: Partial<InsertJobCriteria>, userId: string): Promise<JobCriteria | undefined>;
  deleteJobCriteria(id: string, userId: string): Promise<boolean>;

  // Candidates - USER ISOLATED
  getCandidates(userId: string): Promise<Candidate[]>;
  getCandidate(id: string, userId: string): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate, userId: string): Promise<Candidate>;
  updateCandidate(id: string, updates: Partial<Candidate>, userId: string): Promise<Candidate | undefined>;
  deleteCandidate(id: string, userId: string): Promise<boolean>;
  deleteCandidatesByStatus(status: string, userId: string): Promise<void>;

  // Transcripts - USER ISOLATED
  getTranscripts(userId: string): Promise<Transcript[]>;
  getTranscriptsByMeetId(meetId: string, userId: string): Promise<Transcript[]>;
  getLatestTranscript(userId: string): Promise<Transcript | undefined>;
  createTranscript(transcript: InsertTranscript, userId: string): Promise<Transcript>;

  // Unavailable Slots - USER ISOLATED
  getUnavailableSlots(userId: string): Promise<UnavailableSlot[]>;
  createUnavailableSlot(slot: InsertUnavailableSlot, userId: string): Promise<UnavailableSlot>;
  updateUnavailableSlot(id: string, updates: Partial<InsertUnavailableSlot>, userId: string): Promise<UnavailableSlot | undefined>;
  deleteUnavailableSlot(id: string, userId: string): Promise<boolean>;

  // Busy Slots - USER ISOLATED
  getBusySlots(userId: string): Promise<BusySlot[]>;
  createBusySlot(slot: InsertBusySlot, userId: string): Promise<BusySlot>;
  updateBusySlot(id: string, updates: Partial<InsertBusySlot>, userId: string): Promise<BusySlot | undefined>;
  deleteBusySlot(id: string, userId: string): Promise<boolean>;

  // Analysis - USER ISOLATED
  getAnalysisByMeetId(meetId: string, userId: string): Promise<Analysis | undefined>;
  createAnalysis(analysis: InsertAnalysis, userId: string): Promise<Analysis>;

  // Extended Meetings - USER ISOLATED
  getExtendedMeetings(userId: string): Promise<ExtendedMeeting[]>;
  getExtendedMeetingByCalendarEventId(calendarEventId: string, userId: string): Promise<ExtendedMeeting | undefined>;
  createExtendedMeeting(extendedMeeting: InsertExtendedMeeting, userId: string): Promise<ExtendedMeeting>;

  // Access Info - USER ISOLATED
  getAccessInfo(userId: string): Promise<AccessInfo | undefined>;
  getAccessInfoByEmail(email: string): Promise<AccessInfo | undefined>;
  createAccessInfo(accessInfo: InsertAccessInfo): Promise<AccessInfo>;
  updateAccessInfo(userId: string, updates: Partial<InsertAccessInfo>): Promise<AccessInfo | undefined>;
  deleteAccessInfo(userId: string): Promise<boolean>;
}

export class MongoStorage implements IStorage {
  constructor() {
    // Ensure database connection
    connectToDatabase();

    // Initialize with basic data if needed
    this.initializeBasicData();
  }

  private async initializeBasicData() {
    try {
      // No initialization needed - using existing data from ideofuzion database
      console.log('Connected to existing ideofuzion database with candidates and jobCriteria collections');
    } catch (error) {
      console.log('Unable to initialize basic data, database may not be connected yet');
    }
  }

  // Helper function to convert MongoDB document to our type format
  private mongoDocToUser(doc: any): User {
    return {
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      password: doc.password,
      createdAt: doc.createdAt
    } as User;
  }

  private mongoDocToJobCriteria(doc: any): JobCriteria {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      "Job ID": doc["Job ID"],
      "Job Title": doc["Job Title"],
      "Required Skills": doc["Required Skills"],
      "Optional Skills": doc["Optional Skills"] || [] // Add optional skills with fallback
    } as JobCriteria;
  }

  // In storage.ts

  private mongoDocToCandidate(doc: any): Candidate {
    // Helper function to format dates for frontend
    const formatInterviewDateTime = (isoString?: string) => {
      if (!isoString) return { date: 'N/A', time: 'N/A' };
      
      try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return { date: 'N/A', time: 'N/A' };
        
        // Format date as YYYY-MM-DD for Pakistan timezone
        const dateStr = date.toLocaleDateString('en-CA', {
          timeZone: 'Asia/Karachi',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        // Format time as HH:MM AM/PM for Pakistan timezone
        const timeStr = date.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Karachi',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        
        return { date: dateStr, time: timeStr };
      } catch (e) {
        console.error('Error formatting interview date:', e);
        return { date: 'N/A', time: 'N/A' };
      }
    };

    const interviewDateTime = formatInterviewDateTime(doc["Interview Start"]);
    
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      // Database field names (required)
      "Candidate Name": doc["Candidate Name"],
      Email: doc.Email,
      "Job Title": doc["Job Title"],
      "Interview Start": doc["Interview Start"],
      "Interview End": doc["Interview End"],
      "Calendar Event ID": doc["Calendar Event ID"],
      "Calender Event Link": doc["Calender Event Link"],
      "Google Meet Id": doc["Google Meet Id"],
      "Resume Link": doc["Resume Link"],
      status: doc.status || "New",
      cvUrl: doc.cvUrl,
      analysis: doc.analysis,
      appliedDate: doc.appliedDate,
      skills: doc.skills,
      experience: doc.experience,
      education: doc.education,
      score: doc.score
    } as Candidate;
  }

  async getUser(id: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findById(id);
      return user ? this.mongoDocToUser(user) : undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ email });
      return user ? this.mongoDocToUser(user) : undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const user = await UserModel.create(insertUser);
      return this.mongoDocToUser(user);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserWorkflows(userId: string): Promise<UserWorkflows | undefined> {
    try {
      const workflows = await UserWorkflowsModel.findOne({ userId });
      return workflows ? {
        id: workflows._id.toString(),
        userId: workflows.userId,
        workflows: workflows.workflows,
        createdAt: workflows.createdAt,
        updatedAt: workflows.updatedAt
      } as UserWorkflows : undefined;
    } catch (error) {
      console.error('Error getting user workflows:', error);
      return undefined;
    }
  }

  async createUserWorkflows(userId: string): Promise<UserWorkflows> {
    try {
      const workflows = await UserWorkflowsModel.create({ userId });
      return {
        id: workflows._id.toString(),
        userId: workflows.userId,
        workflows: workflows.workflows,
        createdAt: workflows.createdAt,
        updatedAt: workflows.updatedAt
      } as UserWorkflows;
    } catch (error) {
      console.error('Error creating user workflows:', error);
      throw error;
    }
  }

  async addWorkflowToUser(userId: string, workflowName: string, n8nId: string): Promise<UserWorkflows | undefined> {
    try {
      const workflows = await UserWorkflowsModel.findOneAndUpdate(
        { userId },
        { $push: { workflows: { name: workflowName, n8nId, active: true } } },
        { new: true }
      );
      return workflows ? {
        id: workflows._id.toString(),
        userId: workflows.userId,
        workflows: workflows.workflows,
        createdAt: workflows.createdAt,
        updatedAt: workflows.updatedAt
      } as UserWorkflows : undefined;
    } catch (error) {
      console.error('Error adding workflow to user:', error);
      return undefined;
    }
  }

  async updateWorkflowStatus(userId: string, workflowName: string, active: boolean): Promise<UserWorkflows | undefined> {
    try {
      const workflows = await UserWorkflowsModel.findOneAndUpdate(
        { userId, "workflows.name": workflowName },
        { $set: { "workflows.$.active": active } },
        { new: true }
      );
      return workflows ? {
        id: workflows._id.toString(),
        userId: workflows.userId,
        workflows: workflows.workflows,
        createdAt: workflows.createdAt,
        updatedAt: workflows.updatedAt
      } as UserWorkflows : undefined;
    } catch (error) {
      console.error('Error updating workflow status:', error);
      return undefined;
    }
  }

  async getJobCriteria(userId: string): Promise<JobCriteria[]> {
    try {
      const jobCriteria = await JobCriteriaModel.find({ userId });
      return jobCriteria.map(criteria => this.mongoDocToJobCriteria(criteria));
    } catch (error) {
      console.error('Error getting job criteria:', error);
      return [];
    }
  }

  async getJobCriteriaById(id: string, userId: string): Promise<JobCriteria | undefined> {
    try {
      const jobCriteria = await JobCriteriaModel.findOne({ _id: id, userId });
      return jobCriteria ? this.mongoDocToJobCriteria(jobCriteria) : undefined;
    } catch (error) {
      console.error('Error getting job criteria:', error);
      return undefined;
    }
  }

  async createJobCriteria(jobData: JobFormData, userId: string): Promise<JobCriteria> {
    try {
      // Map the frontend field names to the database field names
      const jobToCreate: any = {
        userId,
        "Job ID": jobData.jobId,
        "Job Title": jobData.jobTitle,
        "Required Skills": jobData.requiredSkills,
        "Optional Skills": jobData.optionalSkills || [] // Add optional skills support
      };
      const jobCriteria = await JobCriteriaModel.create(jobToCreate);
      return this.mongoDocToJobCriteria(jobCriteria);
    } catch (error) {
      console.error('Error creating job criteria:', error);
      throw error;
    }
  }

  // ✨ Implementation for updating a job
  async updateJobCriteria(id: string, updates: Partial<InsertJobCriteria>, userId: string): Promise<JobCriteria | undefined> {
    try {
      const updatedJob = await JobCriteriaModel.findOneAndUpdate(
        { _id: id, userId },
        updates,
        { new: true } // Return the updated document
      );
      return updatedJob ? this.mongoDocToJobCriteria(updatedJob) : undefined;
    } catch (error) {
      console.error('Error updating job criteria:', error);
      return undefined;
    }
  }

  // ✨ Implementation for deleting a job
  async deleteJobCriteria(id: string, userId: string): Promise<boolean> {
    try {
      const result = await JobCriteriaModel.findOneAndDelete({ _id: id, userId });
      return result !== null; // Return true if deletion was successful
    } catch (error) {
      console.error('Error deleting job criteria:', error);
      return false;
    }
  }

  async getCandidates(userId: string): Promise<Candidate[]> {
    try {
      const candidates = await CandidateModel.find({ userId });
      return candidates.map(candidate => this.mongoDocToCandidate(candidate));
    } catch (error) {
      console.error('Error getting candidates:', error);
      return [];
    }
  }

  async getCandidate(id: string, userId: string): Promise<Candidate | undefined> {
    try {
      const candidate = await CandidateModel.findOne({ _id: id, userId });
      return candidate ? this.mongoDocToCandidate(candidate) : undefined;
    } catch (error) {
      console.error('Error getting candidate:', error);
      return undefined;
    }
  }

  async createCandidate(insertCandidate: InsertCandidate, userId: string): Promise<Candidate> {
    try {
      const candidateWithUser = { ...insertCandidate, userId };
      const candidate = await CandidateModel.create(candidateWithUser);
      return this.mongoDocToCandidate(candidate);
    } catch (error) {
      console.error('Error creating candidate:', error);
      throw error;
    }
  }

  async updateCandidate(id: string, updates: Partial<Candidate>, userId: string): Promise<Candidate | undefined> {
    try {
      // Map frontend field names to database field names
      const mongoUpdates: any = {};
      
      if (updates["Candidate Name"]) mongoUpdates["Candidate Name"] = updates["Candidate Name"];
      if (updates.Email) mongoUpdates.Email = updates.Email;
      if (updates["Job Title"]) mongoUpdates["Job Title"] = updates["Job Title"];
      if (updates["Interview Start"]) mongoUpdates["Interview Start"] = updates["Interview Start"];
      if (updates["Interview End"]) mongoUpdates["Interview End"] = updates["Interview End"];
      if (updates.status) mongoUpdates.status = updates.status;
      if (updates.cvUrl) mongoUpdates.cvUrl = updates.cvUrl;
      if (updates.analysis) mongoUpdates.analysis = updates.analysis;
      if (updates.skills) mongoUpdates.skills = updates.skills;
      if (updates.experience) mongoUpdates.experience = updates.experience;
      if (updates.education) mongoUpdates.education = updates.education;
      if (updates.score) mongoUpdates.score = updates.score;

      console.log('Updating candidate with ID:', id, 'for user:', userId);
      console.log('Frontend updates:', updates);
      console.log('Mapped MongoDB updates:', mongoUpdates);

      const candidate = await CandidateModel.findOneAndUpdate(
        { _id: id, userId },
        mongoUpdates,
        { new: true }
      );
      
      if (candidate) {
        console.log('Successfully updated candidate in MongoDB');
        return this.mongoDocToCandidate(candidate);
      } else {
        console.log('Candidate not found in MongoDB or access denied');
        return undefined;
      }
    } catch (error) {
      console.error('Error updating candidate:', error);
      return undefined;
    }
  }

  async deleteCandidate(id: string, userId: string): Promise<boolean> {
    try {
      const result = await CandidateModel.findOneAndDelete({ _id: id, userId });
      return result !== null; // Return true if deletion was successful
    } catch (error) {
      console.error('Error deleting candidate:', error);
      return false;
    }
  }

  async deleteCandidatesByStatus(status: string, userId: string): Promise<void> {
    try {
      await CandidateModel.deleteMany({ status, userId });
    } catch (error) {
      console.error('Error deleting candidates by status:', error);
      throw error;
    }
  }

  // Helper method to convert MongoDB document to Transcript
  private mongoDocToTranscript(doc: any): Transcript {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      Speaker1: doc.Speaker1,
      Speaker2: doc.Speaker2,
      Speaker3: doc.Speaker3,
      Meet_id: doc.Meet_id,
      Suggested_Questions: doc.Suggested_Questions || [],
      Summary: doc.Summary,
      createdAt: doc.createdAt
    } as Transcript;
  }

  async getTranscripts(userId: string): Promise<Transcript[]> {
    try {
      const transcripts = await TranscriptModel.find({ userId });
      return transcripts.map(transcript => this.mongoDocToTranscript(transcript));
    } catch (error) {
      console.error('Error getting transcripts:', error);
      return [];
    }
  }

  async getTranscriptsByMeetId(meetId: string, userId: string): Promise<Transcript[]> {
    try {
      console.log(`Searching for transcript with Meet_id: ${meetId} for user: ${userId}`);
      
      // Search by the Meet_id field and userId
      const query = { Meet_id: meetId, userId };
      
      const transcripts = await TranscriptModel.find(query).sort({ createdAt: -1 });
      console.log(`Found ${transcripts.length} transcripts for Meet_id: ${meetId}`);
      
      if (transcripts.length === 0) {
        console.log(`No transcripts found for Meet_id: ${meetId}`);
        return [];
      }
      
      return transcripts.map(transcript => this.mongoDocToTranscript(transcript));
    } catch (error) {
      console.error('Error getting transcripts by meet ID:', error);
      return [];
    }
  }

  async getLatestTranscript(userId: string): Promise<Transcript | undefined> {
    try {
      console.log('Getting latest transcript from MongoDB for user:', userId);
      const transcript = await TranscriptModel.findOne({ userId }).sort({ createdAt: -1 });
      console.log('Latest transcript found:', transcript ? { id: transcript._id, hasData: !!transcript.Speaker1 } : 'None');
      return transcript ? this.mongoDocToTranscript(transcript) : undefined;
    } catch (error) {
      console.error('Error getting latest transcript:', error);
      return undefined;
    }
  }

  async createTranscript(insertTranscript: InsertTranscript, userId: string): Promise<Transcript> {
    try {
      const transcriptWithUser = { ...insertTranscript, userId };
      const transcript = await TranscriptModel.create(transcriptWithUser);
      return this.mongoDocToTranscript(transcript);
    } catch (error) {
      console.error('Error creating transcript:', error);
      throw error;
    }
  }

  // Helper method to convert MongoDB document to UnavailableSlot
  private mongoDocToUnavailableSlot(doc: any): UnavailableSlot {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      date: doc.date,
      startTime: doc.startTime,
      endTime: doc.endTime,
      reason: doc.reason || "Unavailable",
      createdAt: doc.createdAt
    } as UnavailableSlot;
  }

  async getUnavailableSlots(userId: string): Promise<UnavailableSlot[]> {
    try {
      const slots = await UnavailableSlotModel.find({ userId }).sort({ date: 1, startTime: 1 });
      return slots.map(slot => this.mongoDocToUnavailableSlot(slot));
    } catch (error) {
      console.error('Error getting unavailable slots:', error);
      return [];
    }
  }

  async createUnavailableSlot(insertSlot: InsertUnavailableSlot, userId: string): Promise<UnavailableSlot> {
    try {
      const slotWithUser = { ...insertSlot, userId };
      const slot = await UnavailableSlotModel.create(slotWithUser);
      return this.mongoDocToUnavailableSlot(slot);
    } catch (error) {
      console.error('Error creating unavailable slot:', error);
      throw error;
    }
  }

  async updateUnavailableSlot(id: string, updates: Partial<InsertUnavailableSlot>, userId: string): Promise<UnavailableSlot | undefined> {
    try {
      const slot = await UnavailableSlotModel.findOneAndUpdate({ _id: id, userId }, updates, { new: true });
      return slot ? this.mongoDocToUnavailableSlot(slot) : undefined;
    } catch (error) {
      console.error('Error updating unavailable slot:', error);
      return undefined;
    }
  }

  async deleteUnavailableSlot(id: string, userId: string): Promise<boolean> {
    try {
      const result = await UnavailableSlotModel.findOneAndDelete({ _id: id, userId });
      return result !== null;
    } catch (error) {
      console.error('Error deleting unavailable slot:', error);
      return false;
    }
  }

  // Helper method to convert MongoDB document to BusySlot
  private mongoDocToBusySlot(doc: any): BusySlot {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      date: doc.date,
      startTime: doc.startTime,
      endTime: doc.endTime,
      reason: doc.reason || "Busy",
      createdAt: doc.createdAt
    } as BusySlot;
  }

  async getBusySlots(userId: string): Promise<BusySlot[]> {
    try {
      const slots = await BusySlotModel.find({ userId }).sort({ date: 1, startTime: 1 });
      return slots.map(slot => this.mongoDocToBusySlot(slot));
    } catch (error) {
      console.error('Error getting busy slots:', error);
      return [];
    }
  }

  async createBusySlot(insertSlot: InsertBusySlot, userId: string): Promise<BusySlot> {
    try {
      const slotWithUser = { ...insertSlot, userId };
      const slot = await BusySlotModel.create(slotWithUser);
      return this.mongoDocToBusySlot(slot);
    } catch (error) {
      console.error('Error creating busy slot:', error);
      throw error;
    }
  }

  async updateBusySlot(id: string, updates: Partial<InsertBusySlot>, userId: string): Promise<BusySlot | undefined> {
    try {
      const slot = await BusySlotModel.findOneAndUpdate({ _id: id, userId }, updates, { new: true });
      return slot ? this.mongoDocToBusySlot(slot) : undefined;
    } catch (error) {
      console.error('Error updating busy slot:', error);
      return undefined;
    }
  }

  async deleteBusySlot(id: string, userId: string): Promise<boolean> {
    try {
      const result = await BusySlotModel.findOneAndDelete({ _id: id, userId });
      return result !== null;
    } catch (error) {
      console.error('Error deleting busy slot:', error);
      return false;
    }
  }

  // Helper function to convert MongoDB document to our Analysis type format
  private mongoDocToAnalysis(doc: any): Analysis {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      "Psychometric Analysis": doc["Psychometric Analysis"],
      "Technical Analysis": doc["Technical Analysis"],
      "Behavioural Analysis": doc["Behavioural Analysis"],
      "Recommended for Hire": doc["Recommended for Hire"],
      Meet_id: doc.Meet_id
    } as Analysis;
  }

  async getAnalysisByMeetId(meetId: string, userId: string): Promise<Analysis | undefined> {
    try {
      console.log(`Searching for analysis with Meet_id: ${meetId} for user: ${userId}`);
      const analysis = await AnalysisModel.findOne({ Meet_id: meetId, userId });
      if (!analysis) {
        console.log(`No analysis found for Meet_id: ${meetId}`);
        return undefined;
      }
      console.log(`Found analysis for Meet_id: ${meetId}`);
      return this.mongoDocToAnalysis(analysis);
    } catch (error) {
      console.error('Error getting analysis by meet ID:', error);
      return undefined;
    }
  }

  async createAnalysis(insertAnalysis: InsertAnalysis, userId: string): Promise<Analysis> {
    try {
      const analysisWithUser = { ...insertAnalysis, userId };
      const analysis = await AnalysisModel.create(analysisWithUser);
      return this.mongoDocToAnalysis(analysis);
    } catch (error) {
      console.error('Error creating analysis:', error);
      throw error;
    }
  }

  // Helper function to convert MongoDB document to our ExtendedMeeting type format
  private mongoDocToExtendedMeeting(doc: any): ExtendedMeeting {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      calendarEventId: doc.calendarEventId,
      newEndTime: doc.newEndTime,
      status: doc.status,
      reason: doc.reason,
      createdAt: doc.createdAt
    } as ExtendedMeeting;
  }

  async getExtendedMeetings(userId: string): Promise<ExtendedMeeting[]> {
    try {
      const docs = await ExtendedMeetingModel.find({ userId }).sort({ createdAt: -1 });
      return docs.map(doc => this.mongoDocToExtendedMeeting(doc));
    } catch (error) {
      console.error('Error getting extended meetings:', error);
      return [];
    }
  }

  async getExtendedMeetingByCalendarEventId(calendarEventId: string, userId: string): Promise<ExtendedMeeting | undefined> {
    try {
      const doc = await ExtendedMeetingModel.findOne({ calendarEventId, userId });
      return doc ? this.mongoDocToExtendedMeeting(doc) : undefined;
    } catch (error) {
      console.error('Error getting extended meeting by calendar event ID:', error);
      return undefined;
    }
  }

  async createExtendedMeeting(extendedMeeting: InsertExtendedMeeting, userId: string): Promise<ExtendedMeeting> {
    try {
      const meetingWithUser = { ...extendedMeeting, userId };
      const doc = await ExtendedMeetingModel.create(meetingWithUser);
      return this.mongoDocToExtendedMeeting(doc);
    } catch (error) {
      console.error('Error creating extended meeting:', error);
      throw error;
    }
  }

  // Helper function to convert MongoDB document to our AccessInfo type format
  private mongoDocToAccessInfo(doc: any): AccessInfo {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      email: doc.email,
      accessToken: doc.accessToken,
      refreshToken: doc.refreshToken,
      clientId: doc.clientId,
      clientSecret: doc.clientSecret,
      scope: doc.scope,
      tokenType: doc.tokenType,
      expiresAt: doc.expiresAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    } as AccessInfo;
  }

  async getAccessInfo(userId: string): Promise<AccessInfo | undefined> {
    try {
      const doc = await AccessInfoModel.findOne({ userId });
      return doc ? this.mongoDocToAccessInfo(doc) : undefined;
    } catch (error) {
      console.error('Error getting access info:', error);
      return undefined;
    }
  }

  async getAccessInfoByEmail(email: string): Promise<AccessInfo | undefined> {
    try {
      const doc = await AccessInfoModel.findOne({ email });
      return doc ? this.mongoDocToAccessInfo(doc) : undefined;
    } catch (error) {
      console.error('Error getting access info by email:', error);
      return undefined;
    }
  }

  async createAccessInfo(accessInfo: InsertAccessInfo): Promise<AccessInfo> {
    try {
      const doc = await AccessInfoModel.create(accessInfo);
      return this.mongoDocToAccessInfo(doc);
    } catch (error) {
      console.error('Error creating access info:', error);
      throw error;
    }
  }

  async updateAccessInfo(userId: string, updates: Partial<InsertAccessInfo>): Promise<AccessInfo | undefined> {
    try {
      const doc = await AccessInfoModel.findOneAndUpdate(
        { userId },
        { ...updates, updatedAt: new Date() },
        { new: true }
      );
      return doc ? this.mongoDocToAccessInfo(doc) : undefined;
    } catch (error) {
      console.error('Error updating access info:', error);
      return undefined;
    }
  }

  async deleteAccessInfo(userId: string): Promise<boolean> {
    try {
      const result = await AccessInfoModel.findOneAndDelete({ userId });
      return result !== null;
    } catch (error) {
      console.error('Error deleting access info:', error);
      return false;
    }
  }
}

export const storage = new MongoStorage();
