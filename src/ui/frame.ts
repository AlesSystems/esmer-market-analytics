import { createContext, type ReactNode } from "react";

export type FrameView = "workspace" | "settings" | "recovery";
export type Frame = { view: FrameView; show: (view: FrameView, after?: () => void) => void; overlay: ReactNode; notices: ReactNode; connection: ReactNode };
export const AppFrame = createContext<Frame | null>(null);
