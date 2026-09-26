import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva("inline-flex w-fit items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium", {
  variants: {
    variant: {
      default: "border-transparent bg-primary text-primary-foreground",
      secondary: "border-transparent bg-secondary text-secondary-foreground",
      outline: "border-border text-foreground",
      destructive: "border-transparent bg-destructive text-white",
      warning: "border-warning-border bg-warning text-warning-foreground",
    },
  },
  defaultVariants: { variant: "secondary" },
});

export function Badge({ className, variant = "secondary", ...props }: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" data-variant={variant} className={cn(badgeVariants({ variant }), className)} {...props} />;
}
