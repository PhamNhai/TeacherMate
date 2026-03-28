import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container">
      <section className="hero-card">
        <p className="eyebrow">TeacherMate</p>
        <h1>Web tao de & cham bai dang yeu</h1>
        <p className="muted">
          Tach ro 2 man: giao vien tao de, hoc sinh lam bai. Co luu ket qua tung hoc sinh.
        </p>
        <div className="actions">
          <Link className="btn btn-primary" href="/create">
            Man tao de (giao vien)
          </Link>
          <Link className="btn btn-secondary" href="/exam">
            Man lam bai (hoc sinh)
          </Link>
        </div>
        <div className="actions">
          <Link className="btn btn-soft" href="/exam">
            Nhap ID de de vao thi
          </Link>
        </div>
      </section>
    </main>
  );
}
