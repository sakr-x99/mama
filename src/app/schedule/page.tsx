"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import {
  KEYS,
  useLocalState,
  type ScheduleItem,
  type Student,
  uid,
  today,
  formatDate,
} from "@/lib/store";

export default function Schedule() {
  const [students] = useLocalState<Student[]>(KEYS.students, []);
  const [schedule, setSchedule] = useLocalState<ScheduleItem[]>(KEYS.schedule, []);

  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(today());
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !date || !time) return;
    setSchedule([
      ...schedule,
      { id: uid(), studentId, date, time, notes: notes.trim() || undefined },
    ]);
    setTime("");
    setNotes("");
  };

  const remove = (id: string) => {
    if (!confirm("حذف هذا الموعد؟")) return;
    setSchedule(schedule.filter((s) => s.id !== id));
  };

  const sorted = [...schedule].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const groups: { date: string; items: ScheduleItem[] }[] = [];
  for (const item of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.date === item.date) last.items.push(item);
    else groups.push({ date: item.date, items: [item] });
  }

  return (
    <>
      <Nav />
      <main className="container">
        <h1 className="page-title">المواعيد 🗓️</h1>
        <p className="page-subtitle">حدد مواعيد الدروس لكل تلميذ</p>

        {students.length === 0 ? (
          <div className="empty">
            لا يوجد تلاميذ بعد. <a href="/students" style={{ color: "var(--primary)" }}>أضف تلاميذك أولاً</a>
          </div>
        ) : (
          <>
            <div className="card">
              <form onSubmit={add}>
                <div className="form-row">
                  <div className="field">
                    <label>التلميذ *</label>
                    <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
                      <option value="">اختر تلميذًا...</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>اليوم *</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label>الساعة *</label>
                    <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label>ملاحظات</label>
                    <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="اختياري" />
                  </div>
                </div>
                <button className="btn-primary" type="submit">➕ إضافة موعد</button>
              </form>
            </div>

            {groups.length === 0 ? (
              <div className="empty">لا توجد مواعيد مسجلة بعد</div>
            ) : (
              groups.map((g) => (
                <div key={g.date}>
                  <div className="group-title">📅 {formatDate(g.date)}</div>
                  {g.items.map((item) => {
                    const st = students.find((x) => x.id === item.studentId);
                    return (
                      <div key={item.id} className="list-item">
                        <div className="main">
                          <div style={{ fontWeight: 700 }}>
                            <span className="chip chip-amber">🕐 {item.time}</span>
                            {"  "}{st?.name ?? "تلميذ محذوف"}
                          </div>
                          {item.notes && <div className="muted">{item.notes}</div>}
                        </div>
                        <button className="btn-danger btn-sm" onClick={() => remove(item.id)}>🗑</button>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </>
        )}
      </main>
    </>
  );
}