import { create } from "zustand";

// ─── Live connection status ──────────────────────────────────────────────────
// Each real chat adapter reports its connection state here so the UI (Source
// Matrix dots, empty states) can show exactly what is and isn't wired up.
// Keyed by adapter id: "twitch" | "kick" | "youtube" | "x" | "hq".

export type SourceStatus =
  | "connecting" // attempting the handshake
  | "connected" // socket/poll established — real messages will flow
  | "offline" // connected the pipe, but the channel isn't live (no chat exists)
  | "unavailable" // can't connect without credentials/config
  | "error"; // transport failed (will retry)

interface LiveStatusState {
  status: Record<string, SourceStatus>;
  detail: Record<string, string>;
  setStatus: (id: string, status: SourceStatus, detail?: string) => void;
  reset: () => void;
}

export const useLiveStatus = create<LiveStatusState>((set) => ({
  status: {},
  detail: {},
  setStatus: (id, status, detail) =>
    set((s) => ({
      status: { ...s.status, [id]: status },
      detail: detail !== undefined ? { ...s.detail, [id]: detail } : s.detail,
    })),
  reset: () => set({ status: {}, detail: {} }),
}));

export function setSourceStatus(id: string, status: SourceStatus, detail?: string) {
  useLiveStatus.getState().setStatus(id, status, detail);
}

export const STATUS_META: Record<SourceStatus, { label: string; dot: string; pulse?: boolean }> = {
  connecting: { label: "Connecting", dot: "bg-amber-400", pulse: true },
  connected: { label: "Connected — live", dot: "bg-emerald-400" },
  offline: { label: "Connected — channel offline", dot: "bg-white/30" },
  unavailable: { label: "Not configured", dot: "bg-white/15" },
  error: { label: "Connection error — retrying", dot: "bg-red-400", pulse: true },
};
