"use client";

import { useEffect, useState } from "react";

export function useWakeLock(enabled: boolean) {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && "wakeLock" in navigator);
  }, []);

  useEffect(() => {
    if (!enabled || !supported) {
      setActive(false);
      return;
    }

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    async function request() {
      try {
        sentinel = await navigator.wakeLock.request("screen");
        if (cancelled) {
          await sentinel.release();
          sentinel = null;
          return;
        }
        setActive(true);
        sentinel.addEventListener("release", () => {
          if (!cancelled) setActive(false);
        });
      } catch {
        setActive(false);
      }
    }

    void request();

    const onVisibility = () => {
      if (document.visibilityState === "visible" && enabled) {
        void request();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void sentinel?.release();
      sentinel = null;
      setActive(false);
    };
  }, [enabled, supported]);

  return { supported, active };
}
