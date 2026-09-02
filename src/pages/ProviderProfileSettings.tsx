import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, Crown, Tag, Upload, Shirt, Sparkles, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import Select from "react-select";
import toast from "react-hot-toast";

import { userApi } from "@/api/modules/user.api";
import { providerApi } from "@/api/modules/provider.api";
import { uploadApi } from "@/api/modules/upload.api";
import { subscriptionApi } from "@/api/modules/subscription.api";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { getErrorMessage } from "@/lib/api/errors";
import Spinner from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Country, State, City } from "country-state-city";
import "react-country-state-city/dist/react-country-state-city.css";
import GooglePlaceAutocomplete from "@/components/ui/GooglePlaceAutocomplete";
import { useNavigate } from "react-router-dom";

function unwrapData<T = any>(res: unknown): T {
  if (res && typeof res === "object" && "data" in (res as object)) {
    return ((res as { data: T }).data ?? res) as T;
  }
  return res as T;
}

const ProviderProfileSettings = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState("");
  const [providerId, setProviderId] = useState<number | null>(null);
  const [supported, setSupported] = useState<string[]>(["Laundry"]);
  const toggle = (id: string) =>
    setSupported((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [langs, setLangs] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<{ name?: string } | File | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [profilePreview, setProfilePreview] = useState("");
  const [idPreview, setIdPreview] = useState("");
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [selfieFile, setSelfieFile] = useState<{ name?: string } | File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState("");
  const [licenseDocPath, setLicenseDocPath] = useState("");
  const [insuranceDocPath, setInsuranceDocPath] = useState("");

  const [myPlan, setMyPlan] = useState(null);

  const navigate = useNavigate();

  const inputStyle =
    "w-full rounded-xl bg-gray-100 border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:border-gray-200";

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!businessName.trim())
      newErrors.businessName = "Business name is required";

    if (!description.trim() || description.trim().length < 10)
      newErrors.description = "Description must be at least 10 characters";

    if (!serviceAddress.trim())
      newErrors.serviceAddress = "Service address required";

    if (!city.trim()) newErrors.city = "City is required";

    if (!state.trim()) newErrors.state = "State is required";

    if (!zipCode.trim()) {
      newErrors.zipCode = "Zip code required";
    } else if (!/^\d{4,10}$/.test(zipCode)) {
      newErrors.zipCode = "Invalid zip code";
    }

    if (!country.trim()) newErrors.country = "Country is required";

    if (!profilePreview && !profileImage)
      newErrors.profile = "Profile photo required";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);

      // Prefer marketplace me-profile; fall back to user my-profile
      let provider: any = null;
      let user: any = null;

      try {
        const meRes = await providerApi.getMyMarketplaceProfile();
        provider = unwrapData(meRes);
      } catch {
        /* fall through */
      }

      try {
        const userRes = await userApi.getMyProfile();
        user = unwrapData(userRes);
        if (!provider) provider = user?.provider;
      } catch {
        /* ignore */
      }

      if (!provider?.id && !user) {
        toast.error("Could not load provider profile.");
        return;
      }

      if (provider?.id) setProviderId(Number(provider.id));

      setBusinessName(provider?.business_name || "");
      setDescription(provider?.service_description || "");
      setServiceAddress(provider?.service_location_address || "");
      setZipCode(provider?.zip_code || "");
      setEmail(user?.email || provider?.user?.email || "");
      setPhone(user?.phone || provider?.user?.phone || "");
      setIsVerified(provider?.verified || "");
      setCountry(provider?.country || "");
      setState(provider?.state || "");
      setCity(provider?.city || "");
      if (provider?.latitude != null) setLat(Number(provider.latitude));
      if (provider?.longitude != null) setLng(Number(provider.longitude));

      if (provider?.service_categories) {
        setSupported(
          typeof provider.service_categories === "string"
            ? JSON.parse(provider.service_categories)
            : provider.service_categories
        );
      }

      const photoPath =
        user?.profile_image ||
        user?.profile_photo ||
        provider?.user?.profile_image ||
        provider?.profile_photo;
      if (photoPath) {
        setProfilePreview(resolveMediaUrl(String(photoPath)) || "");
      }

      if (provider?.license_document || provider?.license_document_url) {
        const path = provider.license_document_url || provider.license_document;
        setLicenseDocPath(provider.license_document || "");
        setIdPreview(resolveMediaUrl(String(path)) || String(path));
        setIdFile({ name: String(path).split("/").pop() });
      }

      if (provider?.insurance_certificate || provider?.insurance_certificate_url) {
        const path =
          provider.insurance_certificate_url || provider.insurance_certificate;
        setInsuranceDocPath(provider.insurance_certificate || "");
        setSelfiePreview(resolveMediaUrl(String(path)) || String(path));
        setSelfieFile({ name: String(path).split("/").pop() });
      }
    } catch (err) {
      console.log("PROVIDER PROFILE ERROR:", err);
      toast.error(getErrorMessage(err, "Failed to load profile."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    getMySubscription();
  }, []);

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);

      // Backend fields: PUT /providers/me/profile
      const payload = {
        business_name: businessName.trim(),
        service_description: description.trim(),
        service_location_address: serviceAddress.trim(),
        country: country.trim(),
        state: state.trim(),
        city: city.trim(),
        zip_code: zipCode.trim(),
        latitude: lat,
        longitude: lng,
        service_categories: supported,
        ...(licenseDocPath ? { license_document: licenseDocPath } : {}),
        ...(insuranceDocPath ? { insurance_certificate: insuranceDocPath } : {}),
      };

      await toast.promise(providerApi.updateMyMarketplaceProfile(payload), {
        loading: "Updating profile...",
        success: "Profile updated successfully.",
        error: (err) => getErrorMessage(err, "Update failed."),
      });

      if (isVerified === "unverified") {
        setShowReviewPopup(true);
      }
      await fetchProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "profile" | "id" | "selfie"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (type === "profile") {
        setProfilePreview(URL.createObjectURL(file));
        setProfileImage(file);
        setErrors((prev) => ({ ...prev, profile: "" }));

        const formData = new FormData();
        formData.append("profile_photo", file);
        await userApi.updateProfilePhoto(formData);
        toast.success("Profile photo uploaded.");
        return;
      }

      // id → license_document ; selfie → insurance_certificate (current schema)
      const isImage = file.type.startsWith("image/");
      const res = isImage
        ? await uploadApi.uploadProviderImage(file)
        : await uploadApi.uploadProviderDocument(file);
      const data = unwrapData<{ base_path?: string; name?: string }>(res);
      const path = data?.base_path || data?.name || "";
      if (!path) throw new Error("Upload succeeded but no path returned");
      const normalized = path.startsWith("/") ? path : `/${path}`;

      if (type === "id") {
        setIdFile(file);
        setIdPreview(URL.createObjectURL(file));
        setLicenseDocPath(normalized);
        setErrors((prev) => ({ ...prev, id: "" }));

        if (providerId) {
          await providerApi.updateVerificationDocs(providerId, {
            license_document: normalized,
          });
        }
        toast.success("License / ID document uploaded.");
      }

      if (type === "selfie") {
        setSelfieFile(file);
        setSelfiePreview(URL.createObjectURL(file));
        setInsuranceDocPath(normalized);
        setErrors((prev) => ({ ...prev, selfie: "" }));

        if (providerId) {
          await providerApi.updateVerificationDocs(providerId, {
            insurance_certificate: normalized,
          });
        }
        toast.success("Insurance certificate uploaded.");
      }
    } catch (err) {
      console.log("UPLOAD ERROR:", err);
      toast.error(getErrorMessage(err, "File upload failed."));
    }
  };

  const getMySubscription = async () => {
    try {
      const res = await subscriptionApi.getCurrent();
      const data = unwrapData<any>(res);
      setMyPlan(data?.subscription || data || null);
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <div className="container-grid py-8">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        {t("profileSettings")}
      </h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("businessName")} <span className="text-red-500"> *</span>
            </label>
            <Input
              value={businessName}
              onChange={(e) => {
                const value = e.target.value;
                setBusinessName(value);

                setErrors((prev) => ({
                  ...prev,
                  businessName: value.trim() ? "" : "Business name is required",
                }));
              }}
            />
            <p className="text-xs text-red-500 min-h-[16px]">
              {errors.businessName || ""}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("description")} <span className="text-red-500"> *</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                const value = e.target.value;
                setDescription(value);

                setErrors((prev) => ({
                  ...prev,
                  description: value.trim() ? "" : "Description is required",
                }));
              }}
              rows={4}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
            <p className="text-xs text-red-500 min-h-[16px]">
              {errors.description || ""}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              {t("languagesSpoken")} <span className="text-red-500">*</span>
            </label>

            {/* <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
              {LANGUAGE_OPTIONS.map((lang) => (
                <label key={lang} className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    checked={langs.includes(lang)}
                    onChange={() => {
                      let updated;

                      if (langs.includes(lang)) {
                        updated = langs.filter((l) => l !== lang);
                      } else {
                        updated = [...langs, lang];
                      }

                      setLangs(updated);

                      setErrors((prev) => ({
                        ...prev,
                        langs: updated.length ? "" : "Languages required",
                      }));
                    }}
                  />
                  {lang}
                </label>
              ))}
            </div> */}
            <select
              className={inputStyle}
              value={langs}
              onChange={(e) => {
                const value = e.target.value;
                setLangs(value);

                setErrors((prev) => ({
                  ...prev,
                  langs: value.trim() ? "" : "Language required",
                }));
              }}
            >
              <option value="">Select Language</option>

              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="Russian">Russian</option>
              <option value="Portuguese">Portuguese</option>
              <option value="French">French</option>
              <option value="Swahili">Swahili</option>
              <option value="Haitian Creole">Haitian Creole</option>
            </select>

            {/* Error */}
            <p className="text-xs text-red-500 mt-1 min-h-[16px]">
              {errors.langs || ""}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Email ID
              </label>
              <Input value={email} readOnly className={inputStyle} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Mobile No.
              </label>
              <Input value={phone} readOnly className={inputStyle} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("serviceAddress")} <span className="text-red-500"> *</span>
            </label>
            {/* <Input
              className={inputStyle}
              value={serviceAddress}
              onChange={(e) => {
                const value = e.target.value;
                setServiceAddress(value);

                setErrors((prev) => ({
                  ...prev,
                  serviceAddress: value.trim()
                    ? ""
                    : "Service address required",
                }));
              }}
            /> */}

            <GooglePlaceAutocomplete
              value={serviceAddress}
              placeholder="Search address"
              onChange={(val) => {
                setServiceAddress(val);

                setErrors((prev) => ({
                  ...prev,
                  serviceAddress: val.trim() ? "" : "Service address required",
                }));
              }}
              onSelect={(place) => {
                setServiceAddress(place.address);
                setLat(place.lat);
                setLng(place.lng);

                const components = place.fullPlace?.address_components || [];

                const getComponent = (type: string) => {
                  const comp = components.find((c: any) =>
                    c.types.includes(type),
                  );
                  return comp?.long_name || "";
                };

                // ✅ FIRST extract base values
                let stateVal = getComponent("administrative_area_level_1");
                let countryVal = getComponent("country");
                let zipVal = getComponent("postal_code");

                // 🎯 CITY (primary)
                let cityVal =
                  getComponent("locality") ||
                  getComponent("postal_town") ||
                  getComponent("sublocality_level_1") ||
                  getComponent("sublocality") ||
                  getComponent("neighborhood") ||
                  getComponent("administrative_area_level_2") ||
                  getComponent("administrative_area_level_3");

                const address = place.address;

                // 🔥 ZIP fallback
                if (!zipVal) {
                  const zipMatch = address.match(/\b\d{5,6}\b/);
                  zipVal = zipMatch ? zipMatch[0] : "";
                }

                // 🔥 STATE fallback
                if (!stateVal) {
                  const parts = address.split(",");
                  const raw = parts[parts.length - 2] || "";
                  stateVal = raw.replace(/\d+/g, "").trim();
                }

                // 🔥 COUNTRY fallback
                if (!countryVal) {
                  const parts = address.split(",");
                  countryVal = parts[parts.length - 1]?.trim();
                }

                // 🔥 REMOVE ZIP FROM STATE
                if (stateVal && zipVal && stateVal.includes(zipVal)) {
                  stateVal = stateVal.replace(zipVal, "").trim();
                }

                // 🔥 FINAL CITY FALLBACK (AFTER state & country ready)
                if (!cityVal) {
                  const parts = address.split(",").map((p) => p.trim());

                  for (let i = parts.length - 1; i >= 0; i--) {
                    const part = parts[i].toLowerCase();

                    if (!part) continue;
                    if (part === countryVal.toLowerCase()) continue;
                    if (part.includes(stateVal.toLowerCase())) continue;
                    if (/\d{5,6}/.test(part)) continue;

                    cityVal = parts[i];
                    break;
                  }
                }

                // ✅ FINAL SET
                setCity(cityVal || "");
                setState(stateVal || "");
                setCountry(countryVal || "");
                setZipCode(zipVal || "");

                // console.log({
                //   city: cityVal,
                //   state: stateVal,
                //   country: countryVal,
                //   zip: zipVal,
                // });
              }}
            />
            <p className="text-xs mt-2 text-red-500 min-h-[16px]">
              {errors.serviceAddress || ""}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            {/* Country */}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Country
              </label>
              <Input
                value={country}
                placeholder="Country"
                readOnly
                className={inputStyle}
              />
            </div>

            {/* State */}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                State
              </label>
              <Input
                value={state}
                placeholder="State"
                readOnly
                className={inputStyle}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3">
            {/* City */}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                City
              </label>
              {/* City Input */}
              <Input
                value={city}
                placeholder="City"
                onChange={(e) => setCity(e.target.value)} // User manual edit bhi kar paye
                className={inputStyle}
              />
            </div>

            {/* Zip Code */}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Zip Code
              </label>
              <Input
                value={zipCode}
                placeholder="Zip Code"
                onChange={(e) => setZipCode(e.target.value)}
                className={inputStyle}
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={loading} className="relative">
            {/* Text (space preserved) */}
            <span className={loading ? "opacity-0" : "opacity-100"}>
              {t("saveProfile")}
            </span>

            {/* Spinner center */}
            {loading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Spinner size={16} />
              </span>
            )}
          </Button>
        </div>

        <div className="space-y-4">
          {myPlan && myPlan?.status === "active" && (
            <div className="border border-green-400 rounded-xl p-5 bg-green-50 flex items-center justify-between">
              {/* LEFT SECTION */}
              <div className="flex items-start gap-4">
                
                {/* Icon */}
                <div className="bg-green-200 p-3 rounded-lg">
                  <Tag className="text-green-700" size={20} />
                </div>

                {/* Text */}
                <div>
                  <div className="flex items-center gap-2 text-gray-700 font-medium">
                    <Crown size={16} className="text-green-600" />
                    Current Package
                  </div>

                  <h2 className="text-lg font-semibold text-gray-900 mt-1">
                    {/* Pro Spotlight */}
                    {myPlan?.plan_name}
                  </h2>

                  <p className="text-sm text-red-500 mt-1">
                    Expires: {myPlan?.end_date}
                  </p>
                </div>
              </div>

              {/* RIGHT SECTION */}
              <div className="flex flex-col items-end gap-3">
                
                {/* Active Badge */}
                <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                  Active
                </span>

                {/* Button */}
                {/* <button
                  onClick={() => navigate("/provider/featured")} 
                  className="flex items-center gap-2 border border-green-500 text-green-600 px-4 py-2 rounded-md text-sm hover:bg-green-100 transition">
                  <ArrowUpRight size={16} />
                  Upgrade Plan
                </button> */}
              </div>
            </div>
          )}

          {/* Supported Services */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 font-heading text-base font-semibold text-foreground">Supported Services</h2>
            <p className="mb-4 text-sm text-muted-foreground">Select every service category you offer. This controls where customers can find you.</p>
            <div className="space-y-2">
              {[
                { id: "Laundry", label: "Laundry", icon: Shirt, desc: "Wash, fold, iron, hang" },
                { id: "House Cleaning", label: "House Cleaning", icon: Sparkles, desc: "Standard, deep, move-in/out" },
                { id: "Car Wash", label: "Car Wash", icon: Car, desc: "Exterior, interior, full detail" },
              ].map((s) => {
                const active = supported.includes(s.id);
                return (
                  <label key={s.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-colors ${active ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/30"}`}>
                    <Checkbox checked={active} onCheckedChange={() => toggle(s.id)} />
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-accent text-foreground"}`}>
                      <s.icon size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Profile Photo */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 font-heading text-base font-semibold text-foreground">
              {t("profilePhoto")} <span className="text-red-500"> *</span>
            </h2>

            <div className="rounded-lg border-2 border-dashed border-border p-8 text-center cursor-pointer">
              <input
                type="file"
                accept="image/*"
                id="profileUpload"
                className="hidden"
                onChange={(e) => handleFileChange(e, "profile")}
              />

              <label htmlFor="profileUpload" className="cursor-pointer block">
                {profilePreview ? (
                  <div className="relative w-fit mx-auto">
                    <img
                      src={profilePreview}
                      alt="profile preview"
                      className="h-24 w-24 rounded-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setProfilePreview("");
                        setProfileImage(null);

                        setErrors((prev) => ({
                          ...prev,
                          profile: "Profile photo required",
                        }));
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload
                      size={32}
                      className="mx-auto text-muted-foreground"
                    />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("uploadPhoto")}
                    </p>
                  </>
                )}
              </label>

              {errors.profile && (
                <p className="text-xs text-red-500 mt-2">{errors.profile}</p>
              )}
            </div>
          </div>

          {/* License document (was ID verification) */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 font-heading text-base font-semibold text-foreground">
              License Document
            </h2>
            <div className="rounded-lg border-2 border-dashed border-border p-8 text-center cursor-pointer">
              <input
                type="file"
                accept="image/*,.pdf"
                id="idUpload"
                className="hidden"
                onChange={(e) => handleFileChange(e, "id")}
              />

              <label htmlFor="idUpload" className="cursor-pointer block">
                {idPreview ? (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-green-600 font-medium truncate max-w-[200px]">
                      {idFile?.name}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setIdPreview("");
                        setIdFile(null);

                        setErrors((prev) => ({
                          ...prev,
                          id: "ID document required",
                        }));
                      }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload
                      size={32}
                      className="mx-auto text-muted-foreground"
                    />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Upload license document
                    </p>
                  </>
                )}
              </label>

              {errors.id && (
                <p className="text-xs text-red-500 mt-2">{errors.id}</p>
              )}
            </div>
          </div>

          {/* Insurance certificate */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 font-heading text-base font-semibold text-foreground">
              Insurance Certificate
            </h2>

            <div className="rounded-lg border-2 border-dashed border-border p-6 text-center cursor-pointer">
              <input
                type="file"
                accept="image/*,.pdf"
                id="selfieUpload"
                className="hidden"
                onChange={(e) => handleFileChange(e, "selfie")}
              />

              <label htmlFor="selfieUpload" className="cursor-pointer block">
                {selfiePreview ? (
                  <div className="relative w-fit mx-auto">
                    <img
                      src={selfiePreview}
                      alt="insurance preview"
                      className="h-24 w-24 rounded-lg object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <p className="text-sm text-green-600 font-medium truncate max-w-[200px] mt-1">
                      {(selfieFile as { name?: string })?.name || "Uploaded"}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelfiePreview("");
                        setSelfieFile(null);
                        setInsuranceDocPath("");
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload
                      size={32}
                      className="mx-auto text-muted-foreground"
                    />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Upload insurance certificate
                    </p>
                  </>
                )}
              </label>

              {errors.selfie && (
                <p className="text-xs text-red-500 mt-2">{errors.selfie}</p>
              )}
            </div>
          </div>
        </div>
        
      </div>

      <Dialog
        open={showReviewPopup}
        onOpenChange={(open) => {
          setShowReviewPopup(open);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden shadow-xl border-0">
          {/* TOP HEADER */}
          <div className="bg-gradient-to-br from-primary to-primary/80 p-6 flex justify-center">
            <div className="h-16 w-16 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30">
              <span className="text-3xl text-white font-bold">✓</span>
            </div>
          </div>

          {/* CONTENT */}
          <div className="px-6 py-6 text-center">
            {/* TITLE */}
            <DialogTitle className="text-xl font-semibold text-foreground">
              Profile Under Review
            </DialogTitle>

            {/* DESCRIPTION */}
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Your profile has been submitted successfully.
              <br />
              <br />
              Our team is reviewing your account. Once approved, you'll receive
              an email notification.
            </p>

            {/* STATUS BADGE */}
            <div className="mt-4 flex justify-center">
              <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                Pending Verification
              </span>
            </div>

            {/* BUTTON */}
            <DialogFooter className="mt-6 flex justify-center">
              <Button
                onClick={() => setShowReviewPopup(false)}
                className="px-6 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-md"
              >
                Got it
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderProfileSettings;
