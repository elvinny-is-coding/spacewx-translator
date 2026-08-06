// components/layout/layout-client.tsx
"use client";

import { useEffect, useState } from "react";
import { SidebarProvider, useSidebar } from "@/hooks/use-sidebar";
import { SpaceWeatherProvider } from "@/providers/space-weather-provider";
import NavBar from "@/components/layout/nav-bar";
import AiSidebar from "@/components/layout/ai-sidebar";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { ErrorBoundary } from "@/components/error-boundary";
import type { SpaceWeatherData } from "@/types/spacewx";

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { open, toggle } = useSidebar();

  return (
    <div className="min-h-screen bg-void-navy font-body text-starlight antialiased">
      <NavBar />
      <AiSidebar />
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        className="fixed top-20 right-4 z-50 hidden lg:flex"
        title={open ? "Close sidebar" : "Open sidebar"}
      >
        {open ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
      </Button>
      <main
        className={`transition-all duration-300 ${
          open ? "lg:mr-[380px]" : "lg:mr-0"
        }`}
      >
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">{children}</div>
      </main>
    </div>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setData] = useState<SpaceWeatherData | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/spacewx");
        if (!res.ok) throw new Error("Failed to fetch space weather data");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to load space weather data:", err);
      }
    }
    fetchData();
  }, []);

  return (
    <ErrorBoundary>
      <SidebarProvider>
        {data ? (
          <SpaceWeatherProvider data={data}>
            <LayoutInner>{children}</LayoutInner>
          </SpaceWeatherProvider>
        ) : (
          <div className="min-h-screen bg-void-navy flex items-center justify-center">
            <p className="text-faint-star">Loading space weather data...</p>
          </div>
        )}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#131B33",
              color: "#E7ECF5",
              border: "1px solid #3ECF8E",
            },
          }}
        />
      </SidebarProvider>
    </ErrorBoundary>
  );
}
