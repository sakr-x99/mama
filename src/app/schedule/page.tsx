"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import {
  KEYS,
  useLocalState,
  type Group,
  type GroupSession,
  uid,
  WEEK_ORDER,
  DAY_NAMES,
  dayName,
} from "@/lib/store";

function SessionTime({ day, time }: { day: number; time: string }) {
  return (
    <span className="chip chip-amber" style={{ marginInlineEnd: 6, marginBottom: 4 }}>
      {dayName(day)} · {time}
    </span>
  );
}

export default function Schedule() {
  const [groups, setGroups] = useLocalState<Group[]>(KEYS.groups, []);

  const [name, setName] = useState("");
  const [fee, setFee] = useState("");
  const [day, setDay] = useState("6");
  const [time, setTime] = useState("");
  const [draft, setDraft] = useState<GroupSession[]>([]);

  const pushDraft = () => {
    if (!time) return;
    setDraft([...draft, { id: uid(), day: +day, time }]);
    setTime("");
  };

  const removeDraft = (id: string) =>
    setDraft(draft.filter((d) => d.id !== id));

  const createGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setGroups([
      ...groups,
      {
        id: uid(),
        name: name.trim(),
        monthlyFee: parseFloat(fee) > 0 ? parseFloat(fee) : undefined,
        sessions: draft,
      },
    ]);
    setName("");
    setFee("");
    setDraft([]);
    setTime("");
  };

  const addSession = (groupId: string, sessDay: string, sessTime: string) => {
    if (!sessTime) return;
    setGroups(
      groups.map((g) =>
        g.id === groupId
          ? { ...g, sessions: [...g.sessions, { id: uid(), day: +sessDay, time: sessTime }] }
          : g
      )
    );
  };

  const removeSession = (groupId: string, sessionId: string) =>
    setGroups(
      groups.map((g) =>
        g.id === groupId
          ? { ...g, sessions: g.sessions.filter((s) => s.id !== sessionId) }
          : g
      )
    );

  const removeGroup = (id: string) => {
    if (!confirm("حذف هذه المجموعة؟ لن تُحذف بيانات التلاميذ.")) return;
    setGroups(groups.filter((g) => g.id !== id));
  };

  const updateFee = (id: string, value: string) =>
    setGroups(
      groups.map((g) =>
        g.id === id
          ? { ...g, monthlyFee: parseFloat(value) > 0 ? parseFloat(value) : undefined }
          : g
      )
    );

  const dayOptions = (
    <>
      {WEEK_ORDER.map((d) => (
        <option key={d} value={d}>{dayName(d)}</option>
      ))}
    </>
  );

  return (
    <>
      <Nav />
      <main className="container">
        <h1 className="page-title">مواعيد المجموعات 🗓️</h1>
        <p className="page-subtitle">أدخل اسم المجموعة، وحدد مواعيدها (أكتر من معاد ممكن)، وفلوسها الشهرية</p>

        <div className="card">
          <form onSubmit={createGroup}>
            <div className="form-row">
              <div className="field">
                <label>اسم المجموعة *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: صف ثالث ابتدائي - أ"
                  required
                />
              </div>
              <div className="field">
                <label>فلوس المجموعة في الشهر (ج.م)</label>
                <input
                  type="number"
                  min="0"
                  dir="ltr"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  placeholder="اختياري"
                />
              </div>
            </div>

            <div className="card-title" style={{ marginTop: 8 }}>معاد للمجموعة</div>
            <div className="form-row" style={{ marginBottom: 10 }}>
              <div className="field" style={{ minWidth: 130, flex: 0 }}>
                <label>اليوم</label>
                <select value={day} onChange={(e) => setDay(e.target.value)}>
                  {dayOptions}
                </select>
              </div>
              <div className="field" style={{ minWidth: 130, flex: 0 }}>
                <label>الساعة</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button type="button" className="btn-ghost" onClick={pushDraft}>+ أضف للموعد</button>
              </div>
            </div>

            {draft.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                {draft.map((d) => (
                  <span key={d.id}>
                    <SessionTime day={d.day} time={d.time} />{" "}
                    <button type="button" className="btn-danger btn-sm" onClick={() => removeDraft(d.id)}>✕</button>
                  </span>
                ))}
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={!name.trim()}>
              ➕ إنشاء مجموعة
            </button>
          </form>
        </div>

        {groups.length === 0 ? (
          <div className="empty">لا توجد مجموعات بعد. أنشئ أول مجموعة أعلاه ↑</div>
        ) : (
          groups.map((g) => (
            <GroupCard
              key={g.id}
              group={g}
              onAddSession={addSession}
              onRemoveSession={removeSession}
              onRemoveGroup={removeGroup}
              onUpdateFee={updateFee}
            />
          ))
        )}
      </main>
    </>
  );
}

function GroupCard({
  group,
  onAddSession,
  onRemoveSession,
  onRemoveGroup,
  onUpdateFee,
}: {
  group: Group;
  onAddSession: (groupId: string, day: string, time: string) => void;
  onRemoveSession: (groupId: string, sessionId: string) => void;
  onRemoveGroup: (id: string) => void;
  onUpdateFee: (id: string, value: string) => void;
}) {
  const [addDay, setAddDay] = useState("6");
  const [addTime, setAddTime] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const sorted = [...group.sessions].sort((a, b) => {
    const ai = WEEK_ORDER.indexOf(a.day);
    const bi = WEEK_ORDER.indexOf(b.day);
    if (ai !== bi) return ai - bi;
    return a.time.localeCompare(b.time);
  });

  return (
    <div className="card">
      <div className="row">
        <div style={{ fontWeight: 800, fontSize: 16 }}>👥 {group.name}</div>
        <div className="row" style={{ gap: 10 }}>
          <label className="muted" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            فلوس الشهر
            <input
              type="number"
              min="0"
              dir="ltr"
              style={{ width: 110 }}
              value={group.monthlyFee ?? ""}
              placeholder="بدون"
              onChange={(e) => onUpdateFee(group.id, e.target.value)}
            />
          </label>
          <button className="btn-primary btn-sm" type="button" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? "إغلاق" : "➕ معاد جديد"}
          </button>
          <button className="btn-danger btn-sm" type="button" onClick={() => onRemoveGroup(group.id)}>🗑 حذف</button>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        {sorted.map((s) => (
          <span key={s.id}>
            <SessionTime day={s.day} time={s.time} />{" "}
            <button
              type="button"
              className="btn-danger btn-sm"
              onClick={() => onRemoveSession(group.id, s.id)}
            >
              ✕
            </button>
          </span>
        ))}
        {sorted.length === 0 && (
          <div className="muted">لا توجد مواعيد بعد — أضف معادًا</div>
        )}
      </div>

      {showAdd && (
        <div className="form-row" style={{ marginTop: 12, alignItems: "flex-end" }}>
          <div className="field" style={{ minWidth: 130, flex: 0 }}>
            <label>اليوم</label>
            <select value={addDay} onChange={(e) => setAddDay(e.target.value)}>
              {WEEK_ORDER.map((d) => (
                <option key={d} value={d}>{DAY_NAMES[d]}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ minWidth: 130, flex: 0 }}>
            <label>الساعة</label>
            <input type="time" value={addTime} onChange={(e) => setAddTime(e.target.value)} />
          </div>
          <button
            type="button"
            className="btn-green"
            disabled={!addTime}
            onClick={() => {
              onAddSession(group.id, addDay, addTime);
              setAddTime("");
            }}
          >
            حفظ
          </button>
        </div>
      )}
    </div>
  );
}