import Link from "next/link";
import styles from "./exam-entry.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function ExamEntryPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const createdId = firstParam(params.id);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.badge}>Student mode</p>
        <h1>Vao phong thi</h1>
        <p className={styles.subtitle}>Man nay chi danh cho hoc sinh lam bai.</p>

        {createdId ? (
          <p className={styles.notice}>
            Tao de thanh cong. ID: <strong>{createdId}</strong>
          </p>
        ) : null}

        <form action="/exam/open" method="get" className={styles.form}>
          <label htmlFor="id">ID de</label>
          <input id="id" name="id" placeholder="Vi du: 12" required />
          <button type="submit">Mo de</button>
        </form>

        <div className={styles.links}>
          {createdId ? <Link href={`/exam/${createdId}`}>Lam de vua tao</Link> : null}
          <Link href="/create">Sang man tao de</Link>
        </div>
      </section>
    </main>
  );
}
