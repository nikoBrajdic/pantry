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
import {
  loadHouseholdCode,
  loadRecipes,
  mergeRecipes,
  saveHouseholdCode,
  saveRecipes,
} from "@/lib/storage";
import type { Recipe } from "@/lib/types";

type SyncState = "idle" | "saving" | "ok" | "error";

type RecipeContextValue = {
  ready: boolean;
  recipes: Recipe[];
  household: string;
  syncState: SyncState;
  upsertRecipe: (recipe: Recipe) => void;
  removeRecipe: (id: string) => void;
  replaceRecipes: (recipes: Recipe[]) => void;
  createHousehold: () => Promise<string>;
  joinHousehold: (code: string) => Promise<void>;
  leaveHousehold: () => void;
  refreshHousehold: () => Promise<void>;
};

const RecipeContext = createContext<RecipeContextValue | null>(null);

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [household, setHousehold] = useState("");
  const [ready, setReady] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const householdRef = useRef("");

  useEffect(() => {
    const loaded = loadRecipes();
    const code = loadHouseholdCode();
    // localStorage is available only after mount; this is the client snapshot.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage
    setRecipes(loaded);
    setHousehold(code);
    householdRef.current = code;
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveRecipes(recipes);
  }, [recipes, ready]);

  const persistRemote = useCallback(async (code: string, next: Recipe[]) => {
    if (!code) return;
    setSyncState("saving");
    try {
      const response = await fetch(`/api/household/${code}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipes: next }),
      });
      setSyncState(response.ok ? "ok" : "error");
    } catch {
      setSyncState("error");
    }
  }, []);

  const upsertRecipe = useCallback(
    (recipe: Recipe) => {
      setRecipes((prev) => {
        const exists = prev.some((item) => item.id === recipe.id);
        const next = exists
          ? prev.map((item) => (item.id === recipe.id ? recipe : item))
          : [recipe, ...prev];
        void persistRemote(householdRef.current, next);
        return next;
      });
    },
    [persistRemote],
  );

  const removeRecipe = useCallback(
    (id: string) => {
      setRecipes((prev) => {
        const next = prev.filter((item) => item.id !== id);
        void persistRemote(householdRef.current, next);
        return next;
      });
    },
    [persistRemote],
  );

  const replaceRecipes = useCallback(
    (next: Recipe[]) => {
      setRecipes(next);
      void persistRemote(householdRef.current, next);
    },
    [persistRemote],
  );

  const createHousehold = useCallback(async () => {
    const response = await fetch("/api/household", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", recipes }),
    });
    const data = (await response.json()) as {
      household?: { code: string; recipes: Recipe[] };
      error?: string;
    };
    if (!response.ok || !data.household) {
      throw new Error(data.error ?? "Kućanstvo se nije moglo otvoriti.");
    }
    householdRef.current = data.household.code;
    setHousehold(data.household.code);
    saveHouseholdCode(data.household.code);
    setSyncState("ok");
    return data.household.code;
  }, [recipes]);

  const joinHousehold = useCallback(
    async (code: string) => {
      const response = await fetch("/api/household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", code }),
      });
      const data = (await response.json()) as {
        household?: { code: string; recipes: Recipe[] };
        error?: string;
      };
      if (!response.ok || !data.household) {
        throw new Error(data.error ?? "Kod nije prepoznat.");
      }
      const merged = mergeRecipes(recipes, data.household.recipes);
      householdRef.current = data.household.code;
      setHousehold(data.household.code);
      saveHouseholdCode(data.household.code);
      setRecipes(merged);
      await persistRemote(data.household.code, merged);
    },
    [persistRemote, recipes],
  );

  const leaveHousehold = useCallback(() => {
    householdRef.current = "";
    setHousehold("");
    saveHouseholdCode("");
    setSyncState("idle");
  }, []);

  const refreshHousehold = useCallback(async () => {
    const code = householdRef.current;
    if (!code) return;
    const response = await fetch(`/api/household/${code}`);
    const data = (await response.json()) as {
      household?: { recipes: Recipe[] };
    };
    if (response.ok && data.household) {
      setRecipes((prev) => mergeRecipes(prev, data.household!.recipes));
      setSyncState("ok");
    }
  }, []);

  useEffect(() => {
    if (!ready || !household) return;
    void refreshHousehold();
  }, [household, ready, refreshHousehold]);

  const value = useMemo(
    () => ({
      ready,
      recipes,
      household,
      syncState,
      upsertRecipe,
      removeRecipe,
      replaceRecipes,
      createHousehold,
      joinHousehold,
      leaveHousehold,
      refreshHousehold,
    }),
    [
      ready,
      recipes,
      household,
      syncState,
      upsertRecipe,
      removeRecipe,
      replaceRecipes,
      createHousehold,
      joinHousehold,
      leaveHousehold,
      refreshHousehold,
    ],
  );

  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
}

export function useRecipes() {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error("useRecipes mora biti unutar RecipeProvider.");
  }
  return context;
}
