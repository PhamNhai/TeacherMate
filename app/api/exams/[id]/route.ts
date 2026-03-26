import { NextResponse } from "next/server";
import { getExamById } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;
  const examId = Number(id);
  if (!Number.isFinite(examId) || examId <= 0) {
    return NextResponse.json({ error: "ID de khong hop le." }, { status: 400 });
  }
  const exam = await getExamById(examId);

  if (!exam) {
    return NextResponse.json({ error: "Khong tim thay de." }, { status: 404 });
  }

  return NextResponse.json({ exam });
}
