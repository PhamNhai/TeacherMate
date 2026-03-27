import type { CreateExamPayload } from "./types";

type GeminiPayload = {
  contents: Array<{
    role?: string;
    parts: Array<{ text: string }>;
  }>;
  generationConfig?: {
    temperature?: number;
    responseMimeType?: string;
  };
};

const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

function stripCodeFence(input: string): string {
  return input.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function extractTextFromGeminiResponse(data: unknown): string {
  const root = data as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }>;
  };
  const text = root?.candidates?.[0]?.content?.parts?.find(
    (part) => typeof part?.text === "string"
  )?.text;
  return typeof text === "string" ? text.trim() : "";
}

async function callGemini(payload: GeminiPayload): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY.");
  }

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const text = extractTextFromGeminiResponse(data);
  if (!text) {
    throw new Error("Empty Gemini response.");
  }
  return text;
}

export function buildGenerationPrompt(payload: CreateExamPayload): string {
  return [
    "Ban la tro ly tao de trac nghiem cho giao vien.",
    `Tao dung ${payload.questionCount} cau trac nghiem.`,
    `Lop: ${payload.grade}.`,
    `Mon hoc: ${payload.subject}.`,
    `Chuyen de: ${payload.topic}.`,
    `Muc do: ${payload.difficulty}.`,
    `Muc Bloom uu tien: ${payload.bloomLevel}.`,
    `Thoi gian lam bai: ${payload.durationMinutes} phut.`,
    payload.specialRequirements
      ? `Yeu cau chi tiet: ${payload.specialRequirements}.`
      : "Yeu cau chi tiet: Khong.",
    "Tra ve DUY NHAT JSON array, khong markdown, khong giai thich.",
    "Moi phan tu theo dung format:",
    '{ "question":"string", "options":["string","string","string","string"], "answer":"A|B|C|D", "explanation":"string ngan" }'
  ].join("\n");
}

export async function generateExamWithGemini(prompt: string): Promise<unknown> {
  const text = await callGemini({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.6,
      responseMimeType: "application/json"
    }
  });
  const cleaned = stripCodeFence(text);
  return JSON.parse(cleaned);
}

export async function gradeExam(input: {
  studentName: string;
  subject: string;
  topic: string;
  totalQuestions: number;
  correctCount: number;
  score: number;
  wrongQuestions: string[];
}): Promise<string> {
  const fallback = `Ban ${input.studentName} dung ${input.correctCount}/${input.totalQuestions} cau (${input.score} diem). Hay on lai cac cau sai va lam them bai tap cung dang.`;

  if (!process.env.GEMINI_API_KEY) {
    return fallback;
  }

  try {
    const prompt = [
      "Viet nhan xet cho hoc sinh bang tieng Viet, ngan gon, tich cuc.",
      `Hoc sinh: ${input.studentName}.`,
      `Mon: ${input.subject}.`,
      `Chu de: ${input.topic}.`,
      `Ket qua: ${input.correctCount}/${input.totalQuestions}, diem ${input.score}.`,
      `Cau sai: ${input.wrongQuestions.join(", ") || "khong co"}.`,
      "Yeu cau: 2-3 cau, co diem manh + diem can cai thien."
    ].join("\n");

    const text = await callGemini({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7 }
    });
    return stripCodeFence(text);
  } catch {
    return fallback;
  }
}
