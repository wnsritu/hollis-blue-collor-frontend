import { X } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface ServiceChipsInputProps {
  value: string[];
  onChange: (chips: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function ServiceChipsInput({
  value = [],
  onChange,
  placeholder = "Type service name and press Enter or Comma...",
  className,
}: ServiceChipsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addChip = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Avoid duplicate within current chips (case-insensitive)
    if (value.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setInputValue("");
      return;
    }

    onChange([...value, trimmed]);
    setInputValue("");
  };

  const removeChip = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addChip(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeChip(value.length - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text/plain");
    // Split by comma or newline
    const items = pastedText
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (items.length > 0) {
      const newChips = [...value];
      items.forEach((item) => {
        if (!newChips.some((c) => c.toLowerCase() === item.toLowerCase())) {
          newChips.push(item);
        }
      });
      onChange(newChips);
      setInputValue("");
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className={cn(
        "min-h-[52px] w-full cursor-text rounded-xl border border-border bg-card p-2.5 transition-all flex flex-wrap items-center gap-2",
        "focus-within:border-primary focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/20",
        className
      )}
    >
      {value.map((chip, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-soft text-primary px-3 py-1.5 text-xs font-semibold shadow-xs transition-all animate-in fade-in zoom-in-95"
        >
          <span>{chip}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeChip(idx);
            }}
            className="rounded-full p-0.5 hover:bg-primary/20 hover:text-primary transition-colors focus:outline-none"
            aria-label={`Remove ${chip}`}
          >
            <X size={13} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={() => {
          if (inputValue.trim()) {
            addChip(inputValue);
          }
        }}
        placeholder={value.length === 0 ? placeholder : "Add another service..."}
        className="flex-1 min-w-[160px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none border-none py-1 px-1"
      />
    </div>
  );
}

export default ServiceChipsInput;
