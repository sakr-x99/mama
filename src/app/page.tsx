"use client";

import Link from "next/link";
import Nav from "@/components/Nav";
import {
  KEYS,
  useLocalState,
  type AttendanceRecord,
  type Payment,
  type ScheduleItem,
  type Student,
  formatMoney,
  formatDate,
  today,
} from "@/lib/store";

export default function Home() {
  const [students] = useLocalState<Student[]>(KEYS.students, []);
  const [schedule] = useLocalState<ScheduleItem[]>(KEYS.schedule, []);
  const [attendance] = useLocalState<AttendanceRecord[]>(KEYS.attendance, []);
  const [payments] = useLocalState<Payment[]>(KEYS.payments, []);

  const todaysRecords = attendance.filter((a) => a.date === today());
  const presentToday = todaysRecords.filter((a) => a.status === "present").length;
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const upcoming = schedule
    .filter((s) => s.date >= today())
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 5);

  return (
    <>
      <Nav />
      <main className="container">
        <h1 className="page-title">أهلاً بك 👋</h1>
        <p className="page-subtitle">نظرة سريعة على الدروس</p>

        <div className="stats">
          <Link href="/students" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="stat">
              <div className="stat-value">{students.length}</div>
              <div className="stat-label">التلاميذ</div>
            </div>
          </Link>
          <Link href="/schedule" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="stat">
              <div className="stat-value">{schedule.length}</div>
              <div className="stat-label">موعد مسجّل</div>
            </div>
          </Link>
          <Link href="/attendance" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="stat">
              <div className="stat-value">{presentToday}</div>
              <div className="stat-label">حاضر اليوم</div>
            </div>
          </Link>
          <Link href="/fees" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="stat">
              <div className="stat-value">{formatMoney(totalPaid)}</div>
              <div className="stat-label">محصَّل</div>
            </div>
          </Link>
        </div>

        <div className="card">
          <div className="card-title">🗓️ أقرب المواعيد</div>
          {upcoming.length === 0 ? (
            <div className="empty">لا توجد مواعيد قادمة. <Link href="/schedule">أضف موعداً جديداً</Link></div>
          ) : (
            <>
              {upcoming.map((s) => {
                const st = students.find((x) => x.id === s.studentId);
                return (
                  <div key={s.id} className="list-item">
                    <div className="main">
                      <div style={{ fontWeight: 700 }}>{st?.name ?? "تلميذ محذوف"}</div>
                      <div className="muted">{formatDate(s.date)} · الساعة {s.time}</div>
                    </div>
                    <Link className="btn-ghost btn-sm btn" href="/schedule" style={{ color: "var(--text)" }}>عرض</Link>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </main>
    </>
  );
}