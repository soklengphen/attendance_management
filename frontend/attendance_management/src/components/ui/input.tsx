import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "outline" | "transparent"; // example variants
  inputSize?: "sm" | "md" | "lg"; // renamed from 'size'
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      inputSize = "md",
      variant = "default",
      rightIcon,
      leftIcon,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "h-8 px-2 text-sm",
      md: "h-10 px-3 text-base", 
      lg: "h-11 px-4 text-lg",
    };

    const variantClasses = {
      default: "border border-input bg-transparent rounded-md",
      outline: "border-2 border-gray-300 rounded-lg",
      transparent: "bg-transparent border-none",
    };

    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            "flex w-full rounded-md border bg-transparent py-1 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary",
            sizeClasses[inputSize],
            variantClasses[variant],
            leftIcon ? "pl-8" : "",
            rightIcon ? "pr-8" : "",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer mt-1 pr-2">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
