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
  monthOf,
  formatMoney,
  formatMonth,
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
  const currentMonth = monthOf(today());
  const todaysGroups = groups.filter((g) => g.sessions.some((s) => s.day === weekday));
  const presentToday = attendance.filter(
    (a) => a.date === today() && a.status === "present"
  ).length;

  /* ---------- money ---------- */
  const groupRows = groups.map((g) => {
    const months = new Set(
      attendance.filter((a) => a.groupId === g.id).map((a) => monthOf(a.date))
    ).size;
    const due = (g.monthlyFee ?? 0) * months;
    const paid = payments
      .filter((p) => p.groupId === g.id)
      .reduce((s, p) => s + (p.amount || 0), 0);
    const members = students.filter((s) => s.groupIds.includes(g.id)).length;
    return { group: g, due, paid, balance: due - paid, months, members };
  });

  const dueTotal = groupRows.reduce((s, r) => s + r.due, 0);
  const paidTotal = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const overdueTotal = groupRows.reduce((s, r) => s + Math.max(r.balance, 0), 0);
  const collectedThisMonth = payments
    .filter((p) => monthOf(p.date) === currentMonth)
    .reduce((s, p) => s + (p.amount || 0), 0);

  /* ---------- attendance summary ---------- */
  const presentTotal = attendance.filter((a) => a.status === "present").length;
  const absentTotal = attendance.filter((a) => a.status === "absent").length;
  const rate = presentTotal + absentTotal > 0
    ? Math.round((presentTotal / (presentTotal + absentTotal)) * 100)
    : 0;
  const absentThisMonth = attendance.filter(
    (a) => monthOf(a.date) === currentMonth && a.status === "absent"
  ).length;

  /* ---------- top 10 absent ---------- */
  const absentMap = new Map<string, number>();
  const presentMap = new Map<string, number>();
  for (const a of attendance) {
    if (a.status === "absent") absentMap.set(a.studentId, (absentMap.get(a.studentId) ?? 0) + 1);
    else presentMap.set(a.studentId, (presentMap.get(a.studentId) ?? 0) + 1);
  }
  const topAbsent = students
    .map((s) => {
      const absent = absentMap.get(s.id) ?? 0;
      const present = presentMap.get(s.id) ?? 0;
      const total = absent + present;
      return { student: s, absent, total, rate: total ? Math.round((present / total) * 100) : 0 };
    })
    .filter((x) => x.absent > 0)
    .sort((a, b) => b.absent - a.absent || a.rate - b.rate)
    .slice(0, 10);

  const groupName = (id: string) => groups.find((g) => g.id === id)?.name ?? "مجموعة محذوفة";

  return (
    <>
      <Nav />
      <main className="container">
        <h1 className="page-title">أهلاً بك 👋</h1>
        <p className="page-subtitle">نظرة سريعة على الدروس والفلوس والغياب</p>

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
              <div className="stat-value" style={{ color: overdueTotal > 0 ? "var(--red)" : "var(--green)" }}>
                {formatMoney(overdueTotal)}
              </div>
              <div className="stat-label">💰 فلوس متتأخرة</div>
            </div>
          </Link>
        </div>

        {/* ---------- المال ---------- */}
        <div className="card">
          <div className="row" style={{ marginBottom: 6 }}>
            <div className="card-title" style={{ margin: 0 }}>💸 حالة الفلوس</div>
            <Link href="/fees" className="btn-ghost btn-sm" style={{ textDecoration: "none", color: "var(--text)" }}>إدارة الفلوس</Link>
          </div>

          <div className="stats" style={{ marginBottom: 12 }}>
            <div className="stat">
              <div className="stat-value" style={{ color: "var(--amber)", fontSize: 22 }}>{formatMoney(dueTotal)}</div>
              <div className="stat-label">المستحق</div>
            </div>
            <div className="stat">
              <div className="stat-value" style={{ color: "var(--green)", fontSize: 22 }}>{formatMoney(paidTotal)}</div>
              <div className="stat-label">المدفوع</div>
            </div>
            <div className="stat">
              <div className="stat-value" style={{ color: "var(--red)", fontSize: 22 }}>{formatMoney(overdueTotal)}</div>
              <div className="stat-label">المتأخر</div>
            </div>
            <div className="stat">
              <div className="stat-value" style={{ color: "var(--primary)", fontSize: 22 }}>{formatMoney(collectedThisMonth)}</div>
              <div className="stat-label">محصَّل {formatMonth(currentMonth)}</div>
            </div>
          </div>

          {groupRows.length === 0 ? (
            <div className="empty">لا توجد مجموعات بعد. <Link href="/schedule">أنشئ مجموعة</Link></div>
          ) : (
            groupRows.map((r) => (
              <div key={r.group.id} className="list-item">
                <div className="main">
                  <div style={{ fontWeight: 700 }}>👥 {r.group.name}</div>
                  <div className="muted">
                    {r.members} تلميذ · {r.months} شهر
                  </div>
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: r.balance > 0 ? "var(--red)" : "var(--green)" }}>
                    {r.balance > 0 ? `متأخر ${formatMoney(r.balance)}` : "متسدد ✓"}
                  </div>
                  <div className="muted">
                    {formatMoney(r.paid)} / {formatMoney(r.due)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ---------- أعلى 10 غياب ---------- */}
        <div className="card">
          <div className="card-title">🚩 أعلى 10 طلاب في الغياب</div>
          {topAbsent.length === 0 ? (
            <div className="empty">لا توجد سجلات غياب بعد. <Link href="/attendance">سجّل الحضور</Link></div>
          ) : (
            topAbsent.map((x, i) => (
              <div key={x.student.id} className="list-item">
                <div className="main">
                  <div style={{ fontWeight: 700 }}>
                    {i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : ""}{x.student.name}
                  </div>
                  <div className="muted">
                    {x.student.groupIds.length > 0
                      ? x.student.groupIds.map(groupName).join("، ")
                      : "بدون مجموعة"}
                    {" · "}حضور {x.rate}%
                  </div>
                </div>
                <span className="chip chip-red">{x.absent} غياب</span>
              </div>
            ))
          )}
        </div>

        {/* ---------- ملخص الحضور ---------- */}
        <div className="card">
          <div className="card-title">📊 ملخص الحضور</div>
          <div className="stats" style={{ marginBottom: 0 }}>
            <div className="stat">
              <div className="stat-value" style={{ color: "var(--green)", fontSize: 22 }}>{presentTotal}</div>
              <div className="stat-label">إجمالي حاضر</div>
            </div>
            <div className="stat">
              <div className="stat-value" style={{ color: "var(--red)", fontSize: 22 }}>{absentTotal}</div>
              <div className="stat-label">إجمالي غياب</div>
            </div>
            <div className="stat">
              <div className="stat-value" style={{ fontSize: 22 }}>{rate}%</div>
              <div className="stat-label">نسبة الحضور</div>
            </div>
            <div className="stat">
              <div className="stat-value" style={{ color: "var(--amber)", fontSize: 22 }}>{absentThisMonth}</div>
              <div className="stat-label">غيابات الشهر ده</div>
            </div>
          </div>
        </div>

        {/* ---------- محاضرات اليوم ---------- */}
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
                <Link className="btn-green btn-sm" href="/attendance" style={{ textDecoration: "none", color: "#fff" }}>
                  تسجيل الحضور
                </Link>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}