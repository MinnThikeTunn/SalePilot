import { supabase } from "../utils/supabase";
import type { SystemState } from "../types";
import { createEmptyShopState } from "./defaults";

const BUCKET = "shop-states";

function statePath(userId: string) {
  return `${userId}/state.json`;
}

export async function getShopState(userId: string): Promise<SystemState> {
  const { data, error } = await supabase.storage.from(BUCKET).download(statePath(userId));

  if (error || !data) {
    const empty = createEmptyShopState();
    await saveShopState(userId, empty);
    return empty;
  }

  const text = await data.text();
  return { ...createEmptyShopState(), ...JSON.parse(text) } as SystemState;
}

export async function saveShopState(userId: string, state: SystemState): Promise<void> {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const { error } = await supabase.storage.from(BUCKET).upload(statePath(userId), blob, {
    upsert: true,
    contentType: "application/json",
  });
  if (error) throw error;
}
