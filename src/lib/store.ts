"use client";

import { useEffect, useState } from "react";

export type Status = "present" | "absent";

export type GroupSession = {
  id: string;
  day: number;
  time: string;
};

export type Group = {
  id: string;
  name: string;
  monthlyFee?: number;
  sessions: GroupSession[];
};

export type Student = {
  id: string;
  name: string;
  phone?: string;
  groupIds: string[];
};

export type AttendanceRecord = {
  id: string;
  groupId: string;
  studentId: string;
  date: string;
  status: Status;
};

export type Payment = {
  id: string;
  groupId: string;
  date: string;
  amount: number;
  notes?: string;
};

export const KEYS = {
  groups: "mama_groups",
  students: "mama_students",
  attendance: "mama_attendance_v2",
  payments: "mama_payments_v2",
} as const;

export function useLocalState<T>(key: string, initial: T, migrate?: (raw: unknown) => T) {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(migrate ? migrate(JSON.parse(raw)) : (JSON.parse(raw) as T));
    } catch {
      /* ignore */
    }
  }, [key]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);

  return [value, setValue] as const;
}

export const migrateStudents = (raw: unknown): Student[] =>
  (raw as Array<Record<string, unknown>>).map((s) => ({
    id: String(s.id),
    name: String(s.name),
    phone: typeof s.phone === "string" ? s.phone : undefined,
    groupIds: Array.isArray(s.groupIds)
      ? (s.groupIds as string[])
      : (s.groupId ? [String(s.groupId)] : []),
  }));

export const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

export const today = () => new Date().toISOString().slice(0, 10);

export const monthOf = (date: string) => date.slice(0, 7);

export const formatMonth = (ym: string) => {
  try {
    const [y, m] = ym.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("ar-EG", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return ym;
  }
};

export const formatDate = (iso: string) => {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
};

export const formatMoney = (n: number) =>
  `${n.toLocaleString("ar-EG")} ج.م`;

export const DAY_NAMES = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

export const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];

export const dayName = (d: number) => DAY_NAMES[d] ?? String(d);

export const weekdayOf = (date: string) =>
  new Date(date + "T00:00:00").getDay();

export const todayWeekday = () => weekdayOf(today());

export const sessionsOfGroupOnWeekday = (g: Group, weekday: number) =>
  g.sessions.filter((s) => s.day === weekday);

export const groupSessions = (g: Group) =>
  [...g.sessions].sort((a, b) => {
    const ai = WEEK_ORDER.indexOf(a.day);
    const bi = WEEK_ORDER.indexOf(b.day);
    if (ai !== bi) return ai - bi;
    return a.time.localeCompare(b.time);
  });