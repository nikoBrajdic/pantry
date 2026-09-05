"use client";

import { useRef } from "react";
import {
  DEFAULT_IMAGE_POSITION,
  formatImagePosition,
  parseImagePosition,
} from "@/lib/image-position";
import { cn } from "@/lib/utils";

export function ImagePositionEditor({
  src,
  position,
  onChange,
  className,
  hint,
  resetLabel,
}: {
  src: string;
  position?: string;
  onChange: (position: string) => void;
  className?: string;
  hint?: string;
  resetLabel?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const { x, y } = parseImagePosition(position);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const frame = frameRef.current;
    if (!frame) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: x,
      originY: y,
    };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const frame = frameRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !frame) return;
    const rect = frame.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    // Drag pans the crop window over the image (opposite of finger movement).
    const nextX = drag.originX - ((event.clientX - drag.startX) / rect.width) * 100;
    const nextY = drag.originY - ((event.clientY - drag.startY) / rect.height) * 100;
    onChange(formatImagePosition(nextX, nextY));
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }
  }

  return (
    <div className="space-y-2">
      <div
        ref={frameRef}
        className={cn(
          "relative touch-none overflow-hidden bg-[color-mix(in_oklch,var(--accent)_70%,var(--primary)_8%)]",
          className,
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          draggable={false}
          className="pointer-events-none h-full w-full select-none object-cover"
          style={{ objectPosition: position?.trim() || DEFAULT_IMAGE_POSITION }}
        />
      </div>
      {hint ? <p className="text-muted-foreground px-3 pt-2 text-xs">{hint}</p> : null}
      {resetLabel && (x !== 50 || y !== 50) ? (
        <button
          type="button"
          className="text-muted-foreground px-3 pb-1 text-xs underline-offset-4 hover:underline"
          onClick={() => onChange(DEFAULT_IMAGE_POSITION)}
        >
          {resetLabel}
        </button>
      ) : null}
    </div>
  );
}
