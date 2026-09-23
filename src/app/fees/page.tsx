"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import {
  KEYS,
  useLocalState,
  type AttendanceRecord,
  type Payment,
  type Student,
  uid,
  today,
  formatDate,
  formatMoney,
} from "@/lib/store";

export default function Fees() {
  const [students] = useLocalState<Student[]>(KEYS.students, []);
  const [attendance] = useLocalState<AttendanceRecord[]>(KEYS.attendance, []);
  const [payments, setPayments] = useLocalState<Payment[]>(KEYS.payments, []);

  const [payFor, setPayFor] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [payDate, setPayDate] = useState(today());
  const [pNotes, setPNotes] = useState("");

  const addPayment = (e: React.FormEvent, studentId: string) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!payFor || !value || value <= 0) return;
    setPayments([
      ...payments,
      { id: uid(), studentId, date: payDate, amount: value, notes: pNotes.trim() || undefined },
    ]);
    setAmount("");
    setPNotes("");
    setPayFor(null);
  };

  const removePayment = (id: string) => {
    if (!confirm("حذف هذا الدفع؟")) return;
    setPayments(payments.filter((p) => p.id !== id));
  };

  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);

  const rows = students.map((s) => {
    const paid = payments
      .filter((p) => p.studentId === s.id)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const attended = attendance.filter(
      (a) => a.studentId === s.id && a.status === "present"
    ).length;
    const cost = s.costPerLesson ?? 0;
    const due = cost * attended;
    const balance = due - paid;
    return { student: s as Student, paid, attended, cost, balance, payments: payments.filter((p) => p.studentId === s.id).sort((a, b) => b.date.localeCompare(a.date)) };
  });

  const showHint = students.some((s) => !s.costPerLesson);

  return (
    <>
      <Nav />
      <main className="container">
        <h1 className="page-title">فلوس الدرس 💰</h1>
        <p className="page-subtitle">سجّل الدفعات، والحساب يتم تلقائيًا حسب الحضور وسعر الدرس</p>

        <div className="stats">
          <div className="stat">
            <div className="stat-value" style={{ color: "var(--green)" }}>{formatMoney(totalPaid)}</div>
            <div className="stat-label">إجمالي المحصَّل</div>
          </div>
          <div className="stat">
            <div className="stat-value">{students.length}</div>
            <div className="stat-label">تلميذ</div>
          </div>
          <div className="stat">
            <div className="stat-value">
              {formatMoney(rows.reduce((s, r) => s + Math.max(r.balance, 0), 0))}
            </div>
            <div className="stat-label">مستحق (المتبقي)</div>
          </div>
        </div>

        {showHint && (
          <div className="card" style={{ background: "var(--amber-bg)", borderColor: "#f0d9a8" }}>
            💡 <b>نصيحة:</b> حدد "سعر الدرس" لكل تلميذ في صفحة التلاميذ ليتم حساب المتبقي تلقائيًا.
          </div>
        )}

        {students.length === 0 ? (
          <div className="empty">
            لا يوجد تلاميذ بعد. <a href="/students" style={{ color: "var(--primary)" }}>أضف تلاميذك أولاً</a>
          </div>
        ) : (
          rows.map((r) => (
            <div key={r.student.id} className="card">
              <div className="row">
                <div style={{ fontWeight: 800, fontSize: 16 }}>{r.student.name}</div>
                <div className="row" style={{ gap: 10 }}>
                  <span className="muted">
                    دروس حضرها: <b>{r.attended}</b>
                    {r.cost > 0 && <> · سعر الدرس {formatMoney(r.cost)}</>}
                  </span>
                  <span className={`chip ${r.balance <= 0 ? "chip-green" : "chip-red"}`}>
                    {r.balance <= 0 ? `مدفوع ✓ (المتبقي ${formatMoney(0)})` : `متبقي ${formatMoney(r.balance)}`}
                  </span>
                </div>
              </div>

              <div className="row" style={{ marginTop: 12 }}>
                <span className="muted">
                  دفعاته: <b>{formatMoney(r.paid)}</b>
                </span>
                <button
                  className="btn-primary btn-sm"
                  type="button"
                  onClick={() => {
                    setPayFor(payFor === r.student.id ? null : r.student.id);
                    setAmount("");
                    setPNotes("");
                    setPayDate(today());
                  }}
                >
                  {payFor === r.student.id ? "إغلاق" : "➕ تسجيل دفع"}
                </button>
              </div>

              {payFor === r.student.id && (
                <form className="pay-row" style={{ marginTop: 12, alignItems: "flex-end" }} onSubmit={(e) => addPayment(e, r.student.id)}>
                  <div className="field">
                    <label>الدفع (ج.م) *</label>
                    <input
                      type="number"
                      min="1"
                      dir="ltr"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="field">
                    <label>اليوم</label>
                    <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>ملاحظات</label>
                    <input value={pNotes} onChange={(e) => setPNotes(e.target.value)} placeholder="اختياري" />
                  </div>
                  <button className="btn-green" type="submit">حفظ 💵</button>
                </form>
              )}

              {r.payments.length > 0 && (
                <details>
                  <summary>سجل الدفعات ({r.payments.length})</summary>
                  <div className="table-wrap" style={{ marginTop: 8 }}>
                    <table>
                      <thead>
                        <tr><th>اليوم</th><th>المبلغ</th><th>ملاحظات</th><th></th></tr>
                      </thead>
                      <tbody>
                        {r.payments.map((p) => (
                          <tr key={p.id}>
                            <td>{formatDate(p.date)}</td>
                            <td style={{ fontWeight: 700, color: "var(--green)" }}>{formatMoney(p.amount)}</td>
                            <td className="muted">{p.notes ?? "—"}</td>
                            <td><button className="btn-danger btn-sm" onClick={() => removePayment(p.id)}>🗑</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </div>
          ))
        )}
      </main>
    </>
  );
}