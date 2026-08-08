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
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "@/components/theme-toggle";

interface NavChild {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  ariaLabel: string;
}

interface NavGroup {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  ariaLabel: string;
  children: NavChild[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Data",
    icon: LayoutDashboard,
    ariaLabel: "Data & Visualisation",
    children: [
      {
        href: "/",
        label: "Overview",
        icon: LayoutDashboard,
        ariaLabel: "Overview Dashboard",
      },
      {
        href: "/aurora",
        label: "Aurora",
        icon: MapPin,
        ariaLabel: "Aurora Map",
      },
      {
        href: "/forecast",
        label: "Forecast",
        icon: TrendingUp,
        ariaLabel: "Forecast Charts",
      },
    ],
  },
  {
    label: "History",
    icon: Calendar,
    ariaLabel: "Historical Data & Alerts",
    children: [
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
      {
        href: "/alerts",
        label: "Alerts",
        icon: Bell,
        ariaLabel: "Active Alerts",
      },
    ],
  },
  {
    label: "Mission",
    icon: Satellite,
    ariaLabel: "Mission Operations",
    children: [
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
    ],
  },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav
      className="border-b border-void-navy bg-deep-indigo/80 backdrop-blur-sm sticky top-0 z-40"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 h-14">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-starlight hover:text-aurora-green transition-colors mr-6 focus:outline-none focus:ring-2 focus:ring-aurora-green focus:ring-offset-2 focus:ring-offset-void-navy rounded shrink-0"
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
          {NAV_GROUPS.map((group) => {
            const isGroupActive = group.children.some((child) =>
              child.href === "/"
                ? pathname === "/"
                : pathname.startsWith(child.href),
            );

            return (
              <DropdownMenu key={group.ariaLabel}>
                <DropdownMenuTrigger
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[44px] min-h-[44px] touch-manipulation outline-none",
                    isGroupActive
                      ? "bg-aurora-green/10 text-aurora-green border border-aurora-green/30"
                      : "text-faint-star hover:text-starlight hover:bg-void-navy/50 focus-visible:ring-2 focus-visible:ring-aurora-green/50 focus-visible:ring-offset-2 focus-visible:ring-offset-void-navy",
                  )}
                  role="menuitem"
                  aria-haspopup="true"
                  aria-label={group.ariaLabel}
                >
                  <group.icon size={16} aria-hidden="true" />
                  <span className="hidden sm:inline">{group.label}</span>
                  <ChevronDown
                    size={12}
                    className="hidden sm:inline opacity-50"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-deep-indigo border-void-navy text-starlight min-w-[180px] py-2 z-[10000]"
                  align="start"
                  sideOffset={8}
                >
                  <div className="px-2 pb-1 text-faint-star text-xs font-normal uppercase tracking-wider">
                    {group.label}
                  </div>
                  <div className="mx-2 h-px bg-void-navy mb-1" />
                  {group.children.map((child) => {
                    const isChildActive =
                      child.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(child.href);
                    return (
                      <DropdownMenuItem
                        key={child.href}
                        className="p-0 focus:bg-transparent"
                      >
                        <Link
                          href={child.href}
                          className={cn(
                            "flex items-center gap-2 w-full px-2 py-2 rounded-md text-sm transition-colors cursor-pointer",
                            isChildActive
                              ? "bg-aurora-green/10 text-aurora-green"
                              : "text-faint-star hover:text-starlight hover:bg-void-navy/50",
                          )}
                          aria-current={isChildActive ? "page" : undefined}
                          aria-label={child.ariaLabel}
                        >
                          <child.icon size={16} aria-hidden="true" />
                          {child.label}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
