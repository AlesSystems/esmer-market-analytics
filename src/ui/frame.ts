import { createContext, type ReactNode } from "react";

/** The workspace, or one full-page view that replaces it until the owner returns. */
export type FrameView = "workspace" | "recovery" | "live" | "documents";
/** Asks the workspace to open a destination; `sequence` makes repeated requests distinct. */
export type LaunchRequest = { destination: string; sequence: number };
export type Frame = { view: FrameView; launchRequest: LaunchRequest | null; show: (view: FrameView, after?: () => void) => void; overlay: ReactNode; notices: ReactNode };
export const AppFrame = createContext<Frame | null>(null);
