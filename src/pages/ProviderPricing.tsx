import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Home, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PageHeader, StatusPill } from "@/components/shared/primitives";
import { catalogApi } from "@/api/modules/catalog.api";
import { providerApi } from "@/api/modules/provider.api";
import { userApi } from "@/api/modules/user.api";
import type { Category } from "@/types/api/catalog";

function unwrapData<T>(res: any): T {
  if (!res) return res;
  return res.data !== undefined ? res.data : res;
}

interface ProviderServiceConfig {
  price: number;
  offered: boolean;
  unit: string;
}

export default function ProviderPricing() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [provider, setProvider] = useState<any>(null);

  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});
  const [pricingState, setPricingState] = useState<Record<string, ProviderServiceConfig>>({});

  const toggleAccordion = (subId: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [subId]: !prev[subId],
    }));
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [catRes, meRes, userRes] = await Promise.all([
        catalogApi.getTree().catch(() => null),
        providerApi.getMyMarketplaceProfile().catch(() => null),
        userApi.getMyProfile().catch(() => null),
      ]);

      const cats = unwrapData<Category[]>(catRes);
      if (Array.isArray(cats)) setCategories(cats);

      const pData = unwrapData<any>(meRes) || unwrapData<any>(userRes)?.provider;
      setProvider(pData);

      // Initialize accordion open states
      const initialOpen: Record<string, boolean> = {};
      if (pData?.service_type_id) {
        initialOpen[String(pData.service_type_id)] = true;
      }
      setOpenAccordions(initialOpen);

      // Initialize pricing state from provider's service_pricing & offered_services
      let offeredRaw = pData?.offered_services || pData?.services || [];
      if (typeof offeredRaw === "string") {
        try {
          offeredRaw = JSON.parse(offeredRaw);
        } catch (e) {
          offeredRaw = [];
        }
      }
      const offeredList = Array.isArray(offeredRaw)
        ? offeredRaw.map((s: any) => (typeof s === "string" ? s : s.name || String(s)))
        : [];

      let savedPricing: any = pData?.service_pricing || pData?.pricing || {};
      if (typeof savedPricing === "string") {
        try {
          savedPricing = JSON.parse(savedPricing);
        } catch (e) {
          savedPricing = {};
        }
      }

      const initPricing: Record<string, ProviderServiceConfig> = {};

      if (Array.isArray(cats)) {
        cats.forEach((c) => {
          c.service_types?.forEach((st) => {
            st.services?.forEach((svc, idx) => {
              const svcKey = String(svc.id || svc.name);
              const savedConfig = savedPricing[svcKey] || savedPricing[svc.name];

              const isOffered =
                savedConfig?.offered !== undefined
                  ? Boolean(savedConfig.offered)
                  : offeredList.includes(svc.name) || offeredList.includes(svcKey);

              const priceVal =
                savedConfig?.price !== undefined
                  ? Number(savedConfig.price)
                  : (idx + 1) * 45 + 30;

              const unitVal = savedConfig?.unit || (idx % 2 === 0 ? "flat rate" : "per job");

              const configObj: ProviderServiceConfig = {
                price: priceVal,
                offered: isOffered,
                unit: unitVal,
              };

              initPricing[svcKey] = configObj;
              initPricing[svc.name] = configObj;
            });
          });
        });
      }
      setPricingState(initPricing);
    } catch (err) {
      console.error("Failed to load provider pricing data", err);
      toast.error("Failed to load Services & Pricing data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Selected Category & Subcategory
  const parentCategoryObj =
    categories.find((c) => String(c.id) === String(provider?.category_id || provider?.category?.id)) ||
    categories.find((c) => c.name === provider?.category?.name) ||
    categories[0];

  const selectedSubcategoryId =
    provider?.service_type_id != null
      ? String(provider.service_type_id)
      : provider?.sub_category?.id != null
      ? String(provider.sub_category.id)
      : provider?.category?.service_types?.[0]?.id != null
      ? String(provider.category.service_types[0].id)
      : provider?.service_types?.[0]?.id != null
      ? String(provider.service_types[0].id)
      : null;

  const selectedSubcategories = parentCategoryObj?.service_types
    ? selectedSubcategoryId
      ? parentCategoryObj.service_types.filter((sub) => String(sub.id) === selectedSubcategoryId)
      : [parentCategoryObj.service_types[0]].filter(Boolean)
    : [];

  const getConfig = (svcKey: string, defaultPrice = 100): ProviderServiceConfig => {
    return (
      pricingState[svcKey] || {
        price: defaultPrice,
        offered: true,
        unit: "flat rate",
      }
    );
  };

  const updateServiceConfig = (svcKey: string, patch: Partial<ProviderServiceConfig>) => {
    setPricingState((prev) => ({
      ...prev,
      [svcKey]: {
        ...getConfig(svcKey),
        ...patch,
      },
    }));
  };

  const handleSavePricing = async () => {
    try {
      setSaving(true);
      // Collect all service names where offered === true and map service_pricing object
      const offeredServiceNames: string[] = [];
      const servicePricingObj: Record<string, ProviderServiceConfig> = {};

      selectedSubcategories.forEach((sub) => {
        const rawServices =
          sub.services && sub.services.length > 0
            ? sub.services
            : [
                { id: 101, name: `General ${sub.name} Repair`, is_active: true },
                { id: 102, name: `${sub.name} Installation & Setup`, is_active: true },
                { id: 103, name: `Emergency ${sub.name} Service`, is_active: true },
                { id: 104, name: `Routine ${sub.name} Maintenance`, is_active: true },
              ];
        const activeServices = rawServices.filter((svc: any) => svc.is_active !== false);

        activeServices.forEach((svc: any) => {
          const svcKey = String(svc.id || svc.name);
          const cfg = getConfig(svcKey);
          const nameKey = svc.name || svcKey;
          servicePricingObj[nameKey] = cfg;

          if (cfg.offered) {
            offeredServiceNames.push(svc.name);
          }
        });
      });

      await providerApi.updateMyMarketplaceProfile({
        offered_services: offeredServiceNames,
        services: offeredServiceNames,
        service_pricing: servicePricingObj,
      });

      toast.success("Services & Pricing saved successfully!", {
        description: "Your updated prices and offering statuses are live for bookings.",
      });
    } catch (err) {
      console.error("Failed to save pricing", err);
      toast.error("Failed to save Services & Pricing.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 size={36} className="animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading Services &amp; Pricing...</p>
      </div>
    );
  }

  const parentName = parentCategoryObj?.name || provider?.category?.name || "Home Services";
  const selectedSubName = selectedSubcategories[0]?.name || "Service Area";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Services & Pricing"
        subtitle="Manage rates for your selected service category and areas."
        action={
          <Button onClick={handleSavePricing} disabled={saving} className="gap-2 shadow-sm">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
          </Button>
        }
      />

      {/* Selected Parent Category Badge Banner */}
      <div className="rounded-2xl border border-primary/20 bg-primary-soft/40 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground font-bold">
            <Home size={20} />
          </span>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Service Category</p>
            <h2 className="text-base font-extrabold text-foreground">{parentName}</h2>
          </div>
        </div>
        <span className="rounded-full bg-primary/10 text-primary font-bold text-xs px-3 py-1">
          1 Selected Subcategory ({selectedSubName})
        </span>
      </div>

      {/* Accordion Subcategories List */}
      <div className="space-y-6">
        {selectedSubcategories.map((sub) => {
          const isOpen = openAccordions[String(sub.id)] ?? true;
          const rawServices =
            sub.services && sub.services.length > 0
              ? sub.services
              : [
                  { id: 101, name: `General ${sub.name} Repair`, is_active: true },
                  { id: 102, name: `${sub.name} Installation & Setup`, is_active: true },
                  { id: 103, name: `Emergency ${sub.name} Service`, is_active: true },
                  { id: 104, name: `Routine ${sub.name} Maintenance`, is_active: true },
                ];
          const serviceItems = rawServices.filter((svc: any) => svc.is_active !== false);
          return (
            <Card key={sub.id} className="shadow-card overflow-hidden transition-all">
              {/* Accordion Header */}
              <CardHeader
                onClick={() => toggleAccordion(String(sub.id))}
                className="bg-card hover:bg-muted/30 border-b border-border cursor-pointer select-none py-4 px-5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base font-bold text-foreground">
                      {sub.name}
                    </CardTitle>
                    <span className="text-xs font-semibold rounded-full bg-secondary px-2.5 py-0.5 text-foreground">
                      {serviceItems.length} active services
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="size-8">
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </Button>
                </div>
              </CardHeader>

              {/* Accordion Content with Fixed Height & Vertical Internal Scroll */}
              {isOpen && (
                <CardContent className="p-0">
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-border pr-1">
                    {serviceItems.length === 0 ? (
                      <p className="p-6 text-xs text-muted-foreground text-center">
                        No active services listed under this subcategory.
                      </p>
                    ) : (
                      serviceItems.map((svc, idx) => {
                        const svcKey = String(svc.id || svc.name);
                        const config = getConfig(svcKey, (idx + 1) * 50);
                        return (
                          <div
                            key={svc.id || idx}
                            className={`p-4 sm:p-5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                              config.offered ? "bg-card" : "bg-muted/20 opacity-75"
                            }`}
                          >
                            {/* Service Title & Details */}
                            <div className="space-y-1 min-w-0 max-w-md">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-foreground">
                                  {svc.name}
                                </span>
                                <StatusPill status={svc.is_active !== false ? "Active" : "Inactive"} />
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {svc.description || "Platform service available for provider pricing."}
                              </p>
                            </div>

                            {/* Service Controls: Offered Toggle & Price Input */}
                            <div className="flex items-center gap-4 shrink-0 flex-wrap sm:flex-nowrap">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={config.offered}
                                  onCheckedChange={(checked) =>
                                    updateServiceConfig(svcKey, { offered: checked })
                                  }
                                  aria-label={`Toggle ${svc.name}`}
                                />
                                <span className="text-xs font-medium text-muted-foreground">
                                  {config.offered ? "Provided" : "Not Provided"}
                                </span>
                              </div>

                              {config.offered && (
                                <div className="flex items-center gap-2">
                                  <div className="relative w-28">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                                      $
                                    </span>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="5"
                                      value={config.price}
                                      onChange={(e) =>
                                        updateServiceConfig(svcKey, {
                                          price: parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      className="pl-7 h-9 text-xs font-bold"
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground font-medium">
                                    /{config.unit}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}

        {/* Bottom Save Action */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSavePricing} disabled={saving} size="lg" className="gap-2 shadow-sm">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Services &amp; Pricing
          </Button>
        </div>
      </div>
    </div>
  );
}
