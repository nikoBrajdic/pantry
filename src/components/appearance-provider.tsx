"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  APPEARANCE_MODE_KEY,
  PALETTE_KEY,
  PROFILE_ICON_KEY,
  applyAppearance,
  isAppearanceMode,
  isPaletteId,
  isProfileIconId,
  type AppearanceMode,
  type PaletteId,
  type ProfileIconId,
} from "@/lib/appearance";

type AppearanceContextValue = {
  mode: AppearanceMode;
  palette: PaletteId;
  profileIcon: ProfileIconId | null;
  setMode: (mode: AppearanceMode) => void;
  setPalette: (palette: PaletteId) => void;
  setProfileIcon: (icon: ProfileIconId | null) => void;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function readStoredMode(): AppearanceMode {
  if (typeof window === "undefined") return "system";
  const value = window.localStorage.getItem(APPEARANCE_MODE_KEY);
  return isAppearanceMode(value) ? value : "system";
}

function readStoredPalette(): PaletteId {
  if (typeof window === "undefined") return "sage";
  const value = window.localStorage.getItem(PALETTE_KEY);
  return isPaletteId(value) ? value : "sage";
}

function readStoredProfileIcon(): ProfileIconId | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(PROFILE_ICON_KEY);
  return isProfileIconId(value) ? value : null;
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppearanceMode>("system");
  const [palette, setPaletteState] = useState<PaletteId>("sage");
  const [profileIcon, setProfileIconState] = useState<ProfileIconId | null>(null);

  useEffect(() => {
    const nextMode = readStoredMode();
    const nextPalette = readStoredPalette();
    const nextProfileIcon = readStoredProfileIcon();
    setModeState(nextMode);
    setPaletteState(nextPalette);
    setProfileIconState(nextProfileIcon);
    applyAppearance(nextMode, nextPalette);
  }, []);

  useEffect(() => {
    applyAppearance(mode, palette);
    if (mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyAppearance("system", palette);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [mode, palette]);

  const setMode = useCallback((next: AppearanceMode) => {
    setModeState(next);
    window.localStorage.setItem(APPEARANCE_MODE_KEY, next);
    setPaletteState((currentPalette) => {
      applyAppearance(next, currentPalette);
      return currentPalette;
    });
  }, []);

  const setPalette = useCallback((next: PaletteId) => {
    setPaletteState(next);
    window.localStorage.setItem(PALETTE_KEY, next);
    setModeState((currentMode) => {
      applyAppearance(currentMode, next);
      return currentMode;
    });
  }, []);

  const setProfileIcon = useCallback((next: ProfileIconId | null) => {
    setProfileIconState(next);
    if (next) {
      window.localStorage.setItem(PROFILE_ICON_KEY, next);
    } else {
      window.localStorage.removeItem(PROFILE_ICON_KEY);
    }
  }, []);

  const value = useMemo(
    () => ({ mode, palette, profileIcon, setMode, setPalette, setProfileIcon }),
    [mode, palette, profileIcon, setMode, setPalette, setProfileIcon],
  );

  return (
    <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error("useAppearance must be used inside AppearanceProvider.");
  }
  return context;
}
