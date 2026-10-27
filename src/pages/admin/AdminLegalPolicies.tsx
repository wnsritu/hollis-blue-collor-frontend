import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FileText,
  Shield,
  Save,
  RotateCcw,
  Eye,
  Columns,
  Edit3,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/primitives";
import { FormattedPolicyContent } from "@/components/shared/LegalPolicyModal";
import { getPlatformSettings, updatePlatformSettings } from "@/services/admin";

const DEFAULT_TERMS_TEMPLATE = `# Terms of Service & Conditions

**Effective Date:** October 2026  
**Platform:** Hollis

Welcome to Hollis. These Terms and Conditions ("Terms") govern your access to and use of our website, mobile applications, and services connecting customers with independent blue-collar service professionals (collectively, the "Platform").

---

### 1. Overview & Platform Role
Hollis operates as a two-sided marketplace connecting homeowners and businesses ("Customers") with licensed, insured, or vetted independent service professionals ("Providers"). Hollis is not an employer, contractor, or direct provider of blue-collar services. Each Provider operates an independent business entity.

### 2. User Accounts & Registration
- Users must be at least 18 years of age.
- You agree to provide accurate, current, and complete registration information.
- Providers must complete mandatory identity verification, background checks, and trade licensing documentation before profile activation.
- You are responsible for safeguarding your login credentials.

### 3. Services, Bookings & Proposals
- Customers may browse services, submit project requests, or request custom quotations.
- Providers review requests and submit itemized proposals outlining scope, material costs, labor fees, and estimated milestones.
- Acceptance of a proposal creates a direct service agreement between Customer and Provider.

### 4. Payments, Pricing & Escrow Protection
- All payments must be processed securely through the Platform via our payment partners (Stripe).
- Total pricing includes provider labor/materials, platform service fees, and applicable taxes.
- For milestone and booking jobs, customer funds are held securely and released upon job completion or verified milestones.

### 5. Cancellations & Refunds
- Cancellations made within the grace period receive a full or partial refund in accordance with the Platform's cancellation policy.
- Late cancellations or provider no-shows are subject to platform review and fee adjustments.

### 6. Dispute Resolution
- In the event of a dispute regarding service quality, incomplete work, or payment issues, either party may file a dispute through the Resolution Center within 24 hours of scheduled completion.
- Hollis admin team reviews evidence submitted by both parties to make a fair, binding decision.

### 7. User Conduct & Direct Payment Prohibition
- Users agree to communicate respectfully and adhere to safety standards.
- Circumventing the Platform to make or receive off-platform payments for Hollis leads is strictly prohibited and subject to immediate account termination.

### 8. Limitation of Liability & Indemnification
Hollis is not liable for indirect, incidental, or consequential damages resulting from third-party services. Users agree to indemnify and hold harmless Hollis and its affiliates from claims arising from platform use.

### 9. Modifications to Terms
Hollis reserves the right to modify these Terms at any time. Continued use of the platform after updates constitutes acceptance of the revised Terms.

---
For questions regarding these Terms, contact our support team at support@hollis.com.`;

