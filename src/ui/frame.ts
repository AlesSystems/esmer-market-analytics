import { createContext, type ReactNode } from "react";

export type FrameView = "workspace" | "settings" | "recovery";
/** Asks the workspace to open a destination; `sequence` makes repeated requests distinct. */
export type LaunchRequest = { destination: string; sequence: number };
export type Frame = { view: FrameView; launchRequest: LaunchRequest | null; show: (view: FrameView, after?: () => void) => void; overlay: ReactNode; notices: ReactNode; connection: ReactNode };
export const AppFrame = createContext<Frame | null>(null);
