import type { SystemState } from "../types";
import seed from "./seedState.json";

export const DEFAULT_STATE = seed as SystemState;

export function cloneDefaultState(): SystemState {
  return JSON.parse(JSON.stringify(DEFAULT_STATE)) as SystemState;
}
