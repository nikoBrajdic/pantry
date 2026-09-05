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
import { mergeRecipes, newId } from "@/lib/storage";
import { normalizeRecipe } from "@/lib/normalize";
import type { CookLog, KitchenSummary, Recipe, RecipeList } from "@/lib/types";

type SyncState = "idle" | "saving" | "ok" | "error";

type LibraryPayload = {
  recipes: Recipe[];
  householdCode: string;
  kitchens?: KitchenSummary[];
  householdCodes?: string[];
};

type RecipeContextValue = {
  ready: boolean;
  recipes: Recipe[];
  cookLogs: CookLog[];
  household: string;
  kitchens: KitchenSummary[];
  syncState: SyncState;
  upsertRecipe: (recipe: Recipe) => void;
  removeRecipe: (id: string) => void;
  removeRecipes: (ids: string[]) => void;
  markCooked: (id: string) => number;
  removeCookLog: (id: string) => void;
  moveToList: (id: string, list: RecipeList) => void;
  moveRecipesToList: (ids: string[], list: RecipeList) => void;
  createHousehold: () => Promise<string>;
  joinHousehold: (code: string) => Promise<void>;
  switchHousehold: (code: string) => Promise<void>;
  leaveHousehold: (code?: string) => Promise<void>;
  renameKitchen: (code: string, name: string) => Promise<void>;
  copyRecipeToKitchen: (recipeId: string, targetHouseholdCode: string) => Promise<void>;
  refreshHousehold: () => Promise<void>;
};

const RecipeContext = createContext<RecipeContextValue | null>(null);

function kitchensFromLibrary(library: LibraryPayload): KitchenSummary[] {
  if (library.kitchens?.length) return library.kitchens;
  return (library.householdCodes ?? []).map((code) => ({ code, name: code }));
}

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [cookLogs, setCookLogs] = useState<CookLog[]>([]);
  const [household, setHousehold] = useState("");
  const [kitchens, setKitchens] = useState<KitchenSummary[]>([]);
  const [ready, setReady] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const householdRef = useRef("");
  const recipesRef = useRef<Recipe[]>([]);

  const applyLibrary = useCallback((library: LibraryPayload) => {
    const next = library.recipes.map(normalizeRecipe);
    recipesRef.current = next;
    householdRef.current = library.householdCode ?? "";
    setRecipes(next);
    setHousehold(library.householdCode ?? "");
    setKitchens(kitchensFromLibrary(library));
  }, []);

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
      setCookLogs([]);
      return;
    }
    if (status !== "authenticated") return;
    let cancelled = false;
    void (async () => {
      try {
        const [recipeResponse, logResponse] = await Promise.all([
          fetch("/api/recipes"),
          fetch("/api/cook-logs"),
        ]);
        const data = (await recipeResponse.json()) as {
          library?: LibraryPayload;
          error?: string;
        };
        const logData = (await logResponse.json()) as {
          logs?: CookLog[];
          error?: string;
        };
        if (cancelled) return;
        if (!recipeResponse.ok || !data.library) {
          console.error("Failed to load recipes", data.error ?? recipeResponse.status);
          setReady(true);
          setSyncState("error");
          return;
        }
        applyLibrary(data.library);
        if (logResponse.ok && Array.isArray(logData.logs)) {
          setCookLogs(logData.logs);
        }
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

  const removeRecipes = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      apply((prev) => prev.filter((item) => !idSet.has(item.id)));
    },
    [apply],
  );

  const markCooked = useCallback(
    (id: string) => {
      const current = recipesRef.current.find((item) => item.id === id);
      const nextCount = (current?.timesCooked ?? 0) + 1;
      const cookedAt = new Date().toISOString();
      apply((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                timesCooked: item.timesCooked + 1,
                lastCookedAt: cookedAt,
                updatedAt: cookedAt,
              }
            : item,
        ),
      );
      if (current) {
        const tempId = `temp-${newId()}`;
        const optimistic: CookLog = {
          id: tempId,
          recipeId: current.id,
          recipeTitle: current.title,
          recipeImageUrl: current.imageUrl,
          householdCode: householdRef.current,
          cookedAt,
        };
        setCookLogs((prev) => [optimistic, ...prev]);
        void (async () => {
          try {
            const response = await fetch("/api/cook-logs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                recipeId: current.id,
                recipeTitle: current.title,
                recipeImageUrl: current.imageUrl,
                householdCode: householdRef.current,
              }),
            });
            const data = (await response.json()) as { log?: CookLog };
            if (!response.ok || !data.log) {
              setCookLogs((prev) => prev.filter((item) => item.id !== tempId));
              return;
            }
            setCookLogs((prev) =>
              prev.map((item) => (item.id === tempId ? data.log! : item)),
            );
          } catch {
            setCookLogs((prev) => prev.filter((item) => item.id !== tempId));
          }
        })();
      }
      return nextCount;
    },
    [apply],
  );

  const removeCookLog = useCallback((id: string) => {
    setCookLogs((prev) => prev.filter((item) => item.id !== id));
    if (id.startsWith("temp-")) return;
    void fetch(`/api/cook-logs/${encodeURIComponent(id)}`, { method: "DELETE" }).then(
      (response) => {
        if (!response.ok) {
          void fetch("/api/cook-logs")
            .then((reload) => reload.json())
            .then((data: { logs?: CookLog[] }) => {
              if (Array.isArray(data.logs)) setCookLogs(data.logs);
            })
            .catch(() => undefined);
        }
      },
    );
  }, []);

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

  const moveRecipesToList = useCallback(
    (ids: string[], list: RecipeList) => {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      const now = new Date().toISOString();
      apply((prev) =>
        prev.map((item) =>
          idSet.has(item.id) ? { ...item, list, updatedAt: now } : item,
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
      library?: LibraryPayload;
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
        library?: LibraryPayload;
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
        library?: LibraryPayload;
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
        library?: LibraryPayload;
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

  const renameKitchen = useCallback(
    async (code: string, name: string) => {
      const response = await fetch("/api/household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rename", code, name }),
      });
      const data = (await response.json()) as {
        library?: LibraryPayload;
        error?: string;
      };
      if (!response.ok || !data.library) {
        throw new Error(data.error ?? "Could not rename kitchen.");
      }
      applyLibrary(data.library);
      setSyncState("ok");
    },
    [applyLibrary],
  );

  const copyRecipeToKitchen = useCallback(async (recipeId: string, targetCode: string) => {
    const response = await fetch("/api/recipes/copy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipeId,
        targetHouseholdCode: targetCode,
      }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      throw new Error(data.error ?? "Could not copy that recipe.");
    }
    setSyncState("ok");
  }, []);

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
      cookLogs,
      household,
      kitchens,
      syncState,
      upsertRecipe,
      removeRecipe,
      removeRecipes,
      markCooked,
      removeCookLog,
      moveToList,
      moveRecipesToList,
      createHousehold,
      joinHousehold,
      switchHousehold,
      leaveHousehold,
      renameKitchen,
      copyRecipeToKitchen,
      refreshHousehold,
    }),
    [
      ready,
      status,
      recipes,
      cookLogs,
      household,
      kitchens,
      syncState,
      upsertRecipe,
      removeRecipe,
      removeRecipes,
      markCooked,
      removeCookLog,
      moveToList,
      moveRecipesToList,
      createHousehold,
      joinHousehold,
      switchHousehold,
      leaveHousehold,
      renameKitchen,
      copyRecipeToKitchen,
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
