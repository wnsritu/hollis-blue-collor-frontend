// export default ProviderProfile;
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
// import { providers } from "@/data/mockData";
import StarRating from "@/components/StarRating";
import { MapPin, Globe, Star, Quote, Home, Truck, ArrowLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { getProviderPricing } from "@/services/pricing.service";
import { getItems, getServices } from "@/services/item.service";
import { PriceRow } from "@/types/pricing.types";
import { getProviderData } from "@/api/provider.api";
import { checkCleaningOffered, checkCarWashOffered } from "@/utils/bookingValidation";

import Spinner from "@/components/ui/spinner";

const ProviderProfile = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [serviceTypes, setServiceTypes] = useState([]);
  const [providerData, setProviderData] = useState<any>(null);
  const [bulkPrice, setBulkPrice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [rawPricing, setRawPricing] = useState<any[]>([]);
  const [rawItems, setRawItems] = useState<any[]>([]);

  const queryParams = new URLSearchParams(window.location.search);
  const category = queryParams.get("category") || "1";
  const isWizard = queryParams.get("wizard") === "true";
  const from = queryParams.get("from");
  const orderId = queryParams.get("orderId");

  const handleBack = () => {
    if (from === "dashboard") {
      navigate("/dashboard");
      return;
    }
    if (from === "orders" || from === "order-detail" || from === "order") {
      if (orderId) {
        navigate(`/order/${orderId}`);
      } else {
        navigate("/orders");
      }
      return;
    }
    if (isWizard || from === "wizard") {
      const effId = providerData?.id || id;
      if (category === "2") {
        navigate(`/booking/cleaning?provider=${effId}&step=3`);
      } else if (category === "3") {
        navigate(`/booking/carwash?provider=${effId}&step=3`);
      } else {
        navigate(`/search?step=1&provider=${effId}`);
      }
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let userId = null;
        try {
          const token = localStorage.getItem("token");
          if (token && token.includes(".")) {
            const payload = JSON.parse(atob(token.split(".")[1]));
            userId = payload?.id;
          }
        } catch (e) {
          console.log("Token decode error:", e);
        }

        let req = {
          provider_id: Number(id),
        };
        const categoryId = Number(category);
        const [itemsResResult, pricingResResult, providerResResult] = await Promise.allSettled([
          getItems({ category_id: categoryId }),
          getProviderPricing(req),
          getProviderData(req),
        ]);

        const itemsRes: any = itemsResResult.status === "fulfilled" ? itemsResResult.value : null;
        const pricingRes: any = pricingResResult.status === "fulfilled" ? pricingResResult.value : null;
        const providerRes: any = providerResResult.status === "fulfilled" ? providerResResult.value : null;

        const fetchedProvider = providerRes?.data?.data || providerRes?.data?.provider || providerRes?.data;
        if (fetchedProvider && typeof fetchedProvider === "object" && (fetchedProvider.id || fetchedProvider.business_name)) {
          setProviderData(fetchedProvider);
        }

        let servicesData: any[] = [];
        if (categoryId !== 1) {
          try {
            const servicesRes = await getServices({ category_id: categoryId });
            servicesData = servicesRes?.data || servicesRes?.services || servicesRes || [];
            setServices(Array.isArray(servicesData) ? servicesData : []);
          } catch (e) {
            console.error("Error fetching services", e);
          }
        }

        const items = itemsRes?.data || itemsRes?.items || itemsRes || [];
        const pricing = pricingRes?.item_pricing || pricingRes?.data?.item_pricing || [];
        setRawPricing(Array.isArray(pricing) ? pricing : []);
        setRawItems(Array.isArray(items) ? items : []);
        setBulkPrice(pricingRes?.bulk_pricing?.[0]?.price_per_lb || pricingRes?.data?.bulk_pricing?.[0]?.price_per_lb);

        if (categoryId === 1) {
          const servicesMap = {
            1: "wash",
            2: "fold",
            3: "iron",
            4: "hang",
          };

          const formatted = items?.map((item: any) => {
            const row: any = {
              item_id: item.id,
              item: item.name,
              wash: null,
              fold: null,
              iron: null,
              hang: null,
            };

            pricing?.forEach((p: any) => {
              if (p.item_id === item.id) {
                const serviceKey = servicesMap[p.service_id];
                row[serviceKey] = p.not_offered ? null : p.price;
              }
            });

            return row;
          });

          setPrices(formatted);
        } else {
          const formatted = items?.map((item: any) => {
            const row: any = {
              item_id: item.id,
              item: item.name,
              prices: {},
            };

            pricing?.forEach((p: any) => {
              if (p.item_id === item.id) {
                row.prices[p.service_id] = p.not_offered ? null : p.price;
              }
            });

            return row;
          });

          setPrices(formatted);
        }
      } catch (err) {
        console.log("ERROR:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category, id]);

  // console.log(providerData,"test data");


  // House Cleaning Check
  const cleaningType = localStorage.getItem("cleaning_cleaningType");
  const bedrooms = Number(localStorage.getItem("cleaning_bedrooms") || 2);
  const bathrooms = Number(localStorage.getItem("cleaning_bathrooms") || 1);

  const { isOffered: isCleaningOffered, warningMessage: cleaningWarningMessage } = checkCleaningOffered(
    rawItems,
    rawPricing,
    cleaningType,
    bedrooms,
    bathrooms,
    services
  );

  // Car Wash Check
  const cwService = localStorage.getItem("carwash_service");
  const cwVehicle = localStorage.getItem("carwash_vehicle");

  const { isOffered: isCarWashOffered, warningMessage: carWashWarningMessage } = checkCarWashOffered(
    rawItems,
    rawPricing,
    cwService,
    cwVehicle,
    services
  );

  // Laundry Check
  const hasLaundry = (bulkPrice !== null && bulkPrice !== undefined && Number(bulkPrice) > 0) || (prices && prices.some((p: any) => p.wash || p.fold || p.iron || p.hang));
  const isLaundryOffered = hasLaundry;
  const laundryWarningMessage = "This service provider does not offer Laundry services currently. Please select another provider.";

  const isServiceOffered = !isWizard || (category === "2" ? isCleaningOffered : (category === "3" ? isCarWashOffered : isLaundryOffered));



  const getPhotoUrl = (photoPath: any) => {
    if (!photoPath || typeof photoPath !== "string" || photoPath.trim() === "") {
      return "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face";
    }
    if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
      return photoPath;
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = photoPath.startsWith("/") ? photoPath : `/${photoPath}`;
    return `${cleanBase}${cleanPath}`;
  };

  const getLanguages = (data: any) => {
    if (!data) return "English";
    const rawLang = data.language_spoken || data.languages || data.language || data.user?.language_spoken;
    if (!rawLang) return "English";
    if (Array.isArray(rawLang)) return rawLang.join(", ");
    if (typeof rawLang === "string") {
      try {
        const parsed = JSON.parse(rawLang);
        if (Array.isArray(parsed)) return parsed.join(", ");
      } catch {
        // Not JSON
      }
      return rawLang;
    }
    return "English";
  };

  const getLocation = (data: any) => {
    if (!data) return "N/A";
    const locParts = [data.city, data.state, data.country].filter(Boolean);
    if (locParts.length > 0) return locParts.join(", ");
    if (data.service_location_address) return data.service_location_address;
    if (data.address) return data.address;
    if (data.user?.addresses?.[0]) {
      const addr = data.user.addresses[0];
      const userParts = [addr.city, addr.state].filter(Boolean);
      if (userParts.length > 0) return userParts.join(", ");
      if (addr.address_line) return addr.address_line;
    }
    return "N/A";
  };

  const photoUrl = getPhotoUrl(providerData?.profile_photo || providerData?.user?.profile_image);
  const providerName = providerData?.business_name || (providerData?.user ? `${providerData.user.first_name || ""} ${providerData.user.last_name || ""}`.trim() : "Provider");
  const providerRating = providerData?.rating || 0;
  const providerLanguages = getLanguages(providerData);
  const providerLocation = getLocation(providerData);

  const getServiceIcon = (name) => {
    const iconMap = {
      "In-Home": <Home size={16} className="text-primary" />,
      "Pick-Up": <Truck size={16} className="text-primary" />,
      "Drop-Off": <MapPin size={16} className="text-primary" />,
    };
  };

  if (loading) {
    return (
      <div className="container-grid py-20 flex flex-col items-center justify-center min-h-[400px]">
        <Spinner size={40} className="mb-4 text-primary" />
        <p className="text-muted-foreground text-sm font-medium">Loading provider details...</p>
      </div>
    );
  }

  return (
    <div className="container-grid py-8">
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <img
            src={photoUrl}
            alt={providerName}
            className="h-24 w-24 rounded-xl object-cover"
            onError={(e: any) => {
              e.target.onerror = null;
              e.target.src = "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face";
            }}
          />
          <div className="flex-1">
            <h4 className="font-heading text-2xl font-bold text-foreground">
              {providerName}
            </h4>
            <div className="mt-1">
              <StarRating rating={providerRating} />
            </div>
            <span className="flex items-center mt-2 gap-1 text-sm text-muted-foreground">
              <Globe size={14} className="text-primary" />
              <strong className="text-foreground mr-1">Languages:</strong> {providerLanguages}
            </span>
            <span className="flex items-center mt-1.5 gap-1 text-sm text-muted-foreground">
              <MapPin size={14} className="text-primary" />
              <strong className="text-foreground mr-1">Location:</strong> {providerLocation}
            </span>
          </div>
          <div className="flex flex-col gap-2 min-w-[220px]">
            {/* Back Button */}
            <Button
              variant="outline"
              onClick={handleBack}
              className="w-full flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} /> Back
            </Button>

            {/* Service offered check warning */}
            {!isServiceOffered && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg flex items-start gap-2">
                <span className="text-sm">⚠️</span>
                <div className="leading-snug">
                  {category === "2" ? cleaningWarningMessage : (category === "3" ? carWashWarningMessage : laundryWarningMessage)}
                </div>
              </div>
            )}

            {/* Book Service Button */}
            {!isServiceOffered ? (
              <Button disabled className="w-full flex items-center justify-center gap-2 opacity-60 cursor-not-allowed">
                <ShoppingBag size={16} /> {t("bookService")}
              </Button>
            ) : (
              <Button
                className="w-full flex items-center justify-center gap-2"
                onClick={() => {
                  const effId = providerData?.id || id;
                  const effUserId = providerData?.user_id || providerData?.user?.id || id;
                  if (category === "2") {
                    localStorage.setItem("cleaning_provider", String(effId));
                    navigate(`/booking/cleaning?provider=${effId}&step=4`);
                  } else if (category === "3") {
                    localStorage.setItem("carwash_provider", String(effId));
                    navigate(`/booking/carwash?provider=${effId}&step=4`);
                  } else {
                    localStorage.setItem("laundry_providerId", String(effId));
                    localStorage.setItem("laundry_userId", String(effUserId));
                    navigate(`/search?step=2&provider=${effId}&userid=${effUserId}`);
                  }
                }}
              >
                <ShoppingBag size={16} /> {t("bookService")}
              </Button>
            )}
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          {t("aboutProvider")}
        </h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          {providerData?.service_description || "No description provided."}
        </p>
      </section>

      <section className="mt-8">
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Services Provided
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            {providerData?.service_types?.map((service) => (
              <Card key={service.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {getServiceIcon(service.name)} {service.name}
                    </CardTitle>
                  </div>
                  {service.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {service.description}
                    </p>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {Number(category) === 1 ? (
        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            {t("pricing")}
          </h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/50">
                  <th className="px-5 py-3 text-left font-semibold text-foreground">
                    {t("item")}
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-foreground">
                    {t("wash")}
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-foreground">
                    {t("fold")}
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-foreground">
                    {t("iron")}
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-foreground">
                    {t("hang")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {prices?.map((row) => (
                  <tr
                    key={row.item}
                    className="border-b border-border last:border-0 transition-colors hover:bg-accent/30"
                  >
                    <td className="px-5 py-3 font-medium text-foreground">
                      {row.item}
                    </td>

                    <td className="px-5 py-3 text-right text-muted-foreground">
                      {row.wash !== null
                        ? `$${Number(row.wash).toFixed(2)}`
                        : "Not offered"}
                    </td>

                    <td className="px-5 py-3 text-right text-muted-foreground">
                      {row.fold !== null
                        ? `$${Number(row.fold).toFixed(2)}`
                        : "Not offered"}
                    </td>

                    <td className="px-5 py-3 text-right text-muted-foreground">
                      {row.iron !== null
                        ? `$${Number(row.iron).toFixed(2)}`
                        : "Not offered"}
                    </td>

                    <td className="px-5 py-3 text-right text-muted-foreground">
                      {row.hang !== null
                        ? `$${Number(row.hang).toFixed(2)}`
                        : "Not offered"}
                    </td>
                  </tr>
                ))}
                {bulkPrice ? (
                  <tr className="border-t border-border bg-accent/20">
                    <td className="px-5 py-4 font-semibold text-foreground">
                      Bulk Item
                    </td>
                    <td
                      colSpan={4}
                      className="px-5 py-4 text-center font-semibold text-foreground"
                    >
                      ${bulkPrice} per lbs
                      <span className="ml-1 font-semibold">
                        (not bound to these services wash/fold/iron/hang)
                      </span>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            {t("pricing")}
          </h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/50">
                  <th className="px-5 py-3 text-left font-semibold text-foreground">
                    {t("item")}
                  </th>
                  {services.map((service) => (
                    <th key={service.id} className="px-5 py-3 text-right font-semibold text-foreground">
                      {service.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prices?.map((row) => (
                  <tr
                    key={row.item}
                    className="border-b border-border last:border-0 transition-colors hover:bg-accent/30"
                  >
                    <td className="px-5 py-3 font-medium text-foreground">
                      {row.item}
                    </td>
                    {services.map((service) => {
                      const price = row.prices?.[service.id];
                      return (
                        <td key={service.id} className="px-5 py-3 text-right text-muted-foreground">
                          {price !== null && price !== undefined
                            ? `$${Number(price).toFixed(2)}`
                            : "Not offered"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mt-8">
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {providerData?.reviews?.length ? (
            providerData.reviews.map((review: any) => (
              <Card
                key={review.id}
                className="border border-primary/40 bg-white rounded-xl shadow-sm hover:shadow-md transition"
              >
                <CardContent className="p-5">
                  <div className="relative group">
                    {/* Quote Icon (hidden by default, show on hover) */}
                    <Quote
                      size={24}
                      className="absolute left-5 top-0 text-primary/20 opacity-0 group-hover:opacity-100 transition"
                    />

                    {/* Text */}
                    <p className="text-sm leading-relaxed text-muted-foreground pl-6">
                      {review.comment || "No comment provided"}
                    </p>
                  </div>

                  {/* Bottom Section */}
                  <div className="mt-5 flex items-center gap-3">
                    {/* Avatar */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {review.customer?.first_name?.charAt(0)}
                      {review.customer?.last_name?.charAt(0)}
                    </div>

                    {/* Name + Rating */}
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {review.customer?.first_name}{" "}
                        {review.customer?.last_name}
                      </p>

                      <div className="flex gap-0.5 mt-0.5">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className="fill-blue-500 text-blue-500"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <h5 className="text-sm text-muted-foreground">
              No reviews available yet.
            </h5>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProviderProfile;


