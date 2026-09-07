import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, AlertCircle, ExternalLink } from "lucide-react";
import { resolveMediaUrl } from "@/utils/mediaUrl";

export interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentUrl?: string | null;
  title?: string;
  filename?: string;
  description?: string;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  open,
  onOpenChange,
  documentUrl,
  title = "Document Preview",
  filename,
  description,
}) => {
  const fullUrl = documentUrl ? resolveMediaUrl(documentUrl) : undefined;
  const lowerUrl = (fullUrl || "").toLowerCase();

  const isPdf = lowerUrl.endsWith(".pdf") || lowerUrl.includes(".pdf");
  const isImage =
    lowerUrl.endsWith(".jpg") ||
    lowerUrl.endsWith(".jpeg") ||
    lowerUrl.endsWith(".png") ||
    lowerUrl.endsWith(".webp") ||
    lowerUrl.endsWith(".gif") ||
    lowerUrl.endsWith(".svg") ||
    lowerUrl.includes("/images/") ||
    lowerUrl.includes("/uploads/");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center justify-between gap-2">
            <span className="truncate">{title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-black/5 p-4 text-center flex flex-col items-center justify-center min-h-[300px]">
          {fullUrl ? (
            isPdf ? (
              <iframe
                src={fullUrl}
                title={title}
                className="w-full h-[500px] rounded-lg border border-border bg-white"
              />
            ) : isImage ? (
              <img
                src={fullUrl}
                alt={title}
                className="max-h-[500px] w-full object-contain rounded-lg shadow-sm"
                onError={(e) => {
                  // Fallback for broken images
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="space-y-3 py-10">
                <FileText size={48} className="mx-auto text-primary" />
                <p className="font-bold text-sm text-foreground">
                  {filename || "Attached Document"}
                </p>
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
                <Button size="sm" asChild variant="outline" className="gap-1.5 text-xs">
                  <a href={fullUrl} target="_blank" rel="noreferrer">
                    <ExternalLink size={14} /> Open in New Tab
                  </a>
                </Button>
              </div>
            )
          ) : (
            <div className="space-y-3 py-10">
              <AlertCircle size={44} className="mx-auto text-warning" />
              <p className="font-bold text-sm text-foreground">
                {filename || "File Preview Unavailable"}
              </p>
              <p className="text-xs text-muted-foreground">
                {description || "No document URL is available for preview."}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground truncate max-w-xs">
            {filename || fullUrl || "Document"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            {fullUrl && (
              <Button size="sm" asChild className="gap-1.5 text-xs">
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                >
                  <Download size={14} /> Download Document
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewModal;
