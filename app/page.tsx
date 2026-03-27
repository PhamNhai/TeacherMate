import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container">
      <section className="card">
        <p className="eyebrow">TeacherMate</p>
        <h1>Tao de trac nghiem bang AI</h1>
        <p className="muted">Chon lop, mon, chuyen de, so cau, do kho. Hoc sinh lam bai online va nhan nhan xet AI.</p>
        <div className="actions">
          <Link className="btn btn-primary" href="/create">
            Tao de
          </Link>
          <Link className="btn btn-secondary" href="/exam">
            Vao phong thi
          </Link>
        </div>
      </section>
    </main>
  );
}
