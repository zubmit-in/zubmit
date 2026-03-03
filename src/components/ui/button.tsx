import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-brand-blue text-white hover:bg-blue-600 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]",
        orange:
          "bg-brand-orange text-white hover:bg-orange-600 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]",
        outline:
          "border border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white",
        ghost:
          "hover:bg-[var(--card)] hover:text-[var(--foreground)]",
        link: "text-brand-blue underline-offset-4 hover:underline",
        destructive:
          "bg-red-600 text-white hover:bg-red-700",
        secondary:
          "bg-[var(--card)] text-[var(--foreground)] border border-[var(--card-border)] hover:bg-[var(--card-border)]",
        success:
          "bg-green-600 text-white hover:bg-green-700 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-md px-4",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
