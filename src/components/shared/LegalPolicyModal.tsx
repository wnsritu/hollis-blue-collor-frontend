import React, { useState, useEffect } from "react";
import { X, FileText, Shield, Loader2, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLegalPolicies } from "@/services/auth/auth.service";

interface LegalPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "terms" | "privacy";
  onAccept?: () => void;
  showAcceptButton?: boolean;
}

export function FormattedPolicyContent({ content }: { content: string }) {
  if (!content || !content.trim()) {
    return <p className="text-muted-foreground italic py-8 text-center">No policy content available.</p>;
  }

  // If content contains HTML markup (e.g., from CKEditor), render it cleanly as HTML
  if (/<[a-z][\s\S]*>/i.test(content)) {
    return (
      <div
        className="prose prose-sm dark:prose-invert max-w-none text-foreground space-y-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-1.5 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:my-3 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:my-3 [&_ol]:space-y-1 [&_li]:text-muted-foreground [&_li]:leading-relaxed [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_p]:my-2 [&_strong]:text-foreground [&_strong]:font-semibold [&_hr]:my-5 [&_hr]:border-border [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:p-2 [&_td]:border [&_td]:border-border [&_td]:p-2 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Parse lines into clean structured elements (legacy Markdown fallback)
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === "ul") {
        elements.push(
          <ul key={`ul-${elements.length}`} className="my-3 space-y-1.5 list-disc list-inside text-muted-foreground">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed text-sm">
                {renderInlineFormatting(item)}
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${elements.length}`} className="my-3 space-y-1.5 list-decimal list-inside text-muted-foreground">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed text-sm">
                {renderInlineFormatting(item)}
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  const renderInlineFormatting = (text: string) => {
    // Basic parser for **bold**
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    if (line.startsWith("---") || line.startsWith("***")) {
      flushList();
      elements.push(<hr key={`hr-${index}`} className="my-5 border-border" />);
      return;
    }

    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={`h1-${index}`} className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-4 mb-2">
          {renderInlineFormatting(line.slice(2))}
        </h1>
      );
      return;
    }

    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={`h2-${index}`} className="text-lg sm:text-xl font-bold tracking-tight text-foreground mt-5 mb-2">
          {renderInlineFormatting(line.slice(3))}
        </h2>
      );
      return;
    }

    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={`h3-${index}`} className="text-base sm:text-lg font-semibold text-foreground mt-4 mb-1.5">
          {renderInlineFormatting(line.slice(4))}
        </h3>
      );
      return;
    }

    // Bullet lists: - or *
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const itemText = line.slice(2);
      if (currentList && currentList.type === "ul") {
        currentList.items.push(itemText);
      } else {
        flushList();
        currentList = { type: "ul", items: [itemText] };
      }
      return;
    }

    // Numbered lists: 1. or 1)
    const numMatch = line.match(/^(\d+)[\.\)]\s+(.*)/);
    if (numMatch) {
      const itemText = numMatch[2];
      if (currentList && currentList.type === "ol") {
        currentList.items.push(itemText);
      } else {
        flushList();
        currentList = { type: "ol", items: [itemText] };
      }
      return;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${index}`} className="my-2 text-sm leading-relaxed text-muted-foreground">
        {renderInlineFormatting(line)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-1">{elements}</div>;
}

export function LegalPolicyModal({
  isOpen,
  onClose,
  initialTab = "terms",
  onAccept,
  showAcceptButton = false,
}: LegalPolicyModalProps) {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">(initialTab);
  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState<{
    terms_and_conditions?: string;
    privacy_policy?: string;
    platform_name?: string;
    updated_at?: string;
  }>({});

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchPolicies = async () => {
      try {
        setLoading(true);
        const res = await getLegalPolicies();
        if (isMounted && res?.data) {
          setPolicies(res.data);
        }
      } catch (err) {
        console.error("Failed to load legal policies:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPolicies();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentContent =
    activeTab === "terms"
      ? policies.terms_and_conditions || ""
      : policies.privacy_policy || "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-3xl max-h-[88vh] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/40">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              {activeTab === "terms" ? <FileText size={18} /> : <Shield size={18} />}
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {activeTab === "terms" ? "Terms & Conditions" : "Privacy Policy"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {policies.platform_name || "Hollis"} • Platform Agreement
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switch bar */}
        <div className="px-6 pt-3 pb-2 border-b border-border bg-card">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "terms" | "privacy")}>
            <TabsList className="grid w-full grid-cols-2 max-w-xs h-9">
              <TabsTrigger value="terms" className="text-xs font-semibold gap-1.5">
                <FileText size={14} /> Terms & Conditions
              </TabsTrigger>
              <TabsTrigger value="privacy" className="text-xs font-semibold gap-1.5">
                <Shield size={14} /> Privacy Policy
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 size={28} className="animate-spin text-primary" />
              <p className="text-sm font-medium">Loading document...</p>
            </div>
          ) : (
            <FormattedPolicyContent content={currentContent} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/20">
          <p className="text-xs text-muted-foreground hidden sm:block">
            {policies.updated_at
              ? `Last updated: ${new Date(policies.updated_at).toLocaleDateString()}`
              : "Applies to all Hollis accounts"}
          </p>
          <div className="flex items-center gap-2.5 ml-auto">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {showAcceptButton && onAccept && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
              >
                <Check size={14} /> Accept & Continue
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LegalPolicyModal;
