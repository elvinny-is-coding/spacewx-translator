"use client";

import dynamic from "next/dynamic";

const AuroraMap = dynamic(() => import("@/components/aurora-map"), {
  ssr: false,
});

interface AuroraMapWrapperProps {
  onLocationChange?: (lat: number, lng: number, label?: string) => void;
}

export default function AuroraMapWrapper({
  onLocationChange,
}: AuroraMapWrapperProps) {
  return <AuroraMap onLocationChange={onLocationChange} />;
}
