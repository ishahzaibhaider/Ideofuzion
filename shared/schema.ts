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

export const UserModel = mongoose.model<IUser>('User', userSchema);

// MongoDB Job Schema
export interface IJob extends Document {
  _id: string;
  title: string;
  description?: string;
  requiredSkills?: string[];
  status: string;
  createdAt: Date;
}

const jobSchema = new Schema<IJob>({
  title: { type: String, required: true },
  description: { type: String },
  requiredSkills: [{ type: String }],
  status: { type: String, required: true, default: "Open" },
  createdAt: { type: Date, default: Date.now }
});

export const JobModel = mongoose.model<IJob>('Job', jobSchema);

// MongoDB Candidate Schema
export interface ICandidate extends Document {
  _id: string;
  name: string;
  email: string;
  cvUrl?: string;
  status: string;
  jobAppliedFor?: string;
  interviewDetails?: {
    dateTime?: Date;
    meetingLink?: string;
    notes?: string;
  };
  analysis?: {
    transcript?: string;
    summary?: string;
    technicalScore?: number;
    psychometricAnalysis?: string;
    finalRecommendation?: string;
  };
  appliedDate: Date;
  skills?: string[];
  experience?: string;
  previousRole?: string;
  education?: string;
  score?: number;
}

const candidateSchema = new Schema<ICandidate>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  cvUrl: { type: String },
  status: { type: String, required: true, default: "New" },
  jobAppliedFor: { type: String },
  interviewDetails: {
    dateTime: { type: Date },
    meetingLink: { type: String },
    notes: { type: String }
  },
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
  previousRole: { type: String },
  education: { type: String },
  score: { type: Number }
});

export const CandidateModel = mongoose.model<ICandidate>('Candidate', candidateSchema);

// Zod validation schemas
export const insertUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string()
});

export const insertJobSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  requiredSkills: z.array(z.string()).optional(),
  status: z.string().optional()
});

export const insertCandidateSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  cvUrl: z.string().optional(),
  status: z.string().optional(),
  jobAppliedFor: z.string().optional(),
  interviewDetails: z.object({
    dateTime: z.date().optional(),
    meetingLink: z.string().optional(),
    notes: z.string().optional()
  }).optional(),
  analysis: z.object({
    transcript: z.string().optional(),
    summary: z.string().optional(),
    technicalScore: z.number().optional(),
    psychometricAnalysis: z.string().optional(),
    finalRecommendation: z.string().optional()
  }).optional(),
  skills: z.array(z.string()).optional(),
  experience: z.string().optional(),
  previousRole: z.string().optional(),
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

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = {
  id: string;
  title: string;
  description?: string;
  requiredSkills?: string[];
  status: string;
  createdAt: Date;
};

export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = {
  id: string;
  name: string;
  email: string;
  cvUrl?: string;
  status: string;
  jobAppliedFor?: string;
  interviewDetails?: {
    dateTime?: Date;
    meetingLink?: string;
    notes?: string;
  };
  analysis?: {
    transcript?: string;
    summary?: string;
    technicalScore?: number;
    psychometricAnalysis?: string;
    finalRecommendation?: string;
  };
  appliedDate: Date;
  skills?: string[];
  experience?: string;
  previousRole?: string;
  education?: string;
  score?: number;
};
