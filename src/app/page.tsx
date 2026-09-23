"use client";

import Link from "next/link";
import Nav from "@/components/Nav";
import {
  KEYS,
  useLocalState,
  migrateStudents,
  type AttendanceRecord,
  type Group,
  type Payment,
  type Student,
  formatMoney,
  today,
  weekdayOf,
  groupSessions,
} from "@/lib/store";

export default function Home() {
  const [groups] = useLocalState<Group[]>(KEYS.groups, []);
  const [students] = useLocalState<Student[]>(KEYS.students, [], migrateStudents);
  const [attendance] = useLocalState<AttendanceRecord[]>(KEYS.attendance, []);
  const [payments] = useLocalState<Payment[]>(KEYS.payments, []);

  const weekday = weekdayOf(today());
  const todaysGroups = groups.filter((g) => g.sessions.some((s) => s.day === weekday));
  const presentToday = attendance.filter(
    (a) => a.date === today() && a.status === "present"
  ).length;
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <>
      <Nav />
      <main className="container">
        <h1 className="page-title">أهلاً بك 👋</h1>
        <p className="page-subtitle">نظرة سريعة على الدروس</p>

        <div className="stats">
          <Link href="/schedule" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="stat">
              <div className="stat-value">{groups.length}</div>
              <div className="stat-label">مجموعة</div>
            </div>
          </Link>
          <Link href="/students" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="stat">
              <div className="stat-value">{students.length}</div>
              <div className="stat-label">تلميذ</div>
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
          <div className="card-title">📚 محاضرات اليوم</div>
          {todaysGroups.length === 0 ? (
            <div className="empty">لا توجد محاضرات اليوم. حدّد مواعيد من صفحة <Link href="/schedule">المواعيد</Link></div>
          ) : (
            todaysGroups.map((g) => (
              <div key={g.id} className="list-item">
                <div className="main">
                  <div style={{ fontWeight: 700 }}>👥 {g.name}</div>
                  <div className="muted">
                    {groupSessions(g)
                      .filter((s) => s.day === weekday)
                      .map((s) => s.time)
                      .join(" ، ")}
                  </div>
                </div>
                <Link className="btn-green btn-sm btn" href="/attendance" style={{ textDecoration: "none" }}>تسجيل الحضور</Link>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}