const DEFAULT_PRIVACY_TEMPLATE = `# Privacy Policy

**Effective Date:** October 2026  
**Platform:** Hollis

Hollis ("we", "our", or "us") is dedicated to protecting your privacy. This Privacy Policy outlines how we collect, use, disclose, and safeguard your personal information when you use our website, mobile apps, and marketplace platform.

---

### 1. Information We Collect
- **Account Information:** Name, email address, phone number, physical address, and password.
- **Provider Verification Data:** Business registration, government-issued identification, tax IDs, certifications, and background check records.
- **Transaction & Payment Details:** Payment card details, billing address, bank payout information (processed securely through Stripe; we do not store full card numbers).
- **Service & Communication Data:** Job descriptions, project photos, messages between customers and providers, customer reviews, and dispute evidence.
- **Device & Usage Information:** IP address, browser type, location data (approximate location for matching; full street address shared only upon booking confirmation).

### 2. How We Use Your Information
- Facilitate customer and provider connections, quote requests, and service bookings.
- Process payments, refunds, and provider payouts.
- Verify provider credentials and ensure marketplace safety.
- Send transactional notifications (booking updates, payment receipts, messages).
- Enhance platform performance, prevent fraud, and comply with legal obligations.

### 3. Information Sharing & Disclosure
- **Between Users:** We share necessary project details and approximate location with providers to generate quotes. Exact service addresses are revealed only after a booking is confirmed and paid.
- **Service Providers & Processors:** Trusted vendors assisting with payment processing (Stripe), email delivery, and cloud infrastructure under strict confidentiality agreements.
- **Legal Requirements:** We may disclose information if required by applicable law, court order, or governmental authority.

### 4. Data Security & Retention
We implement industry-standard administrative, technical, and physical safeguards (including SSL encryption and tokenized payments) to protect your personal data. We retain information as long as necessary to fulfill account and regulatory requirements.

### 5. Your Rights & Choices
- You may access, review, or update your profile information in your account settings.
- You can manage email and push notification preferences.
- You may request account deletion or data portability subject to legal retention obligations by contacting support.

### 6. Cookies & Tracking Technologies
We use session and analytics cookies to remember your preferences and analyze marketplace usage. You can adjust your browser settings to decline cookies if preferred.

### 7. Children's Privacy
Our platform is not intended for individuals under 18 years of age. We do not knowingly collect personal data from minors.

### 8. Updates to this Policy
We may update this Privacy Policy periodically. Significant changes will be posted on this page with an updated effective date.

---
If you have questions about this Privacy Policy, please reach out to us at privacy@hollis.com or support@hollis.com.`;

