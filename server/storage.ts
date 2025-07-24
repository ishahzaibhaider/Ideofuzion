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

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample jobs
    const job1: Job = {
      id: this.currentJobId++,
      title: "Senior Full-Stack Developer",
      description: "Looking for an experienced developer with React and Node.js expertise",
      requiredSkills: ["React", "Node.js", "TypeScript", "AWS"],
      status: "Open",
      createdAt: new Date()
    };
    this.jobs.set(job1.id, job1);

    const job2: Job = {
      id: this.currentJobId++,
      title: "UX Designer",
      description: "Creative UX designer for our product team",
      requiredSkills: ["Figma", "Sketch", "Prototyping", "User Research"],
      status: "Open",
      createdAt: new Date()
    };
    this.jobs.set(job2.id, job2);

    // Sample candidates
    const candidates: Omit<Candidate, 'id'>[] = [
      {
        name: "Sarah Johnson",
        email: "sarah.johnson@email.com",
        status: "Interview Scheduled",
        jobAppliedFor: job1.id,
        skills: ["React", "Node.js", "TypeScript", "AWS"],
        experience: "8 years experience",
        previousRole: "Lead Developer at TechCorp",
        education: "B.S. Computer Science, Stanford University",
        score: 85,
        appliedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        interviewDetails: {
          dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
          meetingLink: "https://meet.example.com/interview-1",
          notes: ""
        },
        cvUrl: null,
        analysis: null
      },
      {
        name: "Michael Chen",
        email: "michael.chen@email.com",
        status: "Analysis Complete",
        jobAppliedFor: job2.id,
        skills: ["Strategy", "Analytics", "Leadership"],
        experience: "6 years experience",
        previousRole: "Product Manager at StartupXYZ",
        education: "MBA, Harvard Business School",
        score: 78,
        appliedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        interviewDetails: null,
        cvUrl: null,
        analysis: {
          technicalScore: 7.8,
          summary: "Strong product management background with good technical understanding",
          finalRecommendation: "Recommend for hire"
        }
      },
      {
        name: "Emma Rodriguez",
        email: "emma.rodriguez@email.com",
        status: "Hired",
        jobAppliedFor: job2.id,
        skills: ["Figma", "Sketch", "Prototyping", "User Research"],
        experience: "5 years experience",
        previousRole: "Senior UX Designer at DesignCo",
        education: "B.A. Design, RISD",
        score: 92,
        appliedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        interviewDetails: null,
        cvUrl: null,
        analysis: {
          technicalScore: 9.2,
          summary: "Exceptional design skills and strong portfolio",
          finalRecommendation: "Strong hire"
        }
      },
      {
        name: "Alex Thompson",
        email: "alex.thompson@email.com",
        status: "New",
        jobAppliedFor: job1.id,
        skills: ["React", "Node.js", "Python"],
        experience: "5 years experience",
        previousRole: "Frontend Developer at WebCorp",
        education: "B.S. Computer Science, MIT",
        score: null,
        appliedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        interviewDetails: null,
        cvUrl: null,
        analysis: null
      },
      {
        name: "Jessica Martinez",
        email: "jessica.martinez@email.com",
        status: "New",
        jobAppliedFor: job2.id,
        skills: ["Figma", "Sketch", "Prototyping"],
        experience: "4 years experience",
        previousRole: "UX Designer at CreativeCo",
        education: "B.A. Digital Design, Art Center",
        score: null,
        appliedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        interviewDetails: null,
        cvUrl: null,
        analysis: null
      }
    ];

    candidates.forEach(candidate => {
      const newCandidate: Candidate = { ...candidate, id: this.currentCandidateId++ };
      this.candidates.set(newCandidate.id, newCandidate);
    });
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
