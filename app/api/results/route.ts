import { NextResponse } from "next/server";

import { gradeExam } from "@/lib/gemini";
import { getExamById, listResultsByExamId, saveResult } from "@/lib/db";
import { scoreAnswers } from "@/lib/mock";
import { submitResultInputSchema } from "@/lib/validators";
import { getResultById } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const examId = Number(url.searchParams.get("examId"));
  if (Number.isFinite(examId) && examId > 0) {
    const results = await listResultsByExamId(examId);
    return NextResponse.json({ ok: true, results });
  }

  const resultId = Number(url.searchParams.get("resultId"));

  if (!Number.isFinite(resultId) || resultId <= 0) {
    return NextResponse.json({ ok: false, error: "resultId khong hop le." }, { status: 400 });
  }

  const result = await getResultById(resultId);
  if (!result) {
    return NextResponse.json({ ok: false, error: "Khong tim thay ket qua." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, result });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = submitResultInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Du lieu nop bai khong hop le." },
        { status: 400 },
      );
    }

    const { examId, studentName, answers } = parsed.data;
    const exam = await getExamById(examId);

    if (!exam) {
      return NextResponse.json({ error: "Khong tim thay de." }, { status: 404 });
    }

    const scoreResult = scoreAnswers(exam.questions, answers);
    const aiComment = await gradeExam({
      studentName,
      subject: exam.subject,
      topic: exam.topic,
      totalQuestions: exam.questionCount,
      correctCount: scoreResult.correctCount,
      score: scoreResult.score,
      wrongQuestions: scoreResult.wrongQuestionIds,
    });

    const result = await saveResult({
      examId,
      studentName,
      score: scoreResult.score,
      total: scoreResult.total,
      aiComment,
    });

    return NextResponse.json({ id: result.id, score: scoreResult.score });
  } catch (error) {
    console.error("[POST /api/results]", error);
    return NextResponse.json({ error: "Khong the nop bai luc nay." }, { status: 500 });
  }
}
