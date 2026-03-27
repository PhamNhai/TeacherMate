import { NextResponse } from "next/server";
import { buildGenerationPrompt, generateExamWithGemini } from "@/lib/gemini";
import { insertExam, isDatabaseConfigured } from "@/lib/db";
import { createExamPayloadSchema } from "@/lib/validators";
import type { ExamQuestion } from "@/lib/types";
import { buildMockExam } from "@/lib/mock";

type GeminiRawQuestion = {
  question?: unknown;
  options?: unknown;
  answer?: unknown;
  explanation?: unknown;
};

function toAnswerIndex(answer: string): number {
  if (["A", "B", "C", "D"].includes(answer)) {
    return answer.charCodeAt(0) - "A".charCodeAt(0);
  }
  return -1;
}

function normalizeQuestions(raw: unknown, expectedCount: number): ExamQuestion[] {
  if (!Array.isArray(raw)) {
    throw new Error("AI response is not a question array.");
  }

  const mapped = raw
    .map((item, index): ExamQuestion | null => {
      const q = item as GeminiRawQuestion;
      if (typeof q.question !== "string") {
        return null;
      }
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        return null;
      }
      const options = q.options.filter((o): o is string => typeof o === "string");
      if (options.length !== 4) {
        return null;
      }
      const answer = String(q.answer ?? "").trim().toUpperCase();
      const answerIndex = toAnswerIndex(answer);
      if (answerIndex < 0 || answerIndex > 3) {
        return null;
      }
      return {
        id: `q-${index + 1}`,
        question: q.question.trim(),
        options,
        answerIndex,
        explanation: typeof q.explanation === "string" ? q.explanation.trim() : undefined
      };
    })
    .filter((q): q is ExamQuestion => q !== null);

  if (mapped.length < Math.max(5, Math.floor(expectedCount * 0.7))) {
    throw new Error("Generated questions are invalid or too few.");
  }

  return mapped.slice(0, expectedCount);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createExamPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Du lieu dau vao khong hop le.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    let questions: ExamQuestion[];

    try {
      const prompt = buildGenerationPrompt(payload);
      const aiData = await generateExamWithGemini(prompt);
      questions = normalizeQuestions(aiData, payload.questionCount);
    } catch {
      questions = buildMockExam({
        subject: payload.subject,
        topic: payload.topic,
        questionCount: payload.questionCount,
        difficulty: payload.difficulty
      });
    }

    const inserted = await insertExam({
      title: payload.examTitle.trim(),
      grade: payload.grade,
      subject: payload.subject,
      topic: payload.topic,
      difficulty: payload.difficulty,
      bloomLevel: payload.bloomLevel,
      durationMinutes: payload.durationMinutes,
      requirements: payload.specialRequirements.trim(),
      questionCount: questions.length,
      questions
    });

    return NextResponse.json(
      { id: inserted.id, source: isDatabaseConfigured() ? "db" : "memory" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Khong tao duoc de thi." }, { status: 500 });
  }
}
