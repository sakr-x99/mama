"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import {
  KEYS,
  useLocalState,
  migrateStudents,
  type Student,
  uid,
} from "@/lib/store";

export default function Students() {
  const [students, setStudents] = useLocalState<Student[]>(KEYS.students, [], migrateStudents);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fee, setFee] = useState("");

  const addStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setStudents([
      ...students,
      {
        id: uid(),
        name: trimmed,
        phone: phone.trim() || undefined,
        monthlyFee: parseFloat(fee) > 0 ? parseFloat(fee) : undefined,
      },
    ]);
    setName("");
    setPhone("");
    setFee("");
  };

  const remove = (id: string) => {
    if (!confirm("هل تريد حذف هذا التلميذ؟")) return;
    setStudents(students.filter((s) => s.id !== id));
  };

  const updateFee = (id: string, value: string) => {
    setStudents(
      students.map((s) =>
        s.id === id
          ? { ...s, monthlyFee: parseFloat(value) > 0 ? parseFloat(value) : undefined }
          : s
      )
    );
  };

  return (
    <>
      <Nav />
      <main className="container">
        <h1 className="page-title">التلاميذ</h1>
        <p className="page-subtitle">أدخل أسماء تلاميذك، ويمكنك إضافة رقم الوالدين ورسوم الشهر اختياريًا</p>

        <div className="card">
          <form className="form-row" onSubmit={addStudent}>
            <div className="field">
              <label>اسم التلميذ *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أحمد محمد"
                required
              />
            </div>
            <div className="field">
              <label>رقم الهاتف</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="اختياري"
                dir="ltr"
              />
            </div>
            <div className="field">
              <label>رسوم الشهر (ج.م)</label>
              <input
                type="number"
                min="0"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="اختياري"
                dir="ltr"
              />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button className="btn-primary" type="submit">➕ إضافة</button>
            </div>
          </form>
        </div>

        {students.length === 0 ? (
          <div className="empty">لا يوجد تلاميذ بعد. ابدأ بإضافة أول تلميذ أعلاه ↑</div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>الاسم</th>
                    <th>الهاتف</th>
                    <th>رسوم الشهر</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.id}>
                      <td className="muted">{i + 1}</td>
                      <td style={{ fontWeight: 700 }}>{s.name}</td>
                      <td dir="ltr">{s.phone ? (
                        <a href={`tel:${s.phone}`} style={{ color: "var(--primary)" }}>{s.phone}</a>
                      ) : "—"}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          dir="ltr"
                          style={{ width: 110 }}
                          value={s.monthlyFee ?? ""}
                          placeholder="بدون"
                          onChange={(e) => updateFee(s.id, e.target.value)}
                        />
                      </td>
                      <td>
                        <button className="btn-danger btn-sm" onClick={() => remove(s.id)}>🗑 حذف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="muted" style={{ marginTop: 10 }}>
              إجمالي التلاميذ: <b>{students.length}</b> — والمدفوعات كلها تُحفظ تلقائيًا على جهازك
              {students.some((s) => s.monthlyFee) && ` · رسوم الشهر تُستخدم لحساب المستحقات في صفحة الفلوس`}
            </div>
          </div>
        )}
      </main>
    </>
  );
}