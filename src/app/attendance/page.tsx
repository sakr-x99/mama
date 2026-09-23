"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import {
  KEYS,
  useLocalState,
  migrateStudents,
  type AttendanceRecord,
  type Group,
  type Status,
  type Student,
  uid,
  today,
  weekdayOf,
  dayName,
  formatDate,
  groupSessions,
} from "@/lib/store";

export default function Attendance() {
  const [groups] = useLocalState<Group[]>(KEYS.groups, []);
  const [students] = useLocalState<Student[]>(KEYS.students, [], migrateStudents);
  const [attendance, setAttendance] = useLocalState<AttendanceRecord[]>(KEYS.attendance, []);
  const [date, setDate] = useState(today());

  const weekday = weekdayOf(date);

  const recordsForDate = (d: string) =>
    Object.fromEntries(
      attendance.filter((a) => a.date === d).map((a) => [`${a.groupId}|${a.studentId}`, a.status])
    );

  const setStatus = (groupId: string, studentId: string, status: Status) => {
    const existing = attendance.find(
      (a) => a.groupId === groupId && a.studentId === studentId && a.date === date
    );
    if (existing) {
      if (existing.status === status) {
        setAttendance(attendance.filter((a) => a.id !== existing.id));
      } else {
        setAttendance(
          attendance.map((a) => (a.id === existing.id ? { ...a, status } : a))
        );
      }
    } else {
      setAttendance([...attendance, { id: uid(), groupId, studentId, date, status }]);
    }
  };

  const daysGroups = groups.filter((g) => g.sessions.some((s) => s.day === weekday));

  const studentsInGroup = (g: Group) =>
    students.filter((s) => s.groupIds.includes(g.id));

  const summary = daysGroups.reduce(
    (acc, g) => {
      for (const s of studentsInGroup(g)) {
        const st = recordsForDate(date)[`${g.id}|${s.id}`];
        if (st === "present") acc.present++;
        else if (st === "absent") acc.absent++;
        else acc.unrecorded++;
      }
      return acc;
    },
    { present: 0, absent: 0, unrecorded: 0, students: 0 }
  );
  summary.students = Object.keys(recordsForDate(date)).length;

  return (
    <>
      <Nav />
      <main className="container">
        <h1 className="page-title">الحضور والغياب ✅</h1>
        <p className="page-subtitle">الحضور بيتسجّل حسب مواعيد المجموعة في اليوم المختار</p>

        {groups.length === 0 ? (
          <div className="empty">
            لا توجد مجموعات بعد. <a href="/schedule" style={{ color: "var(--primary)" }}>أنشئ مجموعة ومواعيدها أولاً</a>
          </div>
        ) : (
          <>
            <div className="card">
              <div className="row">
                <div>
                  <div className="muted" style={{ marginBottom: 6 }}>اختر اليوم</div>
                  <div className="row" style={{ gap: 10 }}>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      style={{ width: "auto" }}
                    />
                    {date !== today() && (
                      <button className="btn-ghost btn-sm" onClick={() => setDate(today())}>اليوم</button>
                    )}
                  </div>
                </div>
                <div>
                  <div className="muted">{formatDate(date)}</div>
                  <div className="chip chip-amber" style={{ marginTop: 6 }}>اليوم: {dayName(weekday)}</div>
                </div>
              </div>

              <div className="stats" style={{ marginBottom: 0, marginTop: 16 }}>
                <div className="stat">
                  <div className="stat-value" style={{ color: "var(--green)" }}>{summary.present}</div>
                  <div className="stat-label">✅ حاضر</div>
                </div>
                <div className="stat">
                  <div className="stat-value" style={{ color: "var(--red)" }}>{summary.absent}</div>
                  <div className="stat-label">غائب</div>
                </div>
                <div className="stat">
                  <div className="stat-value" style={{ color: "var(--amber)" }}>{summary.unrecorded}</div>
                  <div className="stat-label">لم يُسجَّل</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{summary.students}</div>
                  <div className="stat-label">سجل له اليوم</div>
                </div>
              </div>
            </div>

            {daysGroups.length === 0 ? (
              <div className="empty">
                لا توجد محاضرات في يوم {dayName(weekday)}. حدد مواعيد المجموعات من صفحة{" "}
                <a href="/schedule" style={{ color: "var(--primary)" }}>المواعيد</a>
              </div>
            ) : (
              daysGroups.map((g) => {
                const members = studentsInGroup(g);
                const times = groupSessions(g)
                  .filter((s) => s.day === weekday)
                  .map((s) => s.time);
                return (
                  <div className="card" key={g.id}>
                    <div className="row" style={{ marginBottom: 10 }}>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>👥 {g.name}</div>
                      <div className="row" style={{ gap: 8 }}>
                        {times.map((t) => (
                          <span key={t} className="chip chip-amber">🕐 {t}</span>
                        ))}
                        <span className="muted">{members.length} تلميذ</span>
                      </div>
                    </div>

                    {members.length === 0 ? (
                      <div className="muted">لا توجد تلاميذ مسجلين في هذه المجموعة. سجّلهم من صفحة <a href="/students" style={{ color: "var(--primary)" }}>التلاميذ</a></div>
                    ) : (
                      members.map((s) => {
                        const st = recordsForDate(date)[`${g.id}|${s.id}`];
                        return (
                          <div key={s.id} className="list-item">
                            <div className="main">
                              <span style={{ fontWeight: 700 }}>{s.name}</span>
                              {st === "present" && <span className="chip chip-green" style={{ marginInlineStart: 8 }}>حاضر</span>}
                              {st === "absent" && <span className="chip chip-red" style={{ marginInlineStart: 8 }}>غائب</span>}
                            </div>
                            <div className="row" style={{ gap: 8 }}>
                              <button
                                className={`${st === "present" ? "btn-green" : "btn-ghost"} btn-sm`}
                                onClick={() => setStatus(g.id, s.id, "present")}
                              >
                                ✅ حاضر
                              </button>
                              <button
                                className={`${st === "absent" ? "btn-danger" : "btn-ghost"} btn-sm`}
                                onClick={() => setStatus(g.id, s.id, "absent")}
                              >
                                غائب
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </main>
    </>
  );
}