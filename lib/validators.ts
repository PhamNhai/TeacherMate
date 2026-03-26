import { z } from "zod";

export const createExamPayloadSchema = z.object({
  grade: z.string().trim().min(1).max(10),
  subject: z.string().trim().min(1).max(100),
  topic: z.string().trim().min(2).max(200),
  examTitle: z.string().trim().min(3).max(200),
  questionCount: z.number().int().min(5).max(100),
  difficulty: z.string().trim().min(1).max(50),
  bloomLevel: z.string().trim().min(1).max(50),
  durationMinutes: z.number().int().min(5).max(180),
  specialRequirements: z.string().max(2000).default("")
});

export const submitResultInputSchema = z.object({
  examId: z.number().int().positive(),
  studentName: z.string().trim().min(2).max(120),
  answers: z.record(z.string(), z.number().int().min(0).max(3))
});

