"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import {
  KEYS,
  useLocalState,
  migrateStudents,
  type AttendanceRecord,
  type Group,
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
  const [groups, setGroups] = useLocalState<Group[]>(KEYS.groups, []);
  const [students] = useLocalState<Student[]>(KEYS.students, [], migrateStudents);
  const [attendance] = useLocalState<AttendanceRecord[]>(KEYS.attendance, []);
  const [payments, setPayments] = useLocalState<Payment[]>(KEYS.payments, []);

  const [payFor, setPayFor] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [payDate, setPayDate] = useState(today());
  const [pNotes, setPNotes] = useState("");

  const addPayment = (e: React.FormEvent, groupId: string) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!payFor || !value || value <= 0) return;
    setPayments([
      ...payments,
      { id: uid(), groupId, date: payDate, amount: value, notes: pNotes.trim() || undefined },
    ]);
    setAmount("");
    setPNotes("");
    setPayFor(null);
  };

  const removePayment = (id: string) => {
    if (!confirm("حذف هذا الدفع؟")) return;
    setPayments(payments.filter((p) => p.id !== id));
  };

  const updateFee = (id: string, value: string) =>
    setGroups(
      groups.map((g) =>
        g.id === id
          ? { ...g, monthlyFee: parseFloat(value) > 0 ? parseFloat(value) : undefined }
          : g
      )
    );

  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);

  const rows = groups.map((g) => {
    const paid = payments
      .filter((p) => p.groupId === g.id)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const months = new Set(
      attendance.filter((a) => a.groupId === g.id).map((a) => monthOf(a.date))
    );
    const monthsCount = months.size;
    const feePerMonth = g.monthlyFee ?? 0;
    const due = feePerMonth * monthsCount;
    const balance = due - paid;
    const members = students.filter((s) => s.groupIds.includes(g.id));
    return {
      group: g,
      members,
      paid,
      monthsCount,
      months: [...months].sort().reverse(),
      feePerMonth,
      due,
      balance,
      payments: payments
        .filter((p) => p.groupId === g.id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    };
  });

  const dueTotal = rows.reduce((s, r) => s + r.due, 0);
  const balanceTotal = rows.reduce((s, r) => s + Math.max(r.balance, 0), 0);
  const showHint = groups.some((g) => !g.monthlyFee);

  return (
    <>
      <Nav />
      <main className="container">
        <h1 className="page-title">فلوس المجموعات 💰</h1>
        <p className="page-subtitle">فلوس كل مجموعة بالشهر: المستحق = (فلوس المجموعة × شهور المحاضرات) − المدفوع</p>

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
            <div className="stat-value">{groups.length}</div>
            <div className="stat-label">مجموعة</div>
          </div>
        </div>

        {showHint && (
          <div className="card" style={{ background: "var(--amber-bg)", borderColor: "#f0d9a8" }}>
            💡 <b>نصيحة:</b> حدد "فلوس المجموعة في الشهر" في صفحة المواعيد ليتم حساب المستحق تلقائيًا.
          </div>
        )}

        {groups.length === 0 ? (
          <div className="empty">
            لا توجد مجموعات بعد. <a href="/schedule" style={{ color: "var(--primary)" }}>أنشئ مجموعة من صفحة المواعيد</a>
          </div>
        ) : (
          rows.map((r) => (
            <div key={r.group.id} className="card">
              <div className="row">
                <div style={{ fontWeight: 800, fontSize: 16 }}>👥 {r.group.name}</div>
                <div className="row" style={{ gap: 10 }}>
                  <span className="muted">{r.members.length} تلميذ</span>
                  <span className={`chip ${r.balance <= 0 ? "chip-green" : "chip-red"}`}>
                    {r.balance <= 0 ? "سُددت بالكامل ✓" : `متبقي ${formatMoney(r.balance)}`}
                  </span>
                </div>
              </div>

              <div className="row" style={{ marginTop: 12 }}>
                <div className="field" style={{ minWidth: 200 }}>
                  <label>فلوس المجموعة في الشهر (ج.م)</label>
                  <input
                    type="number"
                    min="0"
                    dir="ltr"
                    value={r.group.monthlyFee ?? ""}
                    placeholder="بدون"
                    onChange={(e) => updateFee(r.group.id, e.target.value)}
                  />
                </div>
                <span className="muted" style={{ marginTop: 24 }}>
                  المدفوع: <b>{formatMoney(r.paid)}</b> من المستحق <b>{formatMoney(r.due)}</b>
                </span>
                <button
                  className="btn-primary btn-sm"
                  type="button"
                  style={{ marginTop: 24 }}
                  onClick={() => {
                    setPayFor(payFor === r.group.id ? null : r.group.id);
                    setAmount("");
                    setPNotes("");
                    setPayDate(today());
                  }}
                >
                  {payFor === r.group.id ? "إغلاق" : "➕ تسجيل دفع"}
                </button>
              </div>

              {r.monthsCount > 0 && (
                <div className="muted" style={{ marginTop: 8 }}>
                  شهور المحاضرات: {r.monthsCount} — {r.months.map((m) => formatMonth(m)).join("، ")}
                </div>
              )}

              {payFor === r.group.id && (
                <form className="pay-row" style={{ marginTop: 12, alignItems: "flex-end" }} onSubmit={(e) => addPayment(e, r.group.id)}>
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