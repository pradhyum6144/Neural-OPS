"use client";

import { useState, forwardRef, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { clsx } from "clsx";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, type, className, ...props }, ref) => {
    const [show, setShow] = useState(false);
    const isPassword = type === "password";
    const resolvedType = isPassword ? (show ? "text" : "password") : type;

    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[#9090b0]">{label}</label>
        <div className="relative">
          <input
            ref={ref}
            type={resolvedType}
            className={clsx(
              "w-full rounded-lg px-3.5 py-2.5 text-sm text-white",
              "bg-[rgba(99,102,241,0.07)] border border-[rgba(99,102,241,0.18)]",
              "placeholder:text-[#4a4a6a]",
              "outline-none transition-all duration-150",
              "focus:border-[rgba(99,102,241,0.6)] focus:bg-[rgba(99,102,241,0.1)]",
              "focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]",
              isPassword && "pr-10",
              error && "border-[rgba(244,63,94,0.5)] focus:border-[rgba(244,63,94,0.7)] focus:shadow-[0_0_0_3px_rgba(244,63,94,0.1)]",
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a5a7a] hover:text-[#9090b0] transition-colors"
              tabIndex={-1}
            >
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          )}
        </div>
        {error && (
          <p className="text-xs text-[#f43f5e]">{error}</p>
        )}
      </div>
    );
  }
);

InputField.displayName = "InputField";
