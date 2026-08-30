"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/components/session-provider";
import { mergeRecipes } from "@/lib/storage";
import { normalizeRecipe } from "@/lib/normalize";
import type { Recipe, RecipeList } from "@/lib/types";

type SyncState = "idle" | "saving" | "ok" | "error";

type RecipeContextValue = {
  ready: boolean;
  recipes: Recipe[];
  household: string;
  households: string[];
  syncState: SyncState;
  upsertRecipe: (recipe: Recipe) => void;
  removeRecipe: (id: string) => void;
  markCooked: (id: string) => number;
  moveToList: (id: string, list: RecipeList) => void;
  createHousehold: () => Promise<string>;
  joinHousehold: (code: string) => Promise<void>;
  switchHousehold: (code: string) => Promise<void>;
  leaveHousehold: (code?: string) => Promise<void>;
  refreshHousehold: () => Promise<void>;
};

const RecipeContext = createContext<RecipeContextValue | null>(null);

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [household, setHousehold] = useState("");
  const [households, setHouseholds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const householdRef = useRef("");
  const recipesRef = useRef<Recipe[]>([]);

  const applyLibrary = useCallback(
    (library: { recipes: Recipe[]; householdCode: string; householdCodes?: string[] }) => {
      const next = library.recipes.map(normalizeRecipe);
      recipesRef.current = next;
      householdRef.current = library.householdCode ?? "";
      setRecipes(next);
      setHousehold(library.householdCode ?? "");
      setHouseholds(library.householdCodes ?? []);
    },
    [],
  );

  const persist = useCallback(async (next: Recipe[], code = householdRef.current) => {
    setSyncState("saving");
    try {
      const response = await fetch("/api/recipes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipes: next, householdCode: code }),
      });
      setSyncState(response.ok ? "ok" : "error");
    } catch {
      setSyncState("error");
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      setReady(false);
      return;
    }
    if (status !== "authenticated") return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/recipes");
        const data = (await response.json()) as {
          library?: {
            recipes: Recipe[];
            householdCode: string;
            householdCodes?: string[];
          };
          error?: string;
        };
        if (cancelled) return;
        if (!response.ok || !data.library) {
          console.error("Failed to load recipes", data.error ?? response.status);
          setReady(true);
          setSyncState("error");
          return;
        }
        applyLibrary(data.library);
        setReady(true);
        setSyncState("ok");
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load recipes", error);
        setReady(true);
        setSyncState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyLibrary, status]);

  const apply = useCallback(
    (updater: (prev: Recipe[]) => Recipe[]) => {
      setRecipes((prev) => {
        const next = updater(prev);
        recipesRef.current = next;
        void persist(next);
        return next;
      });
    },
    [persist],
  );

  const upsertRecipe = useCallback(
    (recipe: Recipe) => {
      apply((prev) => {
        const normalized = normalizeRecipe(recipe);
        return prev.some((item) => item.id === normalized.id)
          ? prev.map((item) => (item.id === normalized.id ? normalized : item))
          : [normalized, ...prev];
      });
    },
    [apply],
  );

  const removeRecipe = useCallback(
    (id: string) => {
      apply((prev) => prev.filter((item) => item.id !== id));
    },
    [apply],
  );

  const markCooked = useCallback(
    (id: string) => {
      const current = recipesRef.current.find((item) => item.id === id);
      const nextCount = (current?.timesCooked ?? 0) + 1;
      apply((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                timesCooked: item.timesCooked + 1,
                lastCookedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      );
      return nextCount;
    },
    [apply],
  );

  const moveToList = useCallback(
    (id: string, list: RecipeList) => {
      apply((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, list, updatedAt: new Date().toISOString() } : item,
        ),
      );
    },
    [apply],
  );

  const createHousehold = useCallback(async () => {
    const response = await fetch("/api/household", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", recipes: recipesRef.current }),
    });
    const data = (await response.json()) as {
      household?: { code: string; recipes: Recipe[] };
      library?: {
        recipes: Recipe[];
        householdCode: string;
        householdCodes?: string[];
      };
      error?: string;
    };
    if (!response.ok || !data.household || !data.library) {
      throw new Error(data.error ?? "Could not open a shared kitchen.");
    }
    applyLibrary(data.library);
    setSyncState("ok");
    return data.household.code;
  }, [applyLibrary]);

  const joinHousehold = useCallback(
    async (code: string) => {
      const response = await fetch("/api/household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", code }),
      });
      const data = (await response.json()) as {
        library?: {
          recipes: Recipe[];
          householdCode: string;
          householdCodes?: string[];
        };
        error?: string;
      };
      if (!response.ok || !data.library) {
        throw new Error(data.error ?? "That code was not recognised.");
      }
      applyLibrary(data.library);
      setSyncState("ok");
    },
    [applyLibrary],
  );

  const switchHousehold = useCallback(
    async (code: string) => {
      const response = await fetch("/api/household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "switch", code }),
      });
      const data = (await response.json()) as {
        library?: {
          recipes: Recipe[];
          householdCode: string;
          householdCodes?: string[];
        };
        error?: string;
      };
      if (!response.ok || !data.library) {
        throw new Error(data.error ?? "Could not switch kitchen.");
      }
      applyLibrary(data.library);
      setSyncState("ok");
    },
    [applyLibrary],
  );

  const leaveHousehold = useCallback(
    async (code?: string) => {
      const response = await fetch("/api/household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave", code: code ?? householdRef.current }),
      });
      const data = (await response.json()) as {
        library?: {
          recipes: Recipe[];
          householdCode: string;
          householdCodes?: string[];
        };
        error?: string;
      };
      if (!response.ok || !data.library) {
        throw new Error(data.error ?? "Could not leave kitchen.");
      }
      applyLibrary(data.library);
      setSyncState("ok");
    },
    [applyLibrary],
  );

  const refreshHousehold = useCallback(async () => {
    const code = householdRef.current;
    if (!code) return;
    const response = await fetch(`/api/household/${code}`);
    const data = (await response.json()) as { household?: { recipes: Recipe[] } };
    if (response.ok && data.household) {
      const merged = mergeRecipes(recipesRef.current, data.household.recipes).map(
        normalizeRecipe,
      );
      recipesRef.current = merged;
      setRecipes(merged);
      setSyncState("ok");
    }
  }, []);

  const value = useMemo(
    () => ({
      ready: ready && status === "authenticated",
      recipes,
      household,
      households,
      syncState,
      upsertRecipe,
      removeRecipe,
      markCooked,
      moveToList,
      createHousehold,
      joinHousehold,
      switchHousehold,
      leaveHousehold,
      refreshHousehold,
    }),
    [
      ready,
      status,
      recipes,
      household,
      households,
      syncState,
      upsertRecipe,
      removeRecipe,
      markCooked,
      moveToList,
      createHousehold,
      joinHousehold,
      switchHousehold,
      leaveHousehold,
      refreshHousehold,
    ],
  );

  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
}

export function useRecipes() {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error("useRecipes must be used inside RecipeProvider.");
  }
  return context;
}
