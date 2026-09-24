import React from "react";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  id?: string;
  label?: React.ReactNode;
  required?: boolean;
  error?: string | null;
  helperText?: string;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  required = false,
  error,
  helperText,
  className,
  children,
}) => {
  return (
    <div className={cn("grid gap-1.5", className)}>
      {label && (
        <Label htmlFor={id} className="text-sm font-medium text-foreground flex items-center justify-between">
          <span>
            {label}
            {required && <span className="ml-1 font-bold text-destructive">*</span>}
          </span>
        </Label>
      )}

      {children}

      {error ? (
        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-destructive transition-all">
          <AlertCircle size={13} className="shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
};

export default FormField;
