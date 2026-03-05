import { FLOW_STORAGE_KEY } from "@/lib/constants";
import { FlowState } from "@/types/legacy-loop";

export function loadPersistedState(): FlowState | null {
  if (typeof window === "undefined") return null;

  try {
    const serialized = window.localStorage.getItem(FLOW_STORAGE_KEY);
    if (!serialized) return null;
    return JSON.parse(serialized) as FlowState;
  } catch {
    return null;
  }
}

export function savePersistedState(state: FlowState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(state));
}

export function clearPersistedState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(FLOW_STORAGE_KEY);
}
