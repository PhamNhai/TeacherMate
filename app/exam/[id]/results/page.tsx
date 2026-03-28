"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { ExamResultSummary } from "@/lib/types";
import styles from "./results.module.css";

type ResultsResponse = {
  ok: boolean;
  results?: ExamResultSummary[];
  error?: string;
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

export default function ExamResultsPage() {
  const params = useParams<{ id: string }>();
  const examId = useMemo(() => Number(params?.id), [params?.id]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ExamResultSummary[]>([]);

  useEffect(() => {
    async function loadResults() {
      if (!Number.isFinite(examId) || examId <= 0) {
        setError("ID de khong hop le.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/results?examId=${examId}`, { method: "GET" });
        const data = (await response.json()) as ResultsResponse;
        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Khong tai duoc danh sach ket qua.");
        }
        setResults(data.results ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Da xay ra loi.");
      } finally {
        setLoading(false);
      }
    }

    void loadResults();
  }, [examId]);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <header className={styles.header}>
          <p className={styles.badge}>Giao vien</p>
          <h1>Ket qua tung hoc sinh</h1>
          <p>Xem diem va nhan xet AI da luu cho de #{params.id}</p>
        </header>

        {loading ? <p>Dang tai du lieu...</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}

        {!loading && !error && results.length === 0 ? (
          <p className={styles.empty}>Chua co hoc sinh nop bai cho de nay.</p>
        ) : null}

        {!loading && !error && results.length > 0 ? (
          <div className={styles.list}>
            {results.map((item, index) => (
              <article key={item.id} className={styles.item}>
                <div className={styles.topRow}>
                  <h2>
                    {index + 1}. {item.studentName}
                  </h2>
                  <span className={styles.score}>
                    {item.score}/{item.total} ({item.percentage}%)
                  </span>
                </div>
                <p className={styles.comment}>{item.aiComment}</p>
                <p className={styles.time}>Nop luc: {formatDate(item.createdAt)}</p>
              </article>
            ))}
          </div>
        ) : null}

        <footer className={styles.actions}>
          <Link href={`/exam/${params.id}`} className={styles.linkSoft}>
            Vao de nay
          </Link>
          <Link href="/create" className={styles.linkPrimary}>
            Tao de moi
          </Link>
        </footer>
      </section>
    </main>
  );
}
