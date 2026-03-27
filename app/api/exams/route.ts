import { NextResponse } from "next/server";
import { buildGenerationPrompt, generateExamWithGemini, hasGeminiKey } from "@/lib/gemini";
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

function normalizeOptionTexts(options: unknown): string[] {
  if (!Array.isArray(options)) {
    return [];
  }
  const normalized = options
    .map((value) => String(value ?? "").trim())
    .filter((value) => value.length > 0);
  return normalized.slice(0, 4);
}

function optionLabelToIndex(answer: string): number {
  const normalized = answer.trim().toUpperCase();
  if (["A", "B", "C", "D"].includes(normalized)) {
    return normalized.charCodeAt(0) - "A".charCodeAt(0);
  }
  if (["1", "2", "3", "4"].includes(normalized)) {
    return Number(normalized) - 1;
  }
  return -1;
}

function toAnswerIndex(answerRaw: unknown, options: string[]): number {
  const answer = String(answerRaw ?? "").trim();
  const fromLabel = optionLabelToIndex(answer);
  if (fromLabel >= 0 && fromLabel < options.length) {
    return fromLabel;
  }
  const byText = options.findIndex((opt) => opt.toLowerCase() === answer.toLowerCase());
  return byText;
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
      const options = normalizeOptionTexts(q.options);
      if (options.length < 2) {
        return null;
      }
      while (options.length < 4) {
        options.push(`Lua chon ${String.fromCharCode(65 + options.length)}`);
      }

      const answerIndex = toAnswerIndex(q.answer, options);
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

    let generationError: unknown = null;
    try {
      const prompt = buildGenerationPrompt(payload);
      const aiData = await generateExamWithGemini(prompt);
      questions = normalizeQuestions(aiData, payload.questionCount);
    } catch (error) {
      generationError = error;
      questions = buildMockExam({
        subject: payload.subject,
        topic: payload.topic,
        questionCount: payload.questionCount,
        difficulty: payload.difficulty
      });
    }

    if (hasGeminiKey() && generationError) {
      const message =
        generationError instanceof Error ? generationError.message : "Unknown Gemini error";
      return NextResponse.json(
        {
          error: "Tao de bang Gemini that bai.",
          details: message
        },
        { status: 502 }
      );
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
