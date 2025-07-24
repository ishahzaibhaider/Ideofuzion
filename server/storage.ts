import { users, jobs, candidates, type User, type InsertUser, type Job, type InsertJob, type Candidate, type InsertCandidate } from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Jobs
  getJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  
  // Candidates
  getCandidates(): Promise<Candidate[]>;
  getCandidate(id: number): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: number, updates: Partial<Candidate>): Promise<Candidate | undefined>;
  deleteCandidatesByStatus(status: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private jobs: Map<number, Job>;
  private candidates: Map<number, Candidate>;
  private currentUserId: number;
  private currentJobId: number;
  private currentCandidateId: number;

  constructor() {
    this.users = new Map();
    this.jobs = new Map();
    this.candidates = new Map();
    this.currentUserId = 1;
    this.currentJobId = 1;
    this.currentCandidateId = 1;

    // Initialize with minimal sample data for basic functionality
    this.initializeBasicData();
  }

  private initializeBasicData() {
    // Create a basic job for demo purposes - real data should come from N8N
    const job1: Job = {
      id: this.currentJobId++,
      title: "Full-Stack Developer",
      description: "Position will be populated via N8N integration",
      requiredSkills: [],
      status: "Open",
      createdAt: new Date()
    };
    this.jobs.set(job1.id, job1);
    
    // Real candidate data should come from N8N webhooks
    // This is just to show the pipeline structure
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = this.currentJobId++;
    const job: Job = { 
      ...insertJob, 
      id,
      createdAt: new Date(),
      description: insertJob.description || null,
      requiredSkills: insertJob.requiredSkills || null
    };
    this.jobs.set(id, job);
    return job;
  }

  async getCandidates(): Promise<Candidate[]> {
    return Array.from(this.candidates.values());
  }

  async getCandidate(id: number): Promise<Candidate | undefined> {
    return this.candidates.get(id);
  }

  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    const id = this.currentCandidateId++;
    const candidate: Candidate = { 
      ...insertCandidate, 
      id,
      appliedDate: new Date(),
      status: insertCandidate.status || 'New'
    };
    this.candidates.set(id, candidate);
    return candidate;
  }

  async updateCandidate(id: number, updates: Partial<Candidate>): Promise<Candidate | undefined> {
    const candidate = this.candidates.get(id);
    if (!candidate) return undefined;
    
    const updatedCandidate = { ...candidate, ...updates };
    this.candidates.set(id, updatedCandidate);
    return updatedCandidate;
  }

  async deleteCandidatesByStatus(status: string): Promise<void> {
    const toDelete = Array.from(this.candidates.entries())
      .filter(([_, candidate]) => candidate.status === status)
      .map(([id, _]) => id);
    
    toDelete.forEach(id => this.candidates.delete(id));
  }
}

export const storage = new MemStorage();
