"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import {
  KEYS,
  useLocalState,
  migrateStudents,
  type Group,
  type Student,
  uid,
} from "@/lib/store";

export default function Students() {
  const [students, setStudents] = useLocalState<Student[]>(KEYS.students, [], migrateStudents);
  const [groups] = useLocalState<Group[]>(KEYS.groups, []);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickedGroups, setPickedGroups] = useState<string[]>([]);
  const [addStudentTo, setAddStudentTo] = useState<string>("");

  const togglePicked = (id: string) =>
    setPickedGroups((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

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
        groupIds: pickedGroups,
      },
    ]);
    setName("");
    setPhone("");
    setPickedGroups([]);
  };

  const remove = (id: string) => {
    if (!confirm("هل تريد حذف هذا التلميذ؟")) return;
    setStudents(students.filter((s) => s.id !== id));
  };

  const addToGroup = (studentId: string, groupId: string) => {
    if (!groupId) return;
    setStudents(
      students.map((s) =>
        s.id === studentId
          ? { ...s, groupIds: s.groupIds.includes(groupId) ? s.groupIds : [...s.groupIds, groupId] }
          : s
      )
    );
    setAddStudentTo("");
  };

  const removeFromGroup = (studentId: string, groupId: string) =>
    setStudents(
      students.map((s) =>
        s.id === studentId
          ? { ...s, groupIds: s.groupIds.filter((g) => g !== groupId) }
          : s
      )
    );

  const availableGroupsFor = (s: Student) =>
    groups.filter((g) => !s.groupIds.includes(g.id));

  const groupName = (id: string) => groups.find((g) => g.id === id)?.name ?? "مجموعة محذوفة";

  return (
    <>
      <Nav />
      <main className="container">
        <h1 className="page-title">التلاميذ 📋</h1>
        <p className="page-subtitle">أدخل اسم التلميذ وسجّله في مجموعاته (يقدر يبقى في أكتر من مجموعة)</p>

        <div className="card">
          <form onSubmit={addStudent}>
            <div className="form-row">
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
            </div>

            <div style={{ marginBottom: 14 }}>
              <div className="field">
                <label>المجموعات</label>
                {groups.length === 0 ? (
                  <div className="muted">لا توجد مجموعات بعد — أنشئها من صفحة <a href="/schedule" style={{ color: "var(--primary)" }}>المواعيد</a></div>
                ) : (
                  <div className="row" style={{ justifyContent: "flex-start", gap: 12, alignItems: "center" }}>
                    {groups.map((g) => (
                      <label key={g.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={pickedGroups.includes(g.id)}
                          onChange={() => togglePicked(g.id)}
                          style={{ width: "auto" }}
                        />
                        {g.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button className="btn-primary" type="submit">➕ إضافة التلميذ</button>
          </form>
        </div>

        {students.length === 0 ? (
          <div className="empty">لا يوجد تلاميذ بعد. ابدأ بإضافة أول تلميذ أعلاه ↑</div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table className="responsive">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>الاسم</th>
                    <th>الهاتف</th>
                    <th>المجموعات</th>
                    <th style={{ width: 170 }}>إضافة لمجموعة</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.id}>
                      <td data-label="#"><span className="muted">{i + 1}</span></td>
                      <td data-label="الاسم" style={{ fontWeight: 700 }}>{s.name}</td>
                      <td data-label="الهاتف" dir="ltr">{s.phone ? (
                        <a href={`tel:${s.phone}`} style={{ color: "var(--primary)" }}>{s.phone}</a>
                      ) : "—"}</td>
                      <td data-label="المجموعات">
                        {s.groupIds.length === 0 && <span className="muted">بدون مجموعة</span>}
                        {s.groupIds.map((gid) => (
                          <span key={gid} className="chip chip-green" style={{ marginInlineEnd: 6 }}>
                            {groupName(gid)}{" "}
                            <span
                              role="button"
                              style={{ cursor: "pointer", marginInlineStart: 4 }}
                              onClick={() => removeFromGroup(s.id, gid)}
                              title="إزالة من المجموعة"
                            >
                              ✕
                            </span>
                          </span>
                        ))}
                      </td>
                      <td data-label="إضافة">
                        {availableGroupsFor(s).length > 0 && (
                          <select value={addStudentTo} onChange={(e) => addToGroup(s.id, e.target.value)}>
                            <option value="">إضافة...</option>
                            {availableGroupsFor(s).map((g) => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td data-label="">
                        <button className="btn-danger btn-sm" onClick={() => remove(s.id)}>🗑 حذف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="muted" style={{ marginTop: 10 }}>
              إجمالي التلاميذ: <b>{students.length}</b> · المجموعات: <b>{groups.length}</b> — كل البيانات تُحفظ تلقائيًا على جهازك
            </div>
          </div>
        )}
      </main>
    </>
  );
}