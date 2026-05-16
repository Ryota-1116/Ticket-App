"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/actions/auth";

const navItems = [
  { href: "/host/events", label: "イベント一覧", icon: "📋" },
  { href: "/host/invite-codes", label: "招待コード", icon: "🔑" },
];

export function HostNav({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 h-14">
        <Link href="/host/events" className="font-bold text-gray-900 text-base">
          🎟 チケット管理
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {userName && (
            <span className="hidden sm:block text-sm text-gray-500">{userName}</span>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="hidden sm:block text-sm text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              ログアウト
            </button>
          </form>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="メニュー"
          >
            <span className="block w-5 h-0.5 bg-gray-600 mb-1" />
            <span className="block w-5 h-0.5 bg-gray-600 mb-1" />
            <span className="block w-5 h-0.5 bg-gray-600" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-200 bg-white px-4 py-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium ${
                pathname.startsWith(item.href)
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.icon} {item.label}
            </Link>
          ))}
          {userName && (
            <p className="px-3 py-1 text-xs text-gray-400">{userName}</p>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50"
            >
              ログアウト
            </button>
          </form>
        </div>
      )}
    </header>
  );
}

export function EventSubNav({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const pathname = usePathname();
  const base = `/host/events/${eventId}`;

  const tabs = [
    { href: base, label: "概要" },
    { href: `${base}/tickets`, label: "チケット" },
    { href: `${base}/attendees`, label: "参加者" },
    { href: `${base}/checkin`, label: "チェックイン" },
    { href: `${base}/promo-codes`, label: "プロモ" },
    { href: `${base}/expenses`, label: "経費" },
    { href: `${base}/refunds`, label: "返金" },
  ];

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-4 pt-3 pb-0">
        <p className="text-xs text-gray-500 mb-1 truncate">{eventTitle}</p>
        <div className="flex gap-0 overflow-x-auto -mb-px scrollbar-none">
          {tabs.map((tab) => {
            const isActive =
              tab.href === base
                ? pathname === base || pathname === `${base}/edit`
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`shrink-0 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
