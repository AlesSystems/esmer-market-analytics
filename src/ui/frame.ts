import type { Destination } from "./AppShell";
import { createContext, type ReactNode } from "react";

export type FrameView = "welcome" | "workspace" | "settings" | "recovery";
export type LaunchRequest = { destination: Destination; sequence: number };
export type Frame = { view: FrameView; launchRequest: LaunchRequest | null; show: (view: FrameView, after?: () => void) => void; overlay: ReactNode; notices: ReactNode; connection: ReactNode };
export const AppFrame = createContext<Frame | null>(null);
