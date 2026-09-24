export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const DEFAULT_ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const DEFAULT_ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface ValidateFileOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  customSizeErrorMsg?: string;
  customTypeErrorMsg?: string;
}

/**
 * Validates image files according to global 5MB max size and MIME type requirements.
 */
export function validateImageFile(
  file: File | null | undefined,
  options?: ValidateFileOptions
): FileValidationResult {
  if (!file) {
    return { valid: false, error: "Please select an image file." };
  }

  const maxBytes = options?.maxSizeBytes ?? MAX_IMAGE_SIZE_BYTES;
  const allowed = options?.allowedTypes ?? DEFAULT_ALLOWED_IMAGE_TYPES;

  // Type validation
  if (file.type && allowed.length > 0) {
    const fileTypeLower = file.type.toLowerCase();
    const isAllowedType = allowed.some((t) =>
      fileTypeLower.includes(t.toLowerCase().replace("image/", "")) ||
      t.toLowerCase() === fileTypeLower
    );
    if (!isAllowedType) {
      return {
        valid: false,
        error:
          options?.customTypeErrorMsg ||
          "Please upload a valid image file (JPEG, PNG, WEBP, GIF).",
      };
    }
  }

  // Size validation (5 MB maximum)
  if (file.size > maxBytes) {
    const maxMb = (maxBytes / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error:
        options?.customSizeErrorMsg ||
        `Image size must be ${maxMb} MB or less.`,
    };
  }

  return { valid: true };
}

/**
 * Validates document files according to max size and type rules.
 */
export function validateDocumentFile(
  file: File | null | undefined,
  options?: ValidateFileOptions
): FileValidationResult {
  if (!file) {
    return { valid: false, error: "Please select a document file." };
  }

  const maxBytes = options?.maxSizeBytes ?? MAX_DOCUMENT_SIZE_BYTES;
  const allowed = options?.allowedTypes ?? DEFAULT_ALLOWED_DOCUMENT_TYPES;

  if (file.type && allowed.length > 0) {
    const fileTypeLower = file.type.toLowerCase();
    const isAllowedType = allowed.some((t) =>
      fileTypeLower.includes(t.toLowerCase().replace("*", ""))
    );
    if (!isAllowedType) {
      return {
        valid: false,
        error:
          options?.customTypeErrorMsg ||
          "Please upload a valid document file (PDF, PNG, JPEG, DOC).",
      };
    }
  }

  if (file.size > maxBytes) {
    const maxMb = (maxBytes / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error:
        options?.customSizeErrorMsg ||
        `File size must be ${maxMb} MB or less.`,
    };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
