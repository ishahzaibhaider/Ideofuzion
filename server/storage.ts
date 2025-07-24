import { UserModel, JobModel, CandidateModel, type User, type InsertUser, type Job, type InsertJob, type Candidate, type InsertCandidate } from "@shared/schema";
import { connectToDatabase } from "./db";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Jobs
  getJobs(): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  
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
      const jobCount = await JobModel.countDocuments();
      if (jobCount === 0) {
        await JobModel.create({
          title: "Full-Stack Developer",
          description: "Position will be populated via N8N integration",
          requiredSkills: [],
          status: "Open"
        });
      }
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

  private mongoDocToJob(doc: any): Job {
    return {
      id: doc._id.toString(),
      title: doc.title,
      description: doc.description,
      requiredSkills: doc.requiredSkills,
      status: doc.status,
      createdAt: doc.createdAt
    };
  }

  private mongoDocToCandidate(doc: any): Candidate {
    return {
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      cvUrl: doc.cvUrl,
      status: doc.status,
      jobAppliedFor: doc.jobAppliedFor,
      interviewDetails: doc.interviewDetails,
      analysis: doc.analysis,
      appliedDate: doc.appliedDate,
      skills: doc.skills,
      experience: doc.experience,
      previousRole: doc.previousRole,
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

  async getJobs(): Promise<Job[]> {
    try {
      const jobs = await JobModel.find();
      return jobs.map(job => this.mongoDocToJob(job));
    } catch (error) {
      console.error('Error getting jobs:', error);
      return [];
    }
  }

  async getJob(id: string): Promise<Job | undefined> {
    try {
      const job = await JobModel.findById(id);
      return job ? this.mongoDocToJob(job) : undefined;
    } catch (error) {
      console.error('Error getting job:', error);
      return undefined;
    }
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    try {
      const job = await JobModel.create(insertJob);
      return this.mongoDocToJob(job);
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
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
