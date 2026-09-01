import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { pricingData } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { getItems, getServices } from "@/services/item.service";
import {
  getProviderPricing,
  saveProviderPricing,
  getAddonServices,
  saveProviderAddonPricing,
} from "@/services/pricing.service";
import { useNavigate } from "react-router-dom";

import {
  DollarSign,
  Home,
  Info,
  MapPin,
  Save,
  ShoppingBag,
  Truck,
  Weight,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-hot-toast";
import { getServiceTypes } from "@/services/provider.service";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  addProviderServiceAmount,
  getProviderServiceAmount,
  getProviderData,
} from "@/api/provider.api";
import { saveBulkPricingAPI } from "@/api/pricing.api";

interface PriceRow {
  item_id: number;
  item: string;
  wash: number | null;
  fold: number | null;
  iron: number | null;
  hang: number | null;
  //  isNew?: boolean; // ✅ ADD THIS LINE
}
interface BulkPricing {
  price_per_lb: number;
  is_active: boolean;
}

const ProviderPricing = () => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [laundryItems, setLaundryItems] = useState<any[]>([]);
  const [laundryServices, setLaundryServices] = useState<any[]>([]);
  const [laundryPrices, setLaundryPrices] = useState<any[]>([]);

  const [cleaningItems, setCleaningItems] = useState<any[]>([]);
  const [cleaningServices, setCleaningServices] = useState<any[]>([]);
  const [cleaningPrices, setCleaningPrices] = useState<any[]>([]);

  const [carWashItems, setCarWashItems] = useState<any[]>([]);
  const [carWashServices, setCarWashServices] = useState<any[]>([]);
  const [carWashPrices, setCarWashPrices] = useState<any[]>([]);

  const [serviceTypes, setServiceTypes] = useState([]);
  const [fees, setFees] = useState({});

  const [providerBulk, setProviderBulk] = useState<BulkPricing | null>(null);
  const [bulkPricePerLb, setBulkPricePerLb] = useState("0");
  const [bulkEnabled, setBulkEnabled] = useState(false);
  const [allowedCategories, setAllowedCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("laundry");
  const [addonsList, setAddonsList] = useState<any[]>([]);
  const [addonPrices, setAddonPrices] = useState<Record<number, string>>({});

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const payload = JSON.parse(atob(token.split(".")[1]));
        const userId = payload.id;

        let req = {
          provider_id: userId,
        };

        const serviceRes = await getProviderServiceAmount();
        const servicesData = serviceRes.data.data;
        setServiceTypes(servicesData.services);

        const bulk = servicesData.bulk_pricing;
        setProviderBulk(bulk);
        if (bulk) {
          setBulkPricePerLb(bulk.price_per_lb ? String(bulk.price_per_lb) : "0");
          setBulkEnabled(bulk.is_active || false);
        }

        const [itemsRes, servicesRes, pricingRes, providerRes, addonsRes] = await Promise.all([
          getItems(),
          getServices(),
          getProviderPricing(req),
          getProviderData(req),
          getAddonServices(),
        ]);

        const allItems = itemsRes?.data || [];
        const allServices = servicesRes?.data || [];
        const pricing = pricingRes?.data?.item_pricing || [];
        const addonPricing = pricingRes?.data?.addon_pricing || [];
        const allAddons = addonsRes?.data || [];
        setAddonsList(allAddons);

        const formattedAddonPrices: Record<number, string> = {};
        allAddons.forEach((addon: any) => {
          const match = addonPricing.find((ap: any) => ap.addon_id === addon.id);
          formattedAddonPrices[addon.id] = match ? String(match.price) : "";
        });
        setAddonPrices(formattedAddonPrices);

        // Parse allowed service categories
        const providerObj = providerRes?.data?.data;
        if (providerObj && providerObj.service_categories) {
          const categories = typeof providerObj.service_categories === "string"
            ? JSON.parse(providerObj.service_categories)
            : providerObj.service_categories;
          setAllowedCategories(categories);

          const mappedTabs: Record<string, string> = {
            "Laundry": "laundry",
            "House Cleaning": "cleaning",
            "Car Wash": "carwash"
          };
          const firstAllowed = categories.find((cat: string) => mappedTabs[cat]);
          if (firstAllowed) {
            setActiveTab(mappedTabs[firstAllowed]);
          }
        } else {
          setAllowedCategories(["Laundry", "House Cleaning", "Car Wash"]);
          setActiveTab("laundry");
        }

        // 1. Laundry (Category 1)
        const lItems = allItems.filter((i: any) => Number(i.category_id) === 1);
        const lServices = allServices.filter((s: any) => Number(s.category_id) === 1);
        setLaundryItems(lItems);
        setLaundryServices(lServices);

        const formattedLaundry = lItems.map((item: any) => {
          const row: any = {
            item_id: item.id,
            item: item.name,
          };
          lServices.forEach((s: any) => {
            const match = pricing.find((p: any) => p.item_id === item.id && p.service_id === s.id);
            row[s.id] = match ? (match.not_offered ? null : parseFloat(match.price)) : null;
          });
          return row;
        });
        setLaundryPrices(formattedLaundry);

        // 2. House Cleaning (Category 2)
        const cItems = allItems.filter((i: any) => Number(i.category_id) === 2);
        const cServices = allServices.filter((s: any) => Number(s.category_id) === 2);
        setCleaningItems(cItems);
        setCleaningServices(cServices);

        const formattedCleaning = cItems.map((item: any) => {
          const row: any = {
            item_id: item.id,
            item: item.name,
          };
          cServices.forEach((s: any) => {
            const match = pricing.find((p: any) => p.item_id === item.id && p.service_id === s.id);
            row[s.id] = match ? (match.not_offered ? null : parseFloat(match.price)) : null;
          });
          return row;
        });
        setCleaningPrices(formattedCleaning);

        // 3. Car Wash (Category 3)
        const cwItems = allItems.filter((i: any) => Number(i.category_id) === 3);
        const cwServices = allServices.filter((s: any) => Number(s.category_id) === 3);
        setCarWashItems(cwItems);
        setCarWashServices(cwServices);

        const formattedCarWash = cwItems.map((item: any) => {
          const row: any = {
            item_id: item.id,
            item: item.name,
          };
          cwServices.forEach((s: any) => {
            const match = pricing.find((p: any) => p.item_id === item.id && p.service_id === s.id);
            row[s.id] = match ? (match.not_offered ? null : parseFloat(match.price)) : null;
          });
          return row;
        });
        setCarWashPrices(formattedCarWash);

      } catch (err) {
        console.log("ERROR:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      setFormError("");

      const payload: any[] = [];

      // Add Laundry
      laundryPrices.forEach((row) => {
        laundryServices.forEach((s) => {
          payload.push({
            item_id: row.item_id,
            service_id: s.id,
            price: row[s.id] ?? 0,
            not_offered: row[s.id] === null,
          });
        });
      });

      // Add Cleaning
      cleaningPrices.forEach((row) => {
        cleaningServices.forEach((s) => {
          payload.push({
            item_id: row.item_id,
            service_id: s.id,
            price: row[s.id] ?? 0,
            not_offered: row[s.id] === null,
          });
        });
      });

      // Add Car Wash
      carWashPrices.forEach((row) => {
        carWashServices.forEach((s) => {
          payload.push({
            item_id: row.item_id,
            service_id: s.id,
            price: row[s.id] ?? 0,
            not_offered: row[s.id] === null,
          });
        });
      });

      await saveProviderPricing({ pricing: payload });

      // Save Addon Pricing
      const addonPayload = Object.entries(addonPrices)
        .filter(([_, price]) => price !== "" && price !== null && price !== undefined)
        .map(([addonId, price]) => ({
          addon_id: Number(addonId),
          price: Number(price),
        }));

      await saveProviderAddonPricing({ addon_pricing: addonPayload });

      toast.success("Prices saved successfully!");
    } catch (err) {
      console.log(err);
      toast.error("Failed to save prices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Service type to icon mapping
  const getServiceIcon = (name) => {
    const iconMap = {
      "In-Home": <Home size={16} className="text-primary" />,
      "Pick-Up": <Truck size={16} className="text-primary" />,
      "Drop-Off": <MapPin size={16} className="text-primary" />,
    };
    return iconMap[name] || <Home size={16} className="text-primary" />;
  };

  // Get fee fields based on service type
  const getFeeFields = (serviceType) => {
    const fieldMap = {
      "In-Home": [{ label: "Base Service Fee ($)", key: "baseFee" }],
      "Pick-Up": [{ label: "Base Service Fee ($)", key: "baseFee" }],
      "Drop-Off": [{ label: "Base Service Fee ($)", key: "baseFee" }],
    };
    return (
      fieldMap[serviceType] || [{ label: "Service Fee ($)", key: "serviceFee" }]
    );
  };

 
  const handleToggle = async (serviceId, isActive, currentAmount) => {
    try {
      const payload = {
        service_type_id: serviceId,
        is_active: isActive,
        amount: 0, // Default 0
      };

      if (isActive) {
        // Allow 0 amount - No validation
        if (currentAmount !== undefined && currentAmount !== null) {
          payload.amount = currentAmount;
        } else {
          payload.amount = 0; // Default 0 if no amount
        }
      }

      await addProviderServiceAmount(payload);

      setServiceTypes((prev) =>
        prev.map((s) =>
          s.id === serviceId ? { ...s, is_active: isActive } : s,
        ),
      );

      toast.success(isActive ? "Service enabled" : "Service disabled");
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  // Save amount
  const handleServiceSave = async (serviceId) => {
    // debugger
    try {
      await addProviderServiceAmount({
        service_type_id: serviceId,
        amount: fees[serviceId],
        is_active: true,
        provider_id: 1,
      });

      // Update local state
      setServiceTypes((prev) =>
        prev.map((s) =>
          s.id === serviceId
            ? { ...s, amount: parseFloat(fees[serviceId]) }
            : s,
        ),
      );

      setFees((prev) => ({ ...prev, [serviceId]: "" }));
      toast.success("Service saved successfully");
    } catch (error) {
      toast.error("Failed to save");
    }
  };

  const handleSaveBulk = async () => {
    try {
      const payload = {
        price_per_lb: Number(bulkPricePerLb),
      };

      const savePromise = saveBulkPricingAPI(payload);

      const response: any = await toast.promise(savePromise, {
        loading: "Saving bulk price...",
        success: (res) => {
          if (res.data.success) {
            return "Bulk price saved successfully";
          }
          throw new Error("Save failed");
        },
        error: (err) => {
          return err?.response?.data?.message || "Failed to save bulk price";
        },
      });

      if (response.data.success) {
        setProviderBulk(response.data.data);
      }
    } catch (error) {
      console.error("SAVE ERROR:", error);
    }
  };

  const handleToggleBulk = async (checked: boolean) => {
    try {
      // ❗ first time validation
      // if (checked && !bulkPricePerLb) {
      //   toast.error("Please enter price before enabling bulk pricing");
      //   return;
      // }

      const payload: any = {
        is_active: checked,
      };

      if (checked) {
        payload.price_per_lb = Number(bulkPricePerLb);
      }

      const togglePromise = saveBulkPricingAPI(payload);

      const response: any = await toast.promise(togglePromise, {
        loading: "Updating bulk pricing...",
        success: (res) => {
          if (res.data.success) {
            return `Bulk pricing ${checked ? "enabled" : "disabled"} successfully`;
          }
          throw new Error("Update failed");
        },
        error: (err) => {
          return (
            err?.response?.data?.message || "Failed to update bulk pricing"
          );
        },
      });

      if (response.data.success) {
        setBulkEnabled(checked);
        setProviderBulk(response.data.data);
      }
    } catch (error) {
      console.error("TOGGLE ERROR:", error);
    }
  };

  const renderItemPricingTable = (
    categoryItems: any[],
    categoryServices: any[],
    pricesState: any[],
    setPricesState: React.Dispatch<React.SetStateAction<any[]>>
  ) => {
    if (categoryItems.length === 0 || categoryServices.length === 0) {
      return (
        <div className="rounded-xl border border-dashed p-8 text-center bg-card">
          <p className="text-sm text-muted-foreground">No items or services configured for this category.</p>
        </div>
      );
    }

    const updatePriceLocal = (rowIdx: number, serviceId: number, value: number | null) => {
      setPricesState(prev =>
        prev.map((r, idx) => (idx === rowIdx ? { ...r, [serviceId]: value } : r))
      );
    };

    return (
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/50">
              <th className="px-5 py-3 text-left font-semibold">Item</th>
              {categoryServices.map((s) => (
                <th key={s.id} className="px-5 py-3 text-center font-semibold capitalize">
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pricesState.map((row, idx) => (
              <tr key={row.item_id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-5 py-3 font-medium">{row.item}</td>
                {categoryServices.map((s) => {
                  const val = row[s.id];
                  return (
                    <td key={s.id} className="px-5 py-3 text-center">
                      {val === null ? (
                        <div className="flex items-center justify-center gap-1">
                          <Checkbox
                            checked={false}
                            onCheckedChange={() => updatePriceLocal(idx, s.id, 0)}
                          />
                          <span className="text-xs text-muted-foreground">Not Offered</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-muted-foreground">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={val ?? 0}
                            onChange={(e) =>
                              updatePriceLocal(idx, s.id, parseFloat(e.target.value) || 0)
                            }
                            className="w-20 text-center font-semibold"
                          />
                          <button
                            onClick={() => updatePriceLocal(idx, s.id, null)}
                            className="text-xs text-destructive hover:underline ml-1"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderAddonPricingTable = (
    category_id: number,
    prices: Record<number, string>,
    setPrices: React.Dispatch<React.SetStateAction<Record<number, string>>>
  ) => {
    const categoryAddons = addonsList.filter((addon: any) => Number(addon.category_id) === category_id);

    if (categoryAddons.length === 0) {
      return (
        <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-border rounded-xl bg-card">
          No add-on services found for this category.
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="p-4 font-heading text-sm font-semibold text-foreground">Add-on Service</th>
              <th className="p-4 font-heading text-sm font-semibold text-foreground w-48">Price ($)</th>
            </tr>
          </thead>
          <tbody>
            {categoryAddons.map((addon) => (
              <tr key={addon.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="p-4 text-sm font-medium text-foreground">{addon.name}</td>
                <td className="p-4">
                  <div className="relative flex items-center max-w-[120px]">
                    <span className="absolute left-3 text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="pl-7 h-9 bg-background"
                      value={prices[addon.id] ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPrices((prev) => ({
                          ...prev,
                          [addon.id]: val,
                        }));
                      }}
                      placeholder="0.00"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
      {location.pathname !== "/provider/pricing" ? (
        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="text-center space-y-5">
            {/* Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
              <DollarSign size={24} />
            </div>

            {/* Title */}
            <h2 className="text-lg font-semibold text-foreground">
              Pricing Setup Coming Soon
            </h2>

            {/* Subtitle */}
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              We're working on adding pricing features. You'll be able to set
              your service prices here very soon.
            </p>
          </div>
        </div>
      ) : (
        <div className="container-grid py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">
                {t("managePricing")}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Configure services and pricing rates for your customers.
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {(() => {
              const showLaundry = allowedCategories.includes("Laundry");
              const showCleaning = allowedCategories.includes("House Cleaning");
              const showCarwash = allowedCategories.includes("Car Wash");
              const visibleCount = [showLaundry, showCleaning, showCarwash].filter(Boolean).length;
              const gridCols = visibleCount === 1 
                ? "grid-cols-1 max-w-[200px]" 
                : visibleCount === 2 
                  ? "grid-cols-2 max-w-[400px]" 
                  : "grid-cols-3 max-w-[600px]";

              return (
                <TabsList className={`grid w-full ${gridCols} bg-muted/60 p-1 rounded-xl`}>
                  {showLaundry && (
                    <TabsTrigger value="laundry" className="data-[state=active]:bg-[#00ba88] data-[state=active]:text-white rounded-lg font-medium transition-all">Laundry Pricing</TabsTrigger>
                  )}
                  {showCleaning && (
                    <TabsTrigger value="cleaning" className="data-[state=active]:bg-[#00ba88] data-[state=active]:text-white rounded-lg font-medium transition-all">House Cleaning Pricing</TabsTrigger>
                  )}
                  {showCarwash && (
                    <TabsTrigger value="carwash" className="data-[state=active]:bg-[#00ba88] data-[state=active]:text-white rounded-lg font-medium transition-all">Car Wash Pricing</TabsTrigger>
                  )}
                </TabsList>
              );
            })()}

            <TabsContent value="laundry" className="space-y-8 focus-visible:outline-none">
              <div>
                <h2 className="font-heading text-lg font-semibold text-foreground mb-1">Item-Based Pricing</h2>
                <p className="text-sm text-muted-foreground mb-4">Set pricing rates for individual laundry items.</p>
                {renderItemPricingTable(laundryItems, laundryServices, laundryPrices, setLaundryPrices)}
              </div>

              <div className="mt-4">
                {formError && (
                  <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-md">
                    {formError}
                  </div>
                )}
                <Button onClick={handleSave} className="shadow-sm">
                  <Save size={16} className="mr-2" />
                  {t("savePricing")}
                </Button>
              </div>

              {(() => {
                const filteredTypes = serviceTypes?.filter(
                  (s: any) => Number(s.category_id) === 1
                );
                if (!filteredTypes || filteredTypes.length === 0) return null;

                return (
                  <div className="pt-6 border-t border-border">
                    <h2 className="font-heading text-lg font-semibold text-foreground mb-1">Laundry Service Options</h2>
                    <p className="text-sm text-muted-foreground mb-6">Enable service fulfillment methods and define operational fees.</p>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {filteredTypes.map((service: any) => (
                        <Card key={service.id} className="card-elevated">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base flex items-center gap-2 font-semibold">
                                {getServiceIcon(service.name)} {service.name === "In-Home" ? "In-Home/Office" : service.name}
                              </CardTitle>
                              <Switch
                                checked={service.is_active}
                                onCheckedChange={() =>
                                  handleToggle(
                                    service.id,
                                    !service.is_active,
                                    service.amount,
                                  )
                                }
                              />
                            </div>
                            {service.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {service.description}
                              </p>
                            )}
                          </CardHeader>

                          {service.is_active && (
                            <CardContent className="space-y-4 pt-0">
                              <div className="space-y-2">
                                <Label className="text-xs font-semibold">Service Fee ($)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="Enter amount"
                                  value={fees[service.id] || service.amount || ""}
                                  onChange={(e) =>
                                    setFees({ ...fees, [service.id]: e.target.value })
                                  }
                                />
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleServiceSave(service.id)}
                                className="w-full"
                              >
                                <Save size={14} className="mr-1" /> Save
                              </Button>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Bulk Order Estimated Pricing */}
              <div className="pt-6 border-t border-border">
                <h2 className="font-heading text-lg font-semibold text-foreground mb-1">
                  Bulk Order Estimated Pricing
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Set an estimated price per lbs for bulk orders.
                </p>

                <Card className="max-w-xl card-elevated">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2 font-semibold">
                        <Weight size={16} className="text-primary" /> Enable Bulk Pricing
                      </CardTitle>
                      <Switch
                        checked={bulkEnabled}
                        onCheckedChange={handleToggleBulk}
                      />
                    </div>
                  </CardHeader>
                  {bulkEnabled && (
                    <CardContent className="space-y-4 pt-0">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Estimated Price per lbs ($)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            $
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={bulkPricePerLb}
                            onChange={(e) => setBulkPricePerLb(e.target.value)}
                            className="pl-7"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          This is an estimated price. Final amount will be adjusted after measuring items.
                        </p>
                      </div>

                      <div className="flex items-start gap-2 rounded-lg border border-border bg-accent/30 p-3">
                        <Info
                          size={16}
                          className="text-primary mt-0.5 shrink-0"
                        />
                        <p className="text-xs text-muted-foreground">
                          Bulk orders include multiple clothing items and exclude bedsheets.
                        </p>
                      </div>

                      <Button size="sm" onClick={handleSaveBulk} className="w-full sm:w-auto">
                        <Save size={14} className="mr-1" /> Save
                      </Button>
                    </CardContent>
                  )}
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="cleaning" className="space-y-8 focus-visible:outline-none">
              <div>
                <h2 className="font-heading text-lg font-semibold text-foreground mb-1">Room/Property-Based Pricing</h2>
                <p className="text-sm text-muted-foreground mb-4">Set pricing rates for different house cleaning scopes and property configurations.</p>
                {renderItemPricingTable(cleaningItems, cleaningServices, cleaningPrices, setCleaningPrices)}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h2 className="font-heading text-lg font-semibold text-foreground mb-1">Add-on Services Pricing</h2>
                <p className="text-sm text-muted-foreground mb-4">Set pricing rates for optional add-on cleaning services.</p>
                {renderAddonPricingTable(2, addonPrices, setAddonPrices)}
              </div>

              <div className="mt-6">
                <Button onClick={handleSave} className="shadow-sm">
                  <Save size={16} className="mr-2" />
                  Save House Cleaning Pricing
                </Button>
              </div>

              {(() => {
                const filteredTypes = serviceTypes?.filter(
                  (s: any) => Number(s.category_id) === 2
                );
                if (!filteredTypes || filteredTypes.length === 0) return null;

                return (
                  <div className="pt-6 border-t border-border">
                    <h2 className="font-heading text-lg font-semibold text-foreground mb-1">House Cleaning Service Options</h2>
                    <p className="text-sm text-muted-foreground mb-6">Enable cleaning services and set service rates.</p>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {filteredTypes.map((service: any) => (
                        <Card key={service.id} className="card-elevated">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base flex items-center gap-2 font-semibold">
                                {getServiceIcon(service.name)} {service.name === "In-Home" ? "In-Home/Office" : service.name}
                              </CardTitle>
                              <Switch
                                  checked={service.is_active}
                                  onCheckedChange={() =>
                                    handleToggle(
                                      service.id,
                                      !service.is_active,
                                      service.amount,
                                    )
                                  }
                              />
                            </div>
                            {service.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {service.description}
                              </p>
                            )}
                          </CardHeader>

                          {service.is_active && (
                            <CardContent className="space-y-4 pt-0">
                              <div className="space-y-2">
                                <Label className="text-xs font-semibold">Service Fee ($)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="Enter amount"
                                  value={fees[service.id] || service.amount || ""}
                                  onChange={(e) =>
                                    setFees({ ...fees, [service.id]: e.target.value })
                                  }
                                />
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleServiceSave(service.id)}
                                className="w-full"
                              >
                                <Save size={14} className="mr-1" /> Save
                              </Button>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </TabsContent>

            <TabsContent value="carwash" className="space-y-8 focus-visible:outline-none">
              <div>
                <h2 className="font-heading text-lg font-semibold text-foreground mb-1">Vehicle-Based Pricing</h2>
                <p className="text-sm text-muted-foreground mb-4">Set pricing rates for different vehicle types and detailing packages.</p>
                {renderItemPricingTable(carWashItems, carWashServices, carWashPrices, setCarWashPrices)}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h2 className="font-heading text-lg font-semibold text-foreground mb-1">Add-on Services Pricing</h2>
                <p className="text-sm text-muted-foreground mb-4">Set pricing rates for optional add-on detailing services.</p>
                {renderAddonPricingTable(3, addonPrices, setAddonPrices)}
              </div>

              <div className="mt-6">
                <Button onClick={handleSave} className="shadow-sm">
                  <Save size={16} className="mr-2" />
                  Save Car Wash Pricing
                </Button>
              </div>

              {(() => {
                const filteredTypes = serviceTypes?.filter(
                  (s: any) => Number(s.category_id) === 3
                );
                if (!filteredTypes || filteredTypes.length === 0) return null;

                return (
                  <div className="pt-6 border-t border-border">
                    <h2 className="font-heading text-lg font-semibold text-foreground mb-1">Car Wash Service Options</h2>
                    <p className="text-sm text-muted-foreground mb-6">Enable car wash services and set service rates.</p>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {filteredTypes.map((service: any) => (
                        <Card key={service.id} className="card-elevated">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base flex items-center gap-2 font-semibold">
                                {getServiceIcon(service.name)} {service.name === "In-Home" ? "In-Home/Office" : service.name}
                              </CardTitle>
                              <Switch
                                  checked={service.is_active}
                                  onCheckedChange={() =>
                                    handleToggle(
                                      service.id,
                                      !service.is_active,
                                      service.amount,
                                    )
                                  }
                              />
                            </div>
                            {service.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {service.description}
                              </p>
                            )}
                          </CardHeader>

                          {service.is_active && (
                            <CardContent className="space-y-4 pt-0">
                              <div className="space-y-2">
                                <Label className="text-xs font-semibold">Service Fee ($)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="Enter amount"
                                  value={fees[service.id] || service.amount || ""}
                                  onChange={(e) =>
                                    setFees({ ...fees, [service.id]: e.target.value })
                                  }
                                />
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleServiceSave(service.id)}
                                className="w-full"
                              >
                                <Save size={14} className="mr-1" /> Save
                              </Button>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </>
  );
};

export default ProviderPricing;