export function AdminLegalPolicies() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current active document from pathname: /admin/privacy-policy or /admin/terms
  const isPrivacyRoute = location.pathname.includes("privacy");
  const activeTab: "terms" | "privacy" = isPrivacyRoute ? "privacy" : "terms";

  const [viewMode, setViewMode] = useState<"split" | "edit" | "preview">("split");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [termsContent, setTermsContent] = useState("");
  const [privacyContent, setPrivacyContent] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setLoading(true);
        const res: any = await getPlatformSettings();
        const data = res?.data?.data || res?.data || res?.settings || res;
        if (data) {
          setTermsContent(data.terms_and_conditions || DEFAULT_TERMS_TEMPLATE);
          setPrivacyContent(data.privacy_policy || DEFAULT_PRIVACY_TEMPLATE);
          if (data.updated_at) {
            setLastUpdated(data.updated_at);
          }
        }
      } catch (err: any) {
        console.error("Failed to load legal policies:", err);
        toast.error("Failed to load current policies. You can still edit and save.");
        setTermsContent(DEFAULT_TERMS_TEMPLATE);
        setPrivacyContent(DEFAULT_PRIVACY_TEMPLATE);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, []);

  const handleTabChange = (nextTab: string) => {
    if (nextTab === "privacy") {
      navigate("/admin/privacy-policy");
    } else {
      navigate("/admin/terms");
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        terms_and_conditions: termsContent,
        privacy_policy: privacyContent,
      };

      await updatePlatformSettings(payload);
      setLastUpdated(new Date().toISOString());
      toast.success(
        activeTab === "terms"
          ? "Terms & Conditions saved successfully."
          : "Privacy Policy saved successfully."
      );
    } catch (err: any) {
      console.error("Failed to save policy:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to save policy.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (
      window.confirm(
        `Are you sure you want to reset ${
          activeTab === "terms" ? "Terms & Conditions" : "Privacy Policy"
        } to the standard recommended template? This will replace unsaved edits.`
      )
    ) {
      if (activeTab === "terms") {
        setTermsContent(DEFAULT_TERMS_TEMPLATE);
      } else {
        setPrivacyContent(DEFAULT_PRIVACY_TEMPLATE);
      }
      toast.success("Standard template loaded. Remember to click Save.");
    }
  };

  const currentContent = activeTab === "terms" ? termsContent : privacyContent;
  const setCurrentContent = activeTab === "terms" ? setTermsContent : setPrivacyContent;

  const wordCount = currentContent.trim() ? currentContent.trim().split(/\s+/).length : 0;
  const charCount = currentContent.length;

  const insertSnippet = (snippet: string) => {
    setCurrentContent((prev) => prev + "\n" + snippet);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={activeTab === "terms" ? "Terms & Conditions" : "Privacy Policy"}
        subtitle="Manage the legal policies displayed to customers and providers during signup and across the platform."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToDefault}
              disabled={loading || saving}
              className="gap-1.5"
            >
              <RotateCcw size={15} /> Reset to Default
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={loading || saving}
              className="gap-1.5 min-w-[120px]"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={15} /> Save Policy
                </>
              )}
            </Button>
          </div>
        }
      />

      {/* TABS & VIEW CONTROLS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
          <TabsList className="grid w-full sm:w-[380px] grid-cols-2">
            <TabsTrigger value="terms" className="gap-2 text-xs sm:text-sm font-semibold">
              <FileText size={16} /> Terms & Conditions
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2 text-xs sm:text-sm font-semibold">
              <Shield size={16} /> Privacy Policy
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setViewMode("edit")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === "edit"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Edit3 size={14} /> Editor
          </button>
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === "split"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Columns size={14} /> Split View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === "preview"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye size={14} /> Live Preview
          </button>
        </div>
      </div>

      {/* EDITING / PREVIEW WORKSPACE */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm font-medium">Loading policy from database...</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Helper toolbar for quick markdown formatting */}
          {viewMode !== "preview" && (
            <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card/70 text-xs">
              <span className="font-semibold text-muted-foreground mr-1">Insert Formatting:</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => insertSnippet("### Section Title")}
              >
                + Heading
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => insertSnippet("- Bullet item")}
              >
                + Bullet list
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => insertSnippet("1. First numbered item")}
              >
                + Numbered list
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => insertSnippet("**Important note:** Details here")}
              >
                + Bold highlight
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => insertSnippet("---")}
              >
                + Divider
              </Button>
            </div>
          )}

          {/* Editor and Preview Containers */}
          <div
            className={`grid gap-6 ${
              viewMode === "split" ? "md:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {/* Editor Pane */}
            {(viewMode === "edit" || viewMode === "split") && (
              <div className="flex flex-col rounded-2xl border border-border bg-card shadow-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Edit3 size={14} className="text-primary" />
                    <span>Markdown & Text Editor</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-normal">
                    <span>{wordCount} words</span>
                    <span>{charCount} characters</span>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <Textarea
                    value={currentContent}
                    onChange={(e) => setCurrentContent(e.target.value)}
                    placeholder="Enter policy markdown text here..."
                    className="flex-1 min-h-[500px] font-mono text-sm leading-relaxed border-border resize-y focus-visible:ring-1"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Supports Markdown formatting: <code className="text-foreground"># Header</code>,{" "}
                    <code className="text-foreground">**bold**</code>,{" "}
                    <code className="text-foreground">- bullet points</code>, and{" "}
                    <code className="text-foreground">1. numbered lists</code>.
                  </p>
                </div>
              </div>
            )}

            {/* Live Preview Pane */}
            {(viewMode === "preview" || viewMode === "split") && (
              <div className="flex flex-col rounded-2xl border border-border bg-card shadow-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Eye size={14} className="text-emerald-500" />
                    <span>Customer & Provider Live Preview</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={12} /> Live Preview
                  </span>
                </div>
                <div className="p-6 flex-1 overflow-y-auto max-h-[600px] bg-background/50">
                  <div className="rounded-xl border border-border/80 bg-card p-6 shadow-sm">
                    <FormattedPolicyContent content={currentContent} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border bg-muted/30 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>
                {lastUpdated
                  ? `Last updated in database: ${new Date(lastUpdated).toLocaleString()}`
                  : "Saved in platform settings"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-primary font-medium">
              <AlertCircle size={14} />
              <span>Visible in the Customer & Provider registration modal</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLegalPolicies;
