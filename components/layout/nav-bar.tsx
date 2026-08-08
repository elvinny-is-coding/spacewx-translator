"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MapPin,
  TrendingUp,
  Calendar,
  Bell,
  Satellite,
  GraduationCap,
  CalendarDays,
} from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Overview",
    icon: LayoutDashboard,
    ariaLabel: "Overview Dashboard",
  },
  { href: "/aurora", label: "Aurora", icon: MapPin, ariaLabel: "Aurora Map" },
  {
    href: "/forecast",
    label: "Forecast",
    icon: TrendingUp,
    ariaLabel: "Forecast Charts",
  },
  {
    href: "/events",
    label: "Events",
    icon: Calendar,
    ariaLabel: "Event Timeline",
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: CalendarDays,
    ariaLabel: "Aurora Calendar",
  },
  { href: "/alerts", label: "Alerts", icon: Bell, ariaLabel: "Active Alerts" },
  {
    href: "/ops",
    label: "Operations",
    icon: Satellite,
    ariaLabel: "Operations Center",
  },
  {
    href: "/classroom",
    label: "Classroom",
    icon: GraduationCap,
    ariaLabel: "Mission Control Classroom",
  },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav
      className="border-b border-void-navy bg-deep-indigo/80 backdrop-blur-sm sticky top-0 z-50"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 h-14">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-starlight hover:text-aurora-green transition-colors mr-6 focus:outline-none focus:ring-2 focus:ring-aurora-green focus:ring-offset-2 focus:ring-offset-void-navy rounded"
          aria-label="Aura Home"
        >
          <Image
            src="/logo-black.svg"
            alt="Aura logo"
            width={32}
            height={32}
            priority
            className="dark:hidden"
          />
          <Image
            src="/logo-white.svg"
            alt="Aura logo"
            width={32}
            height={32}
            priority
            className="hidden dark:block"
          />
          <span className="font-display text-lg font-semibold">Aura</span>
        </Link>

        <div className="flex items-center gap-1 overflow-x-auto" role="menubar">
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
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[44px] min-h-[44px] touch-manipulation",
                  isActive
                    ? "bg-aurora-green/10 text-aurora-green border border-aurora-green/30"
                    : "text-faint-star hover:text-starlight hover:bg-void-navy/50 focus:outline-none focus:ring-2 focus:ring-aurora-green/50 focus:ring-offset-2 focus:ring-offset-void-navy",
                )}
                role="menuitem"
                aria-current={isActive ? "page" : undefined}
                aria-label={item.ariaLabel}
              >
                <item.icon size={16} aria-hidden="true" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
