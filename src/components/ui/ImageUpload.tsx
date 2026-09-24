import React, { useEffect, useRef, useState } from "react";
import { Camera, Image as ImageIcon, Trash2, Upload, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  validateImageFile,
  formatFileSize,
  MAX_IMAGE_SIZE_BYTES,
  DEFAULT_ALLOWED_IMAGE_TYPES,
} from "@/validations/common/file";

export interface ImageUploadProps {
  id?: string;
  label?: string;
  required?: boolean;
  value?: File | string | null;
  onChange: (file: File | null) => void;
  maxSizeBytes?: number;
  accept?: string;
  previewUrl?: string | null;
  disabled?: boolean;
  error?: string | null;
  helperText?: string;
  className?: string;
  aspectRatio?: "square" | "cover" | "avatar";
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  id = "image-upload-input",
  label,
  required = false,
  value,
  onChange,
  maxSizeBytes = MAX_IMAGE_SIZE_BYTES,
  accept = "image/jpeg,image/png,image/webp,image/gif",
  previewUrl: externalPreviewUrl,
  disabled = false,
  error: externalError,
  helperText,
  className,
  aspectRatio = "square",
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  // Manage object URL creation & memory cleanup
  useEffect(() => {
    if (value instanceof File) {
      const objectUrl = URL.createObjectURL(value);
      setLocalPreviewUrl(objectUrl);
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } else if (typeof value === "string" && value.trim()) {
      setLocalPreviewUrl(value);
    } else if (externalPreviewUrl) {
      setLocalPreviewUrl(externalPreviewUrl);
    } else {
      setLocalPreviewUrl(null);
    }
  }, [value, externalPreviewUrl]);

  const activeError = externalError || internalError;
  const currentFileName = value instanceof File ? value.name : null;
  const currentFileSize = value instanceof File ? formatFileSize(value.size) : null;

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setInternalError(null);

    if (!selectedFile) return;

    // Perform client-side 5MB max size and MIME type validation
    const validation = validateImageFile(selectedFile, {
      maxSizeBytes,
      allowedTypes: accept.split(",").map((t) => t.trim()),
    });

    if (!validation.valid) {
      setInternalError(validation.error || "Invalid image file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    onChange(selectedFile);
  };

  const handleRemove = () => {
    setInternalError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onChange(null);
  };

  const handleChangeClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("grid gap-2", className)}>
      {label && (
        <Label htmlFor={id} className="text-sm font-medium text-foreground flex items-center justify-between">
          <span>
            {label}
            {required && <span className="ml-1 font-bold text-destructive">*</span>}
          </span>
        </Label>
      )}

      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleFileSelection}
        className="hidden"
      />

      {localPreviewUrl ? (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Preview image */}
            <div
              className={cn(
                "relative overflow-hidden rounded-xl bg-muted shrink-0 border border-border/80",
                aspectRatio === "avatar" ? "size-20 rounded-full" : "size-24 rounded-xl"
              )}
            >
              <img
                src={localPreviewUrl}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Image Details & Action Buttons */}
            <div className="min-w-0 flex-1 text-center sm:text-left space-y-1">
              {currentFileName ? (
                <>
                  <p className="truncate text-sm font-semibold text-foreground">{currentFileName}</p>
                  {currentFileSize && (
                    <p className="text-xs text-muted-foreground">{currentFileSize} · Max 5 MB</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-foreground">Current Image</p>
                  <p className="text-xs text-muted-foreground">Uploaded &amp; active</p>
                </>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={handleChangeClick}
                  className="h-8 gap-1.5 text-xs font-medium"
                >
                  <RefreshCw size={13} />
                  Change
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={handleRemove}
                  className="h-8 gap-1.5 text-xs font-medium text-destructive hover:bg-destructive-soft hover:text-destructive"
                >
                  <Trash2 size={13} />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Upload Drop Area */
        <button
          type="button"
          disabled={disabled}
          onClick={handleChangeClick}
          className={cn(
            "group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6 text-center transition-all hover:border-primary hover:bg-primary-soft/30 focus:outline-none focus:ring-2 focus:ring-primary/20",
            activeError && "border-destructive/60 bg-destructive-soft/20",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-card shadow-xs text-primary transition-transform group-hover:scale-105">
            <Upload size={20} />
          </span>
          <p className="mt-3 text-sm font-semibold text-foreground">
            Click to upload image
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            JPEG, PNG, WEBP or GIF up to <strong className="text-foreground">5 MB</strong>
          </p>
        </button>
      )}

      {activeError ? (
        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-destructive transition-all">
          <AlertCircle size={13} className="shrink-0" />
          <span>{activeError}</span>
        </p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
};

export default ImageUpload;
