"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MapPin,
  TrendingUp,
  Calendar,
  Bell,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/aurora", label: "Aurora", icon: MapPin },
  { href: "/forecast", label: "Forecast", icon: TrendingUp },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/alerts", label: "Alerts", icon: Bell },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-void-navy bg-deep-indigo/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 h-14">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-starlight hover:text-aurora-green transition-colors mr-6"
        >
          <img src="/logo-black.svg" alt="Aura logo" className="h-8 w-8" />
          <span className="font-display text-lg font-semibold">Aura</span>
        </Link>

        <div className="flex items-center gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-aurora-green/10 text-aurora-green"
                    : "text-faint-star hover:text-starlight hover:bg-void-navy/50",
                )}
              >
                <item.icon size={16} />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
