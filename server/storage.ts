import { UserModel, JobCriteriaModel, CandidateModel, TranscriptModel, AvailableSlotModel, type User, type InsertUser, type JobCriteria, type InsertJobCriteria, type Candidate, type InsertCandidate, type Transcript, type InsertTranscript, type AvailableSlot, type InsertAvailableSlot } from "@shared/schema";
import { connectToDatabase } from "./db";
import dotenv from 'dotenv';
dotenv.config();

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

  // Job Criteria
  getJobCriteria(): Promise<JobCriteria[]>;
  getJobCriteriaById(id: string): Promise<JobCriteria | undefined>;
  createJobCriteria(jobCriteria: JobFormData): Promise<JobCriteria>;
  // ✨ Method to update a job
  updateJobCriteria(id: string, updates: Partial<InsertJobCriteria>): Promise<JobCriteria | undefined>;
  // ✨ Method to delete a job
  deleteJobCriteria(id: string): Promise<boolean>;

  // Candidates
  getCandidates(): Promise<Candidate[]>;
  getCandidate(id: string): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate | undefined>;
  deleteCandidate(id: string): Promise<boolean>;
  deleteCandidatesByStatus(status: string): Promise<void>;

  // Transcripts
  getTranscripts(): Promise<Transcript[]>;
  getLatestTranscript(): Promise<Transcript | undefined>;
  createTranscript(transcript: InsertTranscript): Promise<Transcript>;

  // Available Slots
  getAvailableSlots(): Promise<AvailableSlot[]>;
  createAvailableSlot(slot: InsertAvailableSlot): Promise<AvailableSlot>;
  deleteAvailableSlot(id: string): Promise<boolean>;
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
    };
  }

  private mongoDocToJobCriteria(doc: any): JobCriteria {
    return {
      id: doc._id.toString(),
      "Job ID": doc["Job ID"],
      "Job Title": doc["Job Title"],
      "Required Skills": doc["Required Skills"],
      "Optional Skills": doc["Optional Skills"] || [] // Add optional skills with fallback
    };
  }

  // In storage.ts

  private mongoDocToCandidate(doc: any): Candidate {
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
      "Resume Link": doc["Resume Link"], // <--- This is the line I added
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

  async getJobCriteria(): Promise<JobCriteria[]> {
    try {
      const jobCriteria = await JobCriteriaModel.find();
      return jobCriteria.map(criteria => this.mongoDocToJobCriteria(criteria));
    } catch (error) {
      console.error('Error getting job criteria:', error);
      return [];
    }
  }

  async getJobCriteriaById(id: string): Promise<JobCriteria | undefined> {
    try {
      const jobCriteria = await JobCriteriaModel.findById(id);
      return jobCriteria ? this.mongoDocToJobCriteria(jobCriteria) : undefined;
    } catch (error) {
      console.error('Error getting job criteria:', error);
      return undefined;
    }
  }

  async createJobCriteria(jobData: JobFormData): Promise<JobCriteria> {
    try {
      // Map the frontend field names to the database field names
      const jobToCreate: InsertJobCriteria = {
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
  async updateJobCriteria(id: string, updates: Partial<InsertJobCriteria>): Promise<JobCriteria | undefined> {
    try {
      const updatedJob = await JobCriteriaModel.findByIdAndUpdate(
        id,
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
  async deleteJobCriteria(id: string): Promise<boolean> {
    try {
      const result = await JobCriteriaModel.findByIdAndDelete(id);
      return result !== null; // Return true if deletion was successful
    } catch (error) {
      console.error('Error deleting job criteria:', error);
      return false;
    }
  }

  async getCandidates(): Promise<Candidate[]> {
    try {
      const candidates = await CandidateModel.find();
      return candidates.map(candidate => this.mongoDocToCandidate(candidate));
    } catch (error) {
      console.error('Error getting candidates:', error);
      return [];
    }
  }

  async getCandidate(id: string): Promise<Candidate | undefined> {
    try {
      const candidate = await CandidateModel.findById(id);
      return candidate ? this.mongoDocToCandidate(candidate) : undefined;
    } catch (error) {
      console.error('Error getting candidate:', error);
      return undefined;
    }
  }

  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    try {
      const candidate = await CandidateModel.create(insertCandidate);
      return this.mongoDocToCandidate(candidate);
    } catch (error) {
      console.error('Error creating candidate:', error);
      throw error;
    }
  }

  async updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate | undefined> {
    try {
      // Map frontend field names to database field names
      const mongoUpdates: any = {};
      
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

      console.log('Updating candidate with ID:', id);
      console.log('Frontend updates:', updates);
      console.log('Mapped MongoDB updates:', mongoUpdates);

      const candidate = await CandidateModel.findByIdAndUpdate(
        id,
        mongoUpdates,
        { new: true }
      );
      
      if (candidate) {
        console.log('Successfully updated candidate in MongoDB');
        return this.mongoDocToCandidate(candidate);
      } else {
        console.log('Candidate not found in MongoDB');
        return undefined;
      }
    } catch (error) {
      console.error('Error updating candidate:', error);
      return undefined;
    }
  }

  async deleteCandidate(id: string): Promise<boolean> {
    try {
      const result = await CandidateModel.findByIdAndDelete(id);
      return result !== null; // Return true if deletion was successful
    } catch (error) {
      console.error('Error deleting candidate:', error);
      return false;
    }
  }

  async deleteCandidatesByStatus(status: string): Promise<void> {
    try {
      await CandidateModel.deleteMany({ status });
    } catch (error) {
      console.error('Error deleting candidates by status:', error);
      throw error;
    }
  }

  // Helper method to convert MongoDB document to Transcript
  private mongoDocToTranscript(doc: any): Transcript {
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

  async getTranscripts(): Promise<Transcript[]> {
    try {
      const transcripts = await TranscriptModel.find();
      return transcripts.map(transcript => this.mongoDocToTranscript(transcript));
    } catch (error) {
      console.error('Error getting transcripts:', error);
      return [];
    }
  }

  async getLatestTranscript(): Promise<Transcript | undefined> {
    try {
      const transcript = await TranscriptModel.findOne().sort({ createdAt: -1 });
      return transcript ? this.mongoDocToTranscript(transcript) : undefined;
    } catch (error) {
      console.error('Error getting latest transcript:', error);
      return undefined;
    }
  }

  async createTranscript(insertTranscript: InsertTranscript): Promise<Transcript> {
    try {
      const transcript = await TranscriptModel.create(insertTranscript);
      return this.mongoDocToTranscript(transcript);
    } catch (error) {
      console.error('Error creating transcript:', error);
      throw error;
    }
  }

  // Helper method to convert MongoDB document to AvailableSlot
  private mongoDocToAvailableSlot(doc: any): AvailableSlot {
    return {
      id: doc._id.toString(),
      date: doc.date,
      startTime: doc.startTime,
      endTime: doc.endTime,
      isBooked: doc.isBooked,
      createdAt: doc.createdAt
    };
  }

  async getAvailableSlots(): Promise<AvailableSlot[]> {
    try {
      const slots = await AvailableSlotModel.find().sort({ date: 1, startTime: 1 });
      return slots.map(slot => this.mongoDocToAvailableSlot(slot));
    } catch (error) {
      console.error('Error getting available slots:', error);
      return [];
    }
  }

  async createAvailableSlot(insertSlot: InsertAvailableSlot): Promise<AvailableSlot> {
    try {
      const slot = await AvailableSlotModel.create(insertSlot);
      return this.mongoDocToAvailableSlot(slot);
    } catch (error) {
      console.error('Error creating available slot:', error);
      throw error;
    }
  }

  async deleteAvailableSlot(id: string): Promise<boolean> {
    try {
      const result = await AvailableSlotModel.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      console.error('Error deleting available slot:', error);
      return false;
    }
  }
}

export const storage = new MongoStorage();
