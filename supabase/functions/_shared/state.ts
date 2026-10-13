import { createDefaultState } from "./defaults.ts";
import type { SystemState } from "./types.ts";
import { getServiceClient } from "./auth.ts";

const BUCKET = "shop-states";
const STATE_PATH = (userId: string) => `${userId}/state.json`;

export async function loadState(userId: string): Promise<SystemState> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.storage.from(BUCKET).download(STATE_PATH(userId));
  if (error || !data) {
    const fresh = createDefaultState();
    await saveState(userId, fresh);
    return fresh;
  }
  const text = await data.text();
  return { ...createDefaultState(), ...JSON.parse(text) } as SystemState;
}

export async function saveState(userId: string, state: SystemState): Promise<void> {
  const supabase = getServiceClient();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const { error } = await supabase.storage.from(BUCKET).upload(STATE_PATH(userId), blob, {
    upsert: true,
    contentType: "application/json",
  });
  if (error) throw error;
}
