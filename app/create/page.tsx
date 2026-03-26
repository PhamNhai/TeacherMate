"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./create.module.css";
import {
  BLOOMS_LEVELS,
  DIFFICULTY_LEVELS,
  GRADE_LEVELS,
  QUESTION_COUNTS,
  SUBJECTS,
} from "@/lib/constants";

type CreatePayload = {
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

const initial: CreatePayload = {
  grade: "10",
  subject: "Tiếng Anh",
  topic: "",
  examTitle: "",
  questionCount: 10,
  difficulty: "Trung bình",
  bloomLevel: "Hiểu",
  durationMinutes: 15,
  specialRequirements: "",
};

export default function CreateExamPage() {
  const router = useRouter();
  const [form, setForm] = useState<CreatePayload>(initial);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return form.topic.trim().length > 0 && form.examTitle.trim().length > 0;
  }, [form.examTitle, form.topic]);

  const update = <K extends keyof CreatePayload>(key: K, value: CreatePayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!canSubmit) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !data.id) {
        setError(data.error ?? "Không thể tạo đề. Vui lòng thử lại.");
        return;
      }
      router.push(`/exam/${data.id}`);
    } catch {
      setError("Lỗi mạng. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>Tạo đề trắc nghiệm bằng AI</h1>
        <p className={styles.subtitle}>Chọn thông số. Bấm tạo đề. Chia sẻ link cho học sinh làm bài.</p>

        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.grid}>
            <label>
              Lớp
              <select value={form.grade} onChange={(e) => update("grade", e.target.value)}>
                {GRADE_LEVELS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Môn học
              <select value={form.subject} onChange={(e) => update("subject", e.target.value)}>
                {SUBJECTS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Số câu
              <select
                value={
                  QUESTION_COUNTS.some((value) => value === form.questionCount)
                    ? form.questionCount
                    : "custom"
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "custom") return;
                  update("questionCount", Number(value));
                }}
              >
                {QUESTION_COUNTS.map((v) => (
                  <option key={v} value={v}>
                    {v} câu
                  </option>
                ))}
                <option value="custom">Tùy chọn</option>
              </select>
            </label>

            <label>
              Nhập số câu tùy ý
              <input
                type="number"
                min={5}
                max={100}
                value={form.questionCount}
                onChange={(e) => update("questionCount", Number(e.target.value || 10))}
              />
            </label>

            <label>
              Mức độ
              <select value={form.difficulty} onChange={(e) => update("difficulty", e.target.value)}>
                {DIFFICULTY_LEVELS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Mức Bloom
              <select value={form.bloomLevel} onChange={(e) => update("bloomLevel", e.target.value)}>
                {BLOOMS_LEVELS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Thời gian làm bài (phút)
              <input
                type="number"
                min={5}
                max={180}
                value={form.durationMinutes}
                onChange={(e) => update("durationMinutes", Number(e.target.value || 15))}
              />
            </label>

            <label>
              Tiêu đề đề thi
              <input
                placeholder="VD: Kiểm tra 15 phút - Chuyên đề Dao động"
                value={form.examTitle}
                onChange={(e) => update("examTitle", e.target.value)}
              />
            </label>
          </div>

          <label>
            Chuyên đề / Chủ đề
            <input
              placeholder="VD: Thì hiện tại đơn / Hàm số bậc hai / Dao động điều hòa"
              value={form.topic}
              onChange={(e) => update("topic", e.target.value)}
            />
          </label>

          <label>
            Yêu cầu chi tiết
            <textarea
              rows={5}
              placeholder="Ví dụ: ưu tiên câu hỏi tình huống thực tế, 30% mức độ vận dụng, không hỏi mẹo."
              value={form.specialRequirements}
              onChange={(e) => update("specialRequirements", e.target.value)}
            />
          </label>

          {error ? <p className={styles.error}>{error}</p> : null}

          <button type="submit" disabled={isLoading || !canSubmit}>
            {isLoading ? "Đang tạo đề..." : "Tạo đề"}
          </button>
        </form>
      </section>
    </main>
  );
}
