import * as React from "react";

import { cn } from "@/lib/utils";

const TEXTUAL_TYPES = new Set(["text", "search", undefined as unknown as string]);

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, spellCheck, lang, ...props }, ref) => {
    const isTextual = TEXTUAL_TYPES.has(type as string);
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        spellCheck={spellCheck ?? (isTextual ? true : undefined)}
        lang={lang ?? (isTextual ? "pt-BR" : undefined)}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
