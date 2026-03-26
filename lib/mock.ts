import type { ExamQuestion } from "@/lib/types";

export function buildMockExam(input: {
  subject: string;
  topic: string;
  questionCount: number;
  difficulty: string;
}): ExamQuestion[] {
  const total = Math.max(5, input.questionCount);

  return Array.from({ length: total }, (_, index) => {
    const questionNo = index + 1;
    const stem = `${input.subject} - ${input.topic} - ${input.difficulty}`;
    return {
      id: `q-${questionNo}`,
      question: `Cau ${questionNo}: Cau hoi mau cho ${stem}?`,
      options: [
        `Lua chon A cho cau ${questionNo}`,
        `Lua chon B cho cau ${questionNo}`,
        `Lua chon C cho cau ${questionNo}`,
        `Lua chon D cho cau ${questionNo}`
      ],
      answerIndex: index % 4,
      explanation: `Goi y: xem lai noi dung trong chu de ${input.topic}.`
    };
  });
}

export function scoreAnswers(
  questions: ExamQuestion[],
  answers: Record<string, number>
): {
  score: number;
  total: number;
  correctCount: number;
  wrongQuestionIds: string[];
} {
  let correctCount = 0;
  const wrongQuestionIds: string[] = [];

  for (const q of questions) {
    const picked = answers[q.id];
    if (picked === q.answerIndex) {
      correctCount += 1;
    } else {
      wrongQuestionIds.push(q.id);
    }
  }

  const total = questions.length;
  const score = Number(((correctCount / Math.max(1, total)) * 10).toFixed(2));
  return { score, total, correctCount, wrongQuestionIds };
}
