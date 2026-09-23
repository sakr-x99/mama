"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import {
  KEYS,
  useLocalState,
  migrateStudents,
  type AttendanceRecord,
  type Payment,
  type Student,
  uid,
  today,
  monthOf,
  formatMonth,
  formatDate,
  formatMoney,
} from "@/lib/store";

export default function Fees() {
  const [students] = useLocalState<Student[]>(KEYS.students, [], migrateStudents);
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
    const months = new Set(
      attendance
        .filter((a) => a.studentId === s.id)
        .map((a) => monthOf(a.date))
    );
    const monthsCount = months.size;
    const feePerMonth = s.monthlyFee ?? 0;
    const due = feePerMonth * monthsCount;
    const balance = due - paid;
    return {
      student: s,
      paid,
      monthsCount,
      months: [...months].sort().reverse(),
      feePerMonth,
      due,
      balance,
      payments: payments
        .filter((p) => p.studentId === s.id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    };
  });

  const dueTotal = rows.reduce((s, r) => s + r.due, 0);
  const balanceTotal = rows.reduce((s, r) => s + Math.max(r.balance, 0), 0);
  const showHint = students.some((s) => !s.monthlyFee);

  return (
    <>
      <Nav />
      <main className="container">
        <h1 className="page-title">فلوس الدرس 💰</h1>
        <p className="page-subtitle">الفلوس بالشهر: المستحق = (رسوم الشهر × عدد الشهور اللي اتدرس فيها) − المدفوع</p>

        <div className="stats">
          <div className="stat">
            <div className="stat-value" style={{ color: "var(--green)" }}>{formatMoney(totalPaid)}</div>
            <div className="stat-label">إجمالي المحصَّل</div>
          </div>
          <div className="stat">
            <div className="stat-value" style={{ color: "var(--amber)" }}>{formatMoney(dueTotal)}</div>
            <div className="stat-label">إجمالي المستحق</div>
          </div>
          <div className="stat">
            <div className="stat-value" style={{ color: "var(--red)" }}>{formatMoney(balanceTotal)}</div>
            <div className="stat-label">إجمالي المتبقي</div>
          </div>
          <div className="stat">
            <div className="stat-value">{students.length}</div>
            <div className="stat-label">تلميذ</div>
          </div>
        </div>

        {showHint && (
          <div className="card" style={{ background: "var(--amber-bg)", borderColor: "#f0d9a8" }}>
            💡 <b>نصيحة:</b> حدد "رسوم الشهر" لكل تلميذ في صفحة التلاميذ ليتم حساب المستحق تلقائيًا.
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
                    شهور: <b>{r.monthsCount}</b>
                    {r.feePerMonth > 0 && <> · رسوم الشهر {formatMoney(r.feePerMonth)}</>}
                  </span>
                  <span className={`chip ${r.balance <= 0 ? "chip-green" : "chip-red"}`}>
                    {r.balance <= 0
                      ? `سُدد بالكامل ✓`
                      : `متبقي ${formatMoney(r.balance)}`}
                  </span>
                </div>
              </div>

              <div className="row" style={{ marginTop: 12 }}>
                <span className="muted">
                  المدفوع: <b>{formatMoney(r.paid)}</b> من المستحق <b>{formatMoney(r.due)}</b>
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

              {r.monthsCount > 0 && (
                <div className="muted" style={{ marginTop: 8 }}>
                  الشهور المحسوبة: {r.months.map((m) => formatMonth(m)).join("، ")}
                </div>
              )}

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