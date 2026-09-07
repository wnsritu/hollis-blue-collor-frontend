import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export function OtpInput({
  value = "",
  onChange,
  length = 6,
  disabled = false,
  className,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length }, (_, i) => value[i] || "");

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const updateDigit = (index: number, digit: string) => {
    const newDigits = [...digits];
    newDigits[index] = digit;
    const newValue = newDigits.join("");
    onChange(newValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    const lastChar = val.slice(-1);
    if (lastChar && !/^\d$/.test(lastChar)) {
      return;
    }

    updateDigit(index, lastChar);

    if (lastChar && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        updateDigit(index - 1, "");
        inputRefs.current[index - 1]?.focus();
      } else {
        updateDigit(index, "");
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();
    const cleanDigits = pastedData.replace(/\D/g, "").slice(0, length);
    if (!cleanDigits) return;

    onChange(cleanDigits);

    const targetIndex = Math.min(cleanDigits.length, length - 1);
    inputRefs.current[targetIndex]?.focus();
  };

  return (
    <div className={cn("flex items-center justify-center gap-2 sm:gap-3", className)}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            "size-11 sm:size-12 rounded-xl border border-border bg-card text-center text-lg font-bold text-foreground shadow-sm transition-all",
            "focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            digit ? "border-primary/50 bg-primary-soft/30" : "hover:border-primary/40"
          )}
          aria-label={`Digit ${index + 1} of ${length}`}
        />
      ))}
    </div>
  );
}

export default OtpInput;
