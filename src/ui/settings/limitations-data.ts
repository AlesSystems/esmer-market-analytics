import limitationsSource from "../../../docs/operations/known-limitations-tr.md";
import { parseLimitations } from "./limitations";

/** Bundled at build time from docs/operations/known-limitations-tr.md. */
export const limitations = () => parseLimitations(limitationsSource);
