"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Exam, SubmitAnswerPayload } from "@/lib/types";
import styles from "./exam.module.css";

type AnswersState = Record<string, number>;

export default function ExamPlayPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentName, setStudentName] = useState("");
  const [answers, setAnswers] = useState<AnswersState>({});

  const examId = useMemo(() => Number(params?.id), [params?.id]);

  useEffect(() => {
    async function fetchExam() {
      if (!examId || Number.isNaN(examId)) {
        setError("ID de khong hop le.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/exams/${examId}`);
        const data = (await response.json()) as { exam?: Exam; error?: string };
        if (!response.ok || !data.exam) {
          throw new Error(data?.error || "Khong the tai de.");
        }
        setExam(data.exam);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Da xay ra loi.");
      } finally {
        setLoading(false);
      }
    }

    void fetchExam();
  }, [examId]);

  function setAnswer(questionId: string, optionIndex: number) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!exam) return;

    if (!studentName.trim()) {
      setError("Vui long nhap ten hoc sinh.");
      return;
    }

    if (Object.keys(answers).length < exam.questions.length) {
      setError("Vui long tra loi day du tat ca cau hoi.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: SubmitAnswerPayload = {
        examId: exam.id,
        studentName: studentName.trim(),
        answers
      };

      const response = await fetch("/api/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as { id?: number; error?: string };
      if (!response.ok || !data.id) {
        throw new Error(data?.error || "Nop bai that bai.");
      }

      router.push(`/exam/${exam.id}/result?resultId=${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da xay ra loi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className={styles.page}>Dang tai de...</main>;
  }

  if (!exam) {
    return <main className={styles.page}>Khong tim thay de thi.</main>;
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <p className={styles.badge}>Lam bai</p>
        <h1>{exam.title}</h1>
        <p>
          Lop {exam.grade} · {exam.subject} · {exam.topic}
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.studentRow}>
          <label htmlFor="studentName">Ten hoc sinh</label>
          <input
            id="studentName"
            value={studentName}
            onChange={(event) => setStudentName(event.target.value)}
            placeholder="Nguyen Van A"
            required
          />
        </div>

        {exam.questions.map((question, index) => (
          <section key={question.id} className={styles.questionCard}>
            <h2>
              Cau {index + 1}: {question.question}
            </h2>
            <div className={styles.options}>
              {question.options.map((option, optionIndex) => {
                const checked = answers[question.id] === optionIndex;
                return (
                  <label
                    key={`${question.id}-${optionIndex}`}
                    className={checked ? styles.optionActive : styles.option}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      checked={checked}
                      onChange={() => setAnswer(question.id, optionIndex)}
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}

        {error ? <p className={styles.error}>{error}</p> : null}

        <button className={styles.submitButton} type="submit" disabled={submitting}>
          {submitting ? "Dang nop bai..." : "Nop bai"}
        </button>
      </form>
    </main>
  );
}
