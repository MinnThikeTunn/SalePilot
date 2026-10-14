import { supabase } from "../utils/supabase";
import type { SystemState } from "../types";
import { createEmptyShopState } from "./defaults";

const BUCKET = "shop-states";

function statePath(userId: string) {
  return `${userId}/state.json`;
}

export async function getShopState(userId: string): Promise<SystemState> {
  if (!userId) return createEmptyShopState();
  try {
    const { data, error } = await supabase.storage.from(BUCKET).download(statePath(userId));

    if (error || !data) {
      const empty = createEmptyShopState();
      try {
        await saveShopState(userId, empty);
      } catch {
        // Silently ignore storage upload failure
      }
      return empty;
    }

    const text = await data.text();
    return { ...createEmptyShopState(), ...JSON.parse(text) } as SystemState;
  } catch (err) {
    console.warn("[shopState] getShopState fallback to empty state:", err);
    return createEmptyShopState();
  }
}

export async function saveShopState(userId: string, state: SystemState): Promise<void> {
  if (!userId) return;
  try {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const { error } = await supabase.storage.from(BUCKET).upload(statePath(userId), blob, {
      upsert: true,
      contentType: "application/json",
    });
    if (error) {
      console.warn("[shopState] Storage upload error:", error);
    }
  } catch (err) {
    console.warn("[shopState] Storage upload exception:", err);
  }
}
