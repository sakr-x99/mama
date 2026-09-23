"use client";

import { useEffect, useState } from "react";

export type Student = {
  id: string;
  name: string;
  phone?: string;
  monthlyFee?: number;
};

export type ScheduleItem = {
  id: string;
  studentId: string;
  date: string;
  time: string;
  notes?: string;
};

export type AttendanceRecord = {
  id: string;
  studentId: string;
  date: string;
  status: "present" | "absent";
};

export type Payment = {
  id: string;
  studentId: string;
  date: string;
  amount: number;
  notes?: string;
};

export type Status = "present" | "absent";

export const KEYS = {
  students: "mama_students",
  schedule: "mama_schedule",
  attendance: "mama_attendance",
  payments: "mama_payments",
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
    monthlyFee:
      typeof s.monthlyFee === "number"
        ? s.monthlyFee
        : typeof s.costPerLesson === "number"
          ? (s.costPerLesson as number)
          : undefined,
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