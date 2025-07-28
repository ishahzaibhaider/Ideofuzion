import { UserModel, JobCriteriaModel, CandidateModel, type User, type InsertUser, type JobCriteria, type InsertJobCriteria, type Candidate, type InsertCandidate } from "@shared/schema";
import { connectToDatabase } from "./db";

// Define the structure for the data coming from the frontend form
interface JobFormData {
  jobId: string;
  jobTitle: string;
  requiredSkills: string[];
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

  // Candidates
  getCandidates(): Promise<Candidate[]>;
  getCandidate(id: string): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate | undefined>;
  deleteCandidatesByStatus(status: string): Promise<void>;
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
      "Required Skills": doc["Required Skills"]
    };
  }

  private mongoDocToCandidate(doc: any): Candidate {
    return {
      id: doc._id.toString(),
      // Normalize field names to match frontend expectations
      name: doc["Candidate Name"],           // Map "Candidate Name" to "name"
      email: doc.Email,                     // Map "Email" to "email"  
      previousRole: doc["Job Title"],       // Map "Job Title" to "previousRole"
      interviewDate: doc["Interview Date"],
      interviewTime: doc["Interview Time"],
      calendarEventId: doc["Calendar Event ID"],
      status: doc.status || "New",
      cvUrl: doc.cvUrl,
      analysis: doc.analysis,
      appliedDate: doc.appliedDate,
      skills: doc.skills,
      experience: doc.experience,
      education: doc.education,
      score: doc.score
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
      // Map the frontend field names (jobId) to the database field names ("Job ID")
      const jobToCreate: InsertJobCriteria = {
        "Job ID": jobData.jobId,
        "Job Title": jobData.jobTitle,
        "Required Skills": jobData.requiredSkills
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
      const candidate = await CandidateModel.findByIdAndUpdate(
        id,
        updates,
        { new: true }
      );
      return candidate ? this.mongoDocToCandidate(candidate) : undefined;
    } catch (error) {
      console.error('Error updating candidate:', error);
      return undefined;
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
}

export const storage = new MongoStorage();
