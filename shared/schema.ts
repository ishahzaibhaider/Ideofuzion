import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  requiredSkills: text("required_skills").array(),
  status: text("status").notNull().default("Open"),
  createdAt: timestamp("created_at").defaultNow()
});

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  cvUrl: text("cv_url"),
  status: text("status").notNull().default("New"),
  jobAppliedFor: integer("job_applied_for").references(() => jobs.id),
  interviewDetails: jsonb("interview_details").$type<{
    dateTime?: Date;
    meetingLink?: string;
    notes?: string;
  }>(),
  analysis: jsonb("analysis").$type<{
    transcript?: string;
    summary?: string;
    technicalScore?: number;
    psychometricAnalysis?: string;
    finalRecommendation?: string;
  }>(),
  appliedDate: timestamp("applied_date").defaultNow(),
  skills: text("skills").array(),
  experience: text("experience"),
  previousRole: text("previous_role"),
  education: text("education"),
  score: integer("score")
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  appliedDate: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;
