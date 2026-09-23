"use client";

import { useEffect, useState } from "react";

export type Student = {
  id: string;
  name: string;
  phone?: string;
  costPerLesson?: number;
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

export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
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

export const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

export const today = () => new Date().toISOString().slice(0, 10);

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