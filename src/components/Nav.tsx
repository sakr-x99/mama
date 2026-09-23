"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "الرئيسية" },
  { href: "/students", label: "التلاميذ" },
  { href: "/schedule", label: "المواعيد" },
  { href: "/attendance", label: "الحضور والغياب" },
  { href: "/fees", label: "فلوس الدرس" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="nav">
      <div className="nav-inner">
        <span className="nav-brand">📚 المدرّس</span>
        <nav className="nav-links">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link ${pathname === l.href ? "active" : ""}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}