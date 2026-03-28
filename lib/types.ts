export type ExamQuestion = {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
};

export type Exam = {
  id: number;
  title: string;
  grade: string;
  subject: string;
  topic: string;
  difficulty: string;
  bloomLevel: string;
  durationMinutes: number;
  requirements: string;
  questionCount: number;
  questions: ExamQuestion[];
  createdAt: string;
};

export type CreateExamPayload = {
  grade: string;
  subject: string;
  topic: string;
  examTitle: string;
  questionCount: number;
  difficulty: string;
  bloomLevel: string;
  durationMinutes: number;
  specialRequirements: string;
};

export type CreateExamResponse = {
  id: number;
  source: "db" | "memory";
};

export type SubmitAnswerPayload = {
  examId: number;
  studentName: string;
  answers: Record<string, number>;
};

export type StoredResult = {
  id: number;
  examId: number;
  studentName: string;
  score: number;
  total: number;
  percentage: number;
  aiComment: string;
  createdAt: string;
};

export type ExamResultSummary = {
  id: number;
  examId: number;
  studentName: string;
  score: number;
  total: number;
  percentage: number;
  aiComment: string;
  createdAt: string;
};

