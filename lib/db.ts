import { neon } from "@neondatabase/serverless";
import type { Exam, ExamQuestion, ExamResultSummary, StoredResult } from "./types";

type ExamRow = {
  id: number;
  title: string;
  grade: string;
  subject: string;
  topic: string;
  difficulty: string;
  bloom_level: string;
  duration_minutes: number;
  requirements: string;
  question_count: number;
  questions_json: string;
  created_at: string;
};

type ResultRow = {
  id: number;
  exam_id: number;
  student_name: string;
  score: number;
  total: number;
  percentage: number;
  ai_comment: string;
  created_at: string;
};

const derivedPostgresUrl =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL ||
  process.env.DATABASE_URL_UNPOOLED;

const dbConfigured = Boolean(derivedPostgresUrl);
const sql = dbConfigured ? neon(derivedPostgresUrl as string) : null;

const memoryStore = {
  examSeq: 0,
  resultSeq: 0,
  exams: new Map<number, Exam>(),
  results: new Map<number, StoredResult>()
};

export function isDatabaseConfigured(): boolean {
  return dbConfigured;
}

async function ensureTables(): Promise<void> {
  if (!dbConfigured || !sql) {
    return;
  }

  await sql`
    CREATE TABLE IF NOT EXISTS exams (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      grade TEXT NOT NULL,
      subject TEXT NOT NULL,
      topic TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      bloom_level TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      requirements TEXT NOT NULL DEFAULT '',
      question_count INTEGER NOT NULL,
      questions_json JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS results (
      id SERIAL PRIMARY KEY,
      exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
      student_name TEXT NOT NULL,
      score DOUBLE PRECISION NOT NULL,
      total INTEGER NOT NULL,
      percentage DOUBLE PRECISION NOT NULL,
      ai_comment TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
}

export async function insertExam(
  exam: Omit<Exam, "id" | "createdAt">
): Promise<{ id: number }> {
  if (!dbConfigured || !sql) {
    memoryStore.examSeq += 1;
    const id = memoryStore.examSeq;
    memoryStore.exams.set(id, {
      ...exam,
      id,
      createdAt: new Date().toISOString()
    });
    return { id };
  }

  await ensureTables();
  const questionsJson = JSON.stringify(exam.questions);
  const rows = await sql`
    INSERT INTO exams (
      title, grade, subject, topic, difficulty, bloom_level, duration_minutes,
      requirements, question_count, questions_json
    )
    VALUES (
      ${exam.title}, ${exam.grade}, ${exam.subject}, ${exam.topic}, ${exam.difficulty},
      ${exam.bloomLevel}, ${exam.durationMinutes}, ${exam.requirements},
      ${exam.questionCount}, ${questionsJson}::jsonb
    )
    RETURNING id
  `;

  return { id: Number((rows[0] as { id: number }).id) };
}

export async function getExamById(id: number): Promise<Exam | null> {
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }

  if (!dbConfigured || !sql) {
    return memoryStore.exams.get(id) ?? null;
  }

  await ensureTables();
  const rows = (await sql`
    SELECT
      id, title, grade, subject, topic, difficulty, bloom_level, duration_minutes,
      requirements, question_count, questions_json, created_at
    FROM exams
    WHERE id = ${id}
    LIMIT 1
  `) as unknown as ExamRow[];

  if (!rows.length) {
    return null;
  }

  const row = rows[0]!;
  return {
    id: row.id,
    title: row.title,
    grade: row.grade,
    subject: row.subject,
    topic: row.topic,
    difficulty: row.difficulty,
    bloomLevel: row.bloom_level,
    durationMinutes: row.duration_minutes,
    requirements: row.requirements,
    questionCount: row.question_count,
    questions: JSON.parse(row.questions_json) as ExamQuestion[],
    createdAt: row.created_at
  };
}

export async function saveResult(input: {
  examId: number;
  studentName: string;
  score: number;
  total: number;
  aiComment: string;
}): Promise<{ id: number }> {
  const percentage = Number(((input.score / Math.max(1, input.total)) * 100).toFixed(2));

  if (!dbConfigured || !sql) {
    memoryStore.resultSeq += 1;
    const id = memoryStore.resultSeq;
    memoryStore.results.set(id, {
      id,
      examId: input.examId,
      studentName: input.studentName,
      score: input.score,
      total: input.total,
      percentage,
      aiComment: input.aiComment,
      createdAt: new Date().toISOString()
    });
    return { id };
  }

  await ensureTables();
  const rows = await sql`
    INSERT INTO results (exam_id, student_name, score, total, percentage, ai_comment)
    VALUES (
      ${input.examId}, ${input.studentName}, ${input.score}, ${input.total},
      ${percentage}, ${input.aiComment}
    )
    RETURNING id
  `;

  return { id: Number((rows[0] as { id: number }).id) };
}

export async function getResultById(id: number): Promise<StoredResult | null> {
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }

  if (!dbConfigured || !sql) {
    return memoryStore.results.get(id) ?? null;
  }

  await ensureTables();
  const rows = (await sql`
    SELECT id, exam_id, student_name, score, total, percentage, ai_comment, created_at
    FROM results
    WHERE id = ${id}
    LIMIT 1
  `) as unknown as ResultRow[];

  if (!rows.length) {
    return null;
  }

  const row = rows[0]!;
  return {
    id: row.id,
    examId: row.exam_id,
    studentName: row.student_name,
    score: Number(row.score),
    total: row.total,
    percentage: Number(row.percentage),
    aiComment: row.ai_comment,
    createdAt: row.created_at
  };
}

export async function listResultsByExamId(examId: number): Promise<ExamResultSummary[]> {
  if (!Number.isFinite(examId) || examId <= 0) {
    return [];
  }

  if (!dbConfigured || !sql) {
    return Array.from(memoryStore.results.values())
      .filter((item) => item.examId === examId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  await ensureTables();
  const rows = (await sql`
    SELECT id, exam_id, student_name, score, total, percentage, ai_comment, created_at
    FROM results
    WHERE exam_id = ${examId}
    ORDER BY created_at DESC
  `) as unknown as ResultRow[];

  return rows.map((row) => ({
    id: row.id,
    examId: row.exam_id,
    studentName: row.student_name,
    score: Number(row.score),
    total: row.total,
    percentage: Number(row.percentage),
    aiComment: row.ai_comment,
    createdAt: row.created_at
  }));
}
