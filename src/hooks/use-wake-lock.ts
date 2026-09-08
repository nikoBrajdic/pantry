"use client";

import { useEffect, useRef, useState } from "react";

export function useWakeLock(enabled: boolean) {
  const [supported, setSupported] = useState(false);
  const [secure, setSecure] = useState(true);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<"denied" | "insecure" | null>(null);
  const wantRef = useRef(enabled);
  wantRef.current = enabled;

  useEffect(() => {
    const hasApi =
      typeof navigator !== "undefined" &&
      "wakeLock" in navigator &&
      typeof navigator.wakeLock?.request === "function";
    setSupported(hasApi);
    setSecure(typeof window === "undefined" ? true : window.isSecureContext);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setActive(false);
      return;
    }

    if (!supported) {
      setActive(false);
      return;
    }

    if (!secure) {
      setActive(false);
      setError("insecure");
      return;
    }

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;
    let requestId = 0;

    async function request() {
      if (cancelled || !wantRef.current) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        setActive(false);
        return;
      }
      if (sentinel && !sentinel.released) {
        setActive(true);
        setError(null);
        return;
      }

      const id = ++requestId;
      try {
        const next = await navigator.wakeLock.request("screen");
        if (cancelled || !wantRef.current || id !== requestId) {
          await next.release().catch(() => undefined);
          return;
        }
        sentinel = next;
        setActive(true);
        setError(null);
        next.addEventListener("release", () => {
          if (!cancelled) setActive(false);
        });
      } catch {
        if (cancelled || id !== requestId) return;
        sentinel = null;
        setActive(false);
        setError("denied");
      }
    }

    setError(null);
    void request();

    const reacquire = () => {
      if (wantRef.current) void request();
    };

    document.addEventListener("visibilitychange", reacquire);
    window.addEventListener("focus", reacquire);
    window.addEventListener("pageshow", reacquire);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", reacquire);
      window.removeEventListener("focus", reacquire);
      window.removeEventListener("pageshow", reacquire);
      void sentinel?.release().catch(() => undefined);
      sentinel = null;
      setActive(false);
    };
  }, [enabled, supported, secure]);

  return { supported, secure, active, error };
}
