"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styles from "./result.module.css";
import type { StoredResult } from "@/lib/types";

type ResultResponse = {
  ok: boolean;
  result?: StoredResult;
  error?: string;
};

export default function ResultPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const resultId = searchParams.get("resultId");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StoredResult | null>(null);

  const scoreLabel = useMemo(() => {
    if (!result) return "";
    return `${result.score}/${result.total}`;
  }, [result]);

  useEffect(() => {
    if (!resultId) {
      setError("Thiếu resultId trên URL.");
      setLoading(false);
      return;
    }

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/results?resultId=${encodeURIComponent(resultId)}`, {
          method: "GET",
        });
        const data = (await res.json()) as ResultResponse;
        if (!res.ok || !data.ok || !data.result) {
          throw new Error(data.error || "Không lấy được kết quả.");
        }
        setResult(data.result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi không xác định.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [resultId]);

  return (
    <main className={styles.wrap}>
      <section className={styles.card}>
        <header className={styles.header}>
          <h1>Kết quả bài làm</h1>
          <p>Xem điểm và nhận xét AI.</p>
        </header>

        {loading ? (
          <p>Đang tải kết quả...</p>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : result ? (
          <>
            <div className={styles.grid}>
              <div className={styles.metric}>
                <span>Học sinh</span>
                <strong>{result.studentName}</strong>
              </div>
              <div className={styles.metric}>
                <span>Điểm</span>
                <strong>{scoreLabel}</strong>
              </div>
              <div className={styles.metric}>
                <span>Tỷ lệ đúng</span>
                <strong>{result.percentage}%</strong>
              </div>
            </div>

            <article className={styles.comment}>
              <h2>Nhận xét AI</h2>
              <p>{result.aiComment}</p>
            </article>
          </>
        ) : null}

        <footer className={styles.actions}>
          <Link href={`/exam/${params.id}`}>Lam lai</Link>
          <Link href="/create">Tao de moi</Link>
        </footer>
      </section>
    </main>
  );
}
