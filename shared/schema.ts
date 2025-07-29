import mongoose, { Schema, Document } from 'mongoose';
import { z } from "zod";

// MongoDB User Schema
export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const UserModel = mongoose.model<IUser>('User', userSchema, 'users');

// MongoDB Job Criteria Schema (matching your existing data structure)
export interface IJobCriteria extends Document {
  _id: string;
  "Job ID": string;
  "Job Title": string;
  "Required Skills": string[];
  "Optional Skills"?: string[];
}

const jobCriteriaSchema = new Schema<IJobCriteria>({
"Job ID": { type: String, required: true },
"Job Title": { type: String, required: true },
"Required Skills": [{ type: String, required: true }],
"Optional Skills": [{ type: String }] // Add this line
}, { collection: 'jobCriteria' });

export const JobCriteriaModel = mongoose.model<IJobCriteria>('JobCriteria', jobCriteriaSchema);

// MongoDB Candidate Schema (matching your existing data structure)
export interface ICandidate extends Document {
  _id: string;
  "Candidate Name": string;
  Email: string;
  "Job Title": string;
  "Interview Date": string;
  "Interview Time": string;
  "Calendar Event ID": string;
  "Calender Event Link"?: string;
  "Google Meet Id"?: string;
  "Resume Link"?: string;
  status?: string;
  cvUrl?: string;
  analysis?: {
    transcript?: string;
    summary?: string;
    technicalScore?: number;
    psychometricAnalysis?: string;
    finalRecommendation?: string;
  };
  appliedDate?: Date;
  skills?: string[];
  experience?: string;
  education?: string;
  score?: number;
}

const candidateSchema = new Schema<ICandidate>({
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
}, { collection: 'candidates' });

export const CandidateModel = mongoose.model<ICandidate>('Candidate', candidateSchema);

// Zod validation schemas
export const insertUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string()
});

export const insertJobCriteriaSchema = z.object({
  "Job ID": z.string(),
  "Job Title": z.string(),
  "Required Skills": z.array(z.string())
});

export const insertCandidateSchema = z.object({
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

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
};

export type InsertJobCriteria = z.infer<typeof insertJobCriteriaSchema>;
export type JobCriteria = {
  id: string;
  "Job ID": string;
  "Job Title": string;
  "Required Skills": string[];
};

export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = {
  id: string;
  "Candidate Name": string;
  Email: string;
  "Job Title": string;
  "Interview Date": string;
  "Interview Time": string;
  "Calendar Event ID": string;
  "Calender Event Link"?: string;
  "Google Meet Id"?: string;
  status?: string;
  cvUrl?: string;
  analysis?: {
    transcript?: string;
    summary?: string;
    technicalScore?: number;
    psychometricAnalysis?: string;
    finalRecommendation?: string;
  };
  appliedDate?: Date;
  skills?: string[];
  experience?: string;
  education?: string;
  score?: number;
  // Frontend-friendly mapped fields
  name: string;
  email: string;
  previousRole: string;
  interviewDate: string;
  interviewTime: string;
  calendarEventId: string;
  calenderEventLink?: string;
  googleMeetId?: string;
};
