"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
  Marker,
  Popup,
  Polygon,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useOvation } from "@/hooks/use-ovation";
import {
  getVisibilityFromGrid,
  computeOvalBoundary,
  sampleGridBilinear,
} from "@/lib/aurora-utils";
import type { OvationGrid } from "@/types/ovation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crosshair, Info } from "lucide-react";

// ── Constants ──
const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>';

const BUFFER_W = 260;
const BUFFER_H = 160;
const OVERLAY_BLUR_PX = 1.5;

const WORLD_BOUNDS = L.latLngBounds([-90, -180], [90, 180]);

const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;background:#3ECF8E;border-radius:50%;box-shadow:0 0 10px #3ECF8E;border:2px solid #fff;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const tapIcon = L.divIcon({
  className: "",
  html: `<div style="width:12px;height:12px;background:#F5A623;border-radius:50%;box-shadow:0 0 8px #F5A623;border:2px solid #fff;"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const COLOR_STOPS: { p: number; rgb: [number, number, number]; a: number }[] = [
  { p: 0, rgb: [11, 17, 32], a: 0 },
  { p: 8, rgb: [62, 207, 142], a: 60 },
  { p: 30, rgb: [62, 207, 142], a: 140 },
  { p: 55, rgb: [124, 92, 255], a: 190 },
  { p: 80, rgb: [245, 166, 35], a: 220 },
  { p: 100, rgb: [255, 70, 70], a: 240 },
];

function colorForProbability(prob: number): [number, number, number, number] {
  const p = Math.max(0, Math.min(100, prob));
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const a = COLOR_STOPS[i];
    const b = COLOR_STOPS[i + 1];
    if (p >= a.p && p <= b.p) {
      const t = b.p === a.p ? 0 : (p - a.p) / (b.p - a.p);
      return [
        Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * t),
        Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * t),
        Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * t),
        Math.round(a.a + (b.a - a.a) * t),
      ];
    }
  }
  const last = COLOR_STOPS[COLOR_STOPS.length - 1];
  return [last.rgb[0], last.rgb[1], last.rgb[2], last.a];
}

// sampleGridBilinear now lives in "@/lib/aurora-utils" and is shared with
// getVisibilityFromGrid, so the heatmap color under a point and the
// "Possible / Likely / …" label for that same point always agree.

// ── Canvas Overlay ──
function OvationCanvasOverlay({
  grid,
  onCellCount,
}: {
  grid: OvationGrid | null;
  onCellCount?: (count: number) => void;
}) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bufferCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!map.getPane("auroraPane")) {
      map.createPane("auroraPane");
      const pane = map.getPane("auroraPane")!;
      pane.style.zIndex = "450";
      pane.style.pointerEvents = "none";
    }
    const pane = map.getPane("auroraPane")!;

    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    pane.appendChild(canvas);
    canvasRef.current = canvas;

    const buffer = document.createElement("canvas");
    buffer.width = BUFFER_W;
    buffer.height = BUFFER_H;
    bufferCanvasRef.current = buffer;

    const resize = () => {
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;
    };
    map.on("resize", resize);
    resize();

    return () => {
      map.off("resize", resize);
      canvas.remove();
    };
  }, [map]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const buffer = bufferCanvasRef.current;
    if (!canvas || !buffer || !grid) return;

    const ctx = canvas.getContext("2d");
    const bctx = buffer.getContext("2d");
    if (!ctx || !bctx) return;

    // Re-pin the canvas to the map's current pixel origin before every
    // redraw. Leaflet pans by CSS-transforming the pane hierarchy (so
    // tiles can follow the cursor without a redraw), and it only resets
    // that transform to zero on a full view reset — not on every
    // moveend. This canvas, however, is a full-viewport buffer we
    // regenerate from scratch each time, assuming its own (0,0) lines
    // up with the map container's (0,0). Left uncorrected, the fresh
    // image renders at container (0,0) + whatever transform offset is
    // still on the pane, i.e. shifted out of the visible viewport —
    // which is why the aurora appeared to vanish after panning.
    const topLeft = map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(canvas, topLeft);

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const imgData = bctx.createImageData(BUFFER_W, BUFFER_H);
    const data = imgData.data;
    let activeCount = 0;

    // Perf: map.containerPointToLatLng() is a real projection call, and
    // calling it once per buffer pixel (BUFFER_W * BUFFER_H = 41,600
    // calls) was the hot path here. With an unrotated Leaflet map,
    // screen-Y alone determines latitude and screen-X alone determines
    // longitude, so we precompute two 1-D lookup tables
    // (BUFFER_W + BUFFER_H = 420 calls) instead — about 100x fewer
    // projection calls per redraw.
    const latForRow = new Float64Array(BUFFER_H);
    for (let by = 0; by < BUFFER_H; by++) {
      const screenY = (by / BUFFER_H) * height;
      latForRow[by] = map.containerPointToLatLng([0, screenY]).lat;
    }
    const lonForCol = new Float64Array(BUFFER_W);
    for (let bx = 0; bx < BUFFER_W; bx++) {
      const screenX = (bx / BUFFER_W) * width;
      lonForCol[bx] = map.containerPointToLatLng([screenX, 0]).lng;
    }

    for (let by = 0; by < BUFFER_H; by++) {
      const lat = latForRow[by];
      if (lat > 90 || lat < -90) continue;
      const rowF = 90 - lat;

      for (let bx = 0; bx < BUFFER_W; bx++) {
        const lon = ((lonForCol[bx] % 360) + 360) % 360;
        const colF = lon;

        const prob = sampleGridBilinear(grid, rowF, colF);
        const idx = (by * BUFFER_W + bx) * 4;

        if (prob > 0.5) activeCount++;

        const [r, g, b, a] = colorForProbability(prob);
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = a;
      }
    }

    bctx.putImageData(imgData, 0, 0);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    // NOTE: ctx.filter blur is a known slow path on Safari/iOS canvas.
    // If profiling shows this is a bottleneck on mobile, consider a
    // manual box-blur on the low-res buffer, or CSS-blurring the canvas
    // element itself, instead of the canvas 2D filter.
    ctx.filter = `blur(${OVERLAY_BLUR_PX}px)`;
    ctx.drawImage(buffer, 0, 0, BUFFER_W, BUFFER_H, 0, 0, width, height);
    ctx.restore();

    onCellCount?.(activeCount);
  }, [grid, map, onCellCount]);

  useEffect(() => {
    if (!grid) return;

    const onMove = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    };

    map.on("moveend", onMove);
    map.on("zoomend", onMove);
    draw();

    return () => {
      map.off("moveend", onMove);
      map.off("zoomend", onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [map, draw, grid]);

  return null;
}

// ── Click handler ──
function MapClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ── Visibility panel ──
function VisibilityPanel({
  label,
  color,
  locationName,
  hasInteracted,
}: {
  label: string;
  color: string;
  locationName?: string;
  hasInteracted: boolean;
}) {
  return (
    <Card className="absolute bottom-4 left-4 z-[1000] w-56 border-none bg-deep-indigo/90 backdrop-blur-sm shadow-lg transition-all duration-300">
      <CardContent className="p-3 space-y-1 relative">
        <p className="text-xs text-faint-star truncate pr-4">
          {locationName || "Selected location"}
        </p>
        <p
          className="text-base font-bold drop-shadow-sm"
          style={{ color: `var(--color-${color})` }}
        >
          {label}
        </p>
        <p className="text-xs text-faint-star">Current visibility forecast</p>

        {!hasInteracted && (
          <div className="mt-3 pt-3 border-t border-starlight/10 text-[10px] text-starlight/70 italic flex items-start gap-1.5 animate-in fade-in zoom-in duration-500">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <p>Tap anywhere on the map to see the local aurora forecast.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Map Legend ──
function MapLegend() {
  return (
    <Card className="absolute bottom-4 right-4 z-[1000] w-[280px] border-none bg-deep-indigo/90 backdrop-blur-sm shadow-lg hidden sm:block">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-starlight flex items-center gap-1.5">
            Aurora Intensity
          </p>
        </div>

        <div className="relative">
          <div
            className="h-2 w-full rounded-full"
            style={{
              background:
                "linear-gradient(to right, rgba(11,17,32,0) 0%, rgba(62,207,142,0.6) 30%, rgba(124,92,255,0.75) 55%, rgba(245,166,35,0.85) 80%, rgba(255,70,70,0.95) 100%)",
            }}
          />
        </div>

        <div className="flex justify-between text-faint-star/90 text-left">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#3ECF8E]">
              Faint
            </span>
            <span className="text-[9px] leading-tight text-faint-star/70">
              Horizon view
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C5CFF]">
              Active
            </span>
            <span className="text-[9px] leading-tight text-faint-star/70">
              Mid-sky view
            </span>
          </div>
          <div className="flex flex-col items-end gap-0.5 text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF4646]">
              Extreme
            </span>
            <span className="text-[9px] leading-tight text-faint-star/70">
              Overhead view
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ──
interface AuroraMapProps {
  onLocationChange?: (lat: number, lng: number, label?: string) => void;
  /** Optional Kp value to render a simplified forecast oval overlay for. */
  ovalKp?: number;
}

export default function AuroraMap({
  onLocationChange,
  ovalKp,
}: AuroraMapProps) {
  const { grid, isLoading, error } = useOvation();

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [targetLocation, setTargetLocation] = useState<{
    lat: number;
    lng: number;
    label?: string;
  } | null>(null);

  const [selectionSource, setSelectionSource] = useState<"geo" | "tap" | null>(
    null,
  );
  const [geoError, setGeoError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<{
    label: string;
    color: string;
  } | null>(null);

  const [activeCellCount, setActiveCellCount] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Ref to track last notified location to avoid duplicate calls
  const lastNotifiedRef = useRef<{
    lat: number;
    lng: number;
    label?: string;
  } | null>(null);

  // Notify parent when targetLocation changes, but only if different
  useEffect(() => {
    if (!targetLocation || !onLocationChange) return;
    const prev = lastNotifiedRef.current;
    if (
      prev &&
      prev.lat === targetLocation.lat &&
      prev.lng === targetLocation.lng &&
      prev.label === targetLocation.label
    ) {
      return; // same location, skip
    }
    lastNotifiedRef.current = {
      lat: targetLocation.lat,
      lng: targetLocation.lng,
      label: targetLocation.label,
    };
    onLocationChange(
      targetLocation.lat,
      targetLocation.lng,
      targetLocation.label,
    );
  }, [targetLocation, onLocationChange]);

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "My location",
        };
        setUserLocation({ lat: location.lat, lng: location.lng });
        setTargetLocation(location);
        setSelectionSource("geo");
        setGeoError(null);
        setHasInteracted(true);
      },
      (err) => {
        setGeoError("Could not get location: " + err.message);
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  // Best-effort reverse geocoding for tapped points, so the visibility
  // panel shows a real place name instead of the generic "Selected
  // location" fallback. If the request fails or is superseded by a
  // newer tap, the fallback label just stays in place — this never
  // blocks or breaks the visibility lookup itself.
  const geocodeAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      geocodeAbortRef.current?.abort();
    };
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    geocodeAbortRef.current?.abort();
    const controller = new AbortController();
    geocodeAbortRef.current = controller;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10`,
        { signal: controller.signal },
      );
      if (!res.ok) return;
      const json = await res.json();
      const place: string | undefined =
        json?.address?.city ||
        json?.address?.town ||
        json?.address?.village ||
        json?.address?.state ||
        json?.address?.country;

      if (!place) return;

      setTargetLocation((prev) =>
        prev && prev.lat === lat && prev.lng === lng
          ? { ...prev, label: place }
          : prev,
      );
    } catch {
      // Aborted (superseded by a newer tap) or network error — keep the
      // generic fallback label.
    }
  }, []);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setTargetLocation({ lat, lng });
      setSelectionSource("tap");
      setHasInteracted(true);
      reverseGeocode(lat, lng);
    },
    [reverseGeocode],
  );

  useEffect(() => {
    if (!grid || !targetLocation) return;
    const result = getVisibilityFromGrid(
      grid,
      targetLocation.lat,
      targetLocation.lng,
    );
    setVisibility({ label: result.label, color: result.color });
  }, [grid, targetLocation]);

  const ovalPoints = useMemo(() => {
    if (ovalKp === undefined || ovalKp === null) return null;
    return computeOvalBoundary(ovalKp);
  }, [ovalKp]);

  return (
    <Card className="border-none bg-deep-indigo overflow-hidden">
      <CardContent className="p-0 relative" style={{ height: "500px" }}>
        {isLoading && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-deep-indigo/70 text-starlight text-sm">
            Loading aurora data…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-deep-indigo/70 text-solar-amber text-sm">
            {error}
          </div>
        )}

        <MapContainer
          center={[50, 0]}
          zoom={2}
          minZoom={2}
          maxZoom={8}
          style={{ height: "100%", width: "100%", background: "#0B1120" }}
          maxBounds={WORLD_BOUNDS}
          maxBoundsViscosity={1.0}
          zoomControl={false}
        >
          <TileLayer url={TILE_URL} attribution={ATTRIBUTION} noWrap />

          {grid && (
            <OvationCanvasOverlay
              grid={grid}
              onCellCount={setActiveCellCount}
            />
          )}

          {ovalPoints && (
            <Polygon
              positions={ovalPoints}
              pathOptions={{
                color: "#3ECF8E",
                weight: 2,
                fillColor: "#3ECF8E",
                fillOpacity: 0.15,
                dashArray: "4 4",
              }}
            />
          )}

          <MapClickHandler onClick={handleMapClick} />
          {/* Explicit zoom control, positioned top-left since top-right,
              bottom-left, and bottom-right are all already occupied by
              the custom overlays below. The conditional badge that used
              to sit at top-3 is shifted down (top-20) to clear it. */}
          <ZoomControl position="topleft" />

          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userIcon}
            >
              <Popup>You are here</Popup>
            </Marker>
          )}

          {targetLocation && selectionSource === "tap" && (
            <Marker
              position={[targetLocation.lat, targetLocation.lng]}
              icon={tapIcon}
            />
          )}
        </MapContainer>

        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
          <Button
            size="sm"
            onClick={requestGeolocation}
            className="bg-deep-indigo/80 backdrop-blur-sm border-none text-starlight hover:bg-deep-indigo shadow-md"
          >
            <Crosshair size={14} className="mr-1" />
            My location
          </Button>
        </div>

        {geoError && (
          <div className="absolute top-12 right-3 z-[1000] bg-deep-indigo/90 text-solar-amber text-xs p-2 rounded shadow">
            {geoError}
          </div>
        )}

        {ovalPoints ? (
          <div className="absolute top-20 left-3 z-[1000] bg-deep-indigo/90 text-aurora-green text-[10px] px-2 py-1 rounded shadow">
            Simplified forecast oval (Kp {ovalKp})
          </div>
        ) : (
          grid &&
          activeCellCount === 0 && (
            <div className="absolute top-20 left-3 z-[1000] bg-deep-indigo/90 text-faint-star text-xs px-3 py-1.5 rounded shadow">
              No significant aurora activity in this view right now
            </div>
          )
        )}

        {visibility && targetLocation && (
          <VisibilityPanel
            label={visibility.label}
            color={visibility.color}
            locationName={targetLocation.label}
            hasInteracted={hasInteracted}
          />
        )}

        {grid && activeCellCount !== 0 && <MapLegend />}
      </CardContent>
    </Card>
  );
}
