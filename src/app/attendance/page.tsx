"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import {
  KEYS,
  useLocalState,
  type AttendanceRecord,
  type Status,
  type Student,
  uid,
  today,
  formatDate,
} from "@/lib/store";

export default function Attendance() {
  const [students] = useLocalState<Student[]>(KEYS.students, []);
  const [attendance, setAttendance] = useLocalState<AttendanceRecord[]>(KEYS.attendance, []);
  const [date, setDate] = useState(today());

  const recordsForDate = (d: string) =>
    Object.fromEntries(
      attendance.filter((a) => a.date === d).map((a) => [a.studentId, a.status])
    );

  const setStatus = (studentId: string, status: Status) => {
    const existing = attendance.find((a) => a.studentId === studentId && a.date === date);
    if (existing) {
      if (existing.status === status) {
        setAttendance(attendance.filter((a) => a.id !== existing.id));
      } else {
        setAttendance(
          attendance.map((a) =>
            a.id === existing.id ? { ...a, status } : a
          )
        );
      }
    } else {
      setAttendance([...attendance, { id: uid(), studentId, date, status }]);
    }
  };

  const summary = students.reduce(
    (acc, s) => {
      const st = recordsForDate(date)[s.id];
      if (st === "present") acc.present++;
      else if (st === "absent") acc.absent++;
      else acc.unrecorded++;
      return acc;
    },
    { present: 0, absent: 0, unrecorded: 0 }
  );

  return (
    <>
      <Nav />
      <main className="container">
        <h1 className="page-title">الحضور والغياب ✅</h1>
        <p className="page-subtitle">اضغط على "حاضر" أو "غائب" لكل تلميذ</p>

        {students.length === 0 ? (
          <div className="empty">
            لا يوجد تلاميذ بعد. <a href="/students" style={{ color: "var(--primary)" }}>أضف تلاميذك أولاً</a>
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
                  <div className="muted" style={{ marginBottom: 6 }}>{formatDate(date)}</div>
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
              </div>
            </div>

            <div className="card">
              {students.map((s) => {
                const st = recordsForDate(date)[s.id];
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
                        onClick={() => setStatus(s.id, "present")}
                      >
                        ✅ حاضر
                      </button>
                      <button
                        className={`${st === "absent" ? "btn-danger" : "btn-ghost"} btn-sm`}
                        onClick={() => setStatus(s.id, "absent")}
                      >
                        غائب
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </>
  );
}