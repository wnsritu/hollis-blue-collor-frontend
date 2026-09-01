import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMyProfile, updateMyProfile } from "@/services/user.service";
import { ShoppingBag, Star, Upload, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { getOrderList } from "@/services/order.service";
import { useNavigate, useParams, Link } from "react-router-dom";
import { uploadProviderFile } from "@/services/provider.service";
import GooglePlaceAutocomplete from "@/components/ui/GooglePlaceAutocomplete";
import PaginationController from "@/components/ui/PaginationController";


const CustomerProfile = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [errors, setErrors] = useState<any>({});

  const { id } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [profilePreview, setProfilePreview] = useState("");
  const [idPreview, setIdPreview] = useState("");
  const [idFile, setIdFile] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);


  

  useEffect(() => {
    fetchProfile();
  }, []);

  const validate = () => {
    let err: any = {};

    // First Name
    if (!firstName.trim()) {
      err.firstName = "First name is required";
    } else if (firstName.length < 2) {
      err.firstName = "Minimum 2 characters required";
    }

    // Last Name
    if (!lastName.trim()) {
      err.lastName = "Last name is required";
    }

    // Email
    if (!email.trim()) {
      err.email = "Email is required";
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(email)) {
      err.email = "Invalid email format";
    }

    // Phone
    if (!phone.trim()) {
      err.phone = "Phone number is required";
    }

    // Address
    if (!address.trim()) {
      err.address = "Address is required";
    } else if (address.length < 5) {
      err.address = "Address too short";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const fetchProfile = async () => {
    try {
      const res = await getMyProfile();

      const user = res.data;

      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");

      // ✅ address handling
      if (user.addresses && user.addresses.length > 0) {
        setAddress(user.addresses[0].address_line || "");
      }
      // debugger;
      if (user.profile_image) {
        setProfilePreview(
          `${import.meta.env.VITE_API_BASE_URL}${user.profile_image}`,
        );
      }
    } catch (err) {
      console.log("PROFILE ERROR:", err);
      toast.error("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error("Please fill all required fields."); // ✅ ADD
      return;
    }
    try {
      setLoading(true);

      const payload = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        address, // ✅ matches your API response
        latitude: latitude,
        longitude: longitude
      };

      await toast.promise(updateMyProfile(payload), {
        loading: "Updating profile...",
        success: "Profile updated successfully.",
        error: "Update failed.",
      });
    } catch (err) {
      console.log("UPDATE ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

 useEffect(() => {
   fetchOrderList(currentPage);
 }, [currentPage]);

  // Fetch all orders for dashboard
  const fetchOrderList = async (page = 1) => {
    try {
      let reqData = {
        page: page,
        limit: 5, // 👈 pagination ke liye 5 hi rakho
        status: "",
      };

      const response: any = await getOrderList(reqData);

      if (response.data.success) {
        const ordersData = response.data.bookings || [];

        setOrders(ordersData);
        setTotalPages(response.data.total_pages || 1); // 👈 IMPORTANT
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    // smooth scroll top
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
      accepted: { label: "Accepted", className: "bg-blue-100 text-blue-700" },
      rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
      in_progress: {
        label: "In Progress",
        className: "bg-purple-100 text-purple-700",
      },
      delivering: {
        label: "Delivering",
        className: "bg-orange-100 text-orange-700",
      },
      finished: { label: "Finished", className: "bg-green-100 text-green-700" },
      delivered: {
        label: "Delivered",
        className: "bg-emerald-100 text-emerald-700",
      },
      completed: {
        label: "Completed",
        className: "bg-green-100 text-green-700",
      },
      cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.className} border-0`}>{config.label}</Badge>
    );
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();

    if (type === "profile") {
      formData.append("profile_photo", file);
      setProfilePreview(URL.createObjectURL(file));

      // ✅ remove error instantly
      setErrors((prev) => ({ ...prev, profile: "" }));
    }
    if (type === "id") {
      formData.append("government_id", file);

      setIdFile(file); // ✅ ADD THIS
      setIdPreview(URL.createObjectURL(file));

      setErrors((prev) => ({ ...prev, id: "" }));
    }

    try {
      await uploadProviderFile(formData);
      if (type === "profile") {
        toast.success("Profile photo uploaded."); // ✅ ADD
      }

      if (type === "id") {
        toast.success("ID uploaded successfully."); // ✅ ADD
      }
    } catch (err) {
      console.log("UPLOAD ERROR:", err);
      toast.error("File upload failed.");
    }
  };

  console.log(address);
  

  return (
    <>
      <div className="container-grid p-4 py-8">
        <div className="mb-4">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {t("myProfile")}
          </h1>
        </div>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
              {t("profileInfo")}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Profile Photo */}
                <div className="rounded-xl bg-card p-1">
                  <div className="rounded-lg p-2 text-center cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      id="profileUpload"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "profile")}
                    />

                    <label
                      htmlFor="profileUpload"
                      className="cursor-pointer block"
                    >
                      {profilePreview ? (
                        <div className="relative w-fit">
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
                      <p className="text-xs text-red-500 mt-2">
                        {errors.profile}
                      </p>
                    )}
                  </div>
                </div>
                <div></div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    {t("firstName")}
                    <span className="text-red-500"> *</span>
                  </label>
                  <Input
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      setErrors((prev: any) => ({ ...prev, firstName: "" }));
                    }}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    {t("lastName")}
                    <span className="text-red-500"> *</span>
                  </label>
                  <Input
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      setErrors((p: any) => ({ ...p, lastName: "" }));
                    }}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  {t("email")}
                  <span className="text-red-500"> *</span>
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((p: any) => ({ ...p, email: "" }));
                  }}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  {t("phone")}
                  <span className="text-red-500"> *</span>
                </label>
                <Input
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setPhone(val);
                    setErrors((p: any) => ({ ...p, phone: "" }));
                  }}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  {t("address")}
                  <span className="text-red-500"> *</span>
                </label>
                {/* <Input
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setErrors((p: any) => ({ ...p, address: "" }));
                  }}
                /> */}

                <GooglePlaceAutocomplete
                  value={address}
                  placeholder="Search address"
                  onChange={(val) => {
                    setAddress(val);
                  }}
                  onSelect={(place) => {
                    setAddress(place.address);

                    console.log("LAT:", place.lat);
                    console.log("LNG:", place.lng);


                    setLatitude(place.lat)
                    setLongitude(place.lng)
                  }}
                />
                {errors.address && (
                  <p className="text-xs text-red-500 mt-1">{errors.address}</p>
                )}
              </div>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : t("saveChanges")}
              </Button>
            </div>
          </div>

          {/* Recent Order */}
          <div className="mb-4">
            {orders.length > 0 ? (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <h2 className="font-heading text-xl font-semibold text-foreground mb-3 p-3">
                  Order history
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 text-left text-muted-foreground font-medium">
                          Order ID
                        </th>
                        <th className="px-4 py-3 text-left text-muted-foreground font-medium">
                          Provider
                        </th>
                        <th className="px-4 py-3 text-left text-muted-foreground font-medium">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-muted-foreground font-medium">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-muted-foreground font-medium">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-center text-muted-foreground font-medium">
                          View
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-border hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-xs text-foreground">
                            {order.order_id ||
                              `ORD-${order.id.toString().padStart(3, "0")}`}
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {order.provider?.business_name || order.provider_name || "-"}
                          </td>

                          <td className="px-4 py-3 text-muted-foreground">
                            {order.booking_date
                              ? new Date(order.booking_date)
                                  .toLocaleDateString("en-GB")
                                  .replace(/\//g, "-")
                              : "-"}
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground">
                            ${(parseFloat(order.total_amount) || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs text-primary"
                              onClick={() => navigate(`/order/${order.id}`)}
                            >
                              View Order
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {orders.length > 0 && (
                  <div className="mt-4 flex justify-center">
                    <PaginationController
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-center min-h-[300px]">
                <div className="text-center space-y-5">
                  {/* Icon */}
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
                    <Star size={24} />
                  </div>

                  {/* Badge */}
                  <div className="flex justify-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      <Zap size={12} /> Feature Coming Soon
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-semibold text-foreground">
                    Order History Coming Soon
                  </h2>

                  {/* Subtitle */}
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    You will soon be able to view your past orders, track
                    activity, and manage bookings here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerProfile;
