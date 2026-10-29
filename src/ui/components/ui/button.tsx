import type { ComponentProps } from "react";

/** The one button: DESIGN.md's primary, secondary and link, drawn by `.btn` and `.link` in shell.css. One primary per view. */
const classes = { primary: "btn btn-primary", secondary: "btn btn-secondary", link: "link" } as const;

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: keyof typeof classes }) {
  return <button type="button" className={className ? `${classes[variant]} ${className}` : classes[variant]} {...props} />;
}
