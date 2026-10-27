import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { FileText, Shield, Loader2, ArrowLeft } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormattedPolicyContent } from "@/components/shared/LegalPolicyModal";
import { getLegalPolicies } from "@/services/auth/auth.service";

export default function LegalPage() {
  const location = useLocation();
  const initialTab = location.pathname.includes("privacy") ? "privacy" : "terms";
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">(initialTab);
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<{
    terms_and_conditions?: string;
    privacy_policy?: string;
    platform_name?: string;
    updated_at?: string;
  }>({});

  useEffect(() => {
    setActiveTab(location.pathname.includes("privacy") ? "privacy" : "terms");
  }, [location.pathname]);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setLoading(true);
        const res = await getLegalPolicies();
        if (res?.data) {
          setPolicies(res.data);
        }
      } catch (err) {
        console.error("Failed to load policies:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPolicies();
  }, []);

  const currentContent =
    activeTab === "terms"
      ? policies.terms_and_conditions || ""
      : policies.privacy_policy || "";

  return (
    <div className="container-page py-12 max-w-4xl min-h-[70vh]">
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Home
        </Link>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {activeTab === "terms" ? "Terms & Conditions" : "Privacy Policy"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {policies.updated_at
            ? `Effective and last updated: ${new Date(policies.updated_at).toLocaleDateString()}`
            : "Official platform policy"}
        </p>
      </div>

      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "terms" | "privacy")}>
          <TabsList className="grid w-full sm:w-80 grid-cols-2">
            <TabsTrigger value="terms" className="gap-2 text-xs sm:text-sm font-semibold">
              <FileText size={15} /> Terms & Conditions
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2 text-xs sm:text-sm font-semibold">
              <Shield size={15} /> Privacy Policy
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-sm font-medium">Loading document...</p>
          </div>
        ) : (
          <FormattedPolicyContent content={currentContent} />
        )}
      </div>
    </div>
  );
}
