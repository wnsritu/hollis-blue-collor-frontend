import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  HelpCircle,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
  CreditCard,
  Lock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Stepper } from "@/components/shared/Timeline";
import { Avatar, VerifiedBadge } from "@/components/shared/primitives";
import StripeBookingModal from "@/components/payment/StripeBookingModal";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { BOOK_SERVICE_STEPS as STEPS } from "@/constants/booking";
import { useBookService } from "@/hooks/useBookService";
import { useFormik } from "formik";
import {
  bookingAddressValidationSchema,
  type BookingAddressFormValues,
  bookingPaymentValidationSchema,
  type BookingPaymentFormValues,
  DEFAULT_BOOKING_PAYMENT_VALUES,
} from "@/validations/booking";

export default function BookService() {
  const {
    providerId,
    navigate,
    isAuthenticated,
    user,
    provider,
    offeredServices,
    timeSlots,
    providerSchedule,
    loading,
    step,
    setStep,
    selectedItems,
    dates,
    selectedDate,
    setSelectedDate,
    selectedTimeSlotId,
    setSelectedTimeSlotId,
    selectedTimeSlotLabel,
    setSelectedTimeSlotLabel,
    formatSlotLabel,
    details,
    setDetails,
    quoteModalOpen,
    setQuoteModalOpen,
    createdBooking,
    stripeModalOpen,
    setStripeModalOpen,
    submitting,
    updateQty,
    addItem,
    removeItem,
    subtotal,
    serviceFee,
    grandTotal,
    selectedDateObj,
    unselectedServices,
    handleProceedToStep2,
    handleProceedToStep3,
    handleCreateBookingAndPay,
  } = useBookService();

  const addressFormik = useFormik<BookingAddressFormValues>({
    initialValues: {
      name: details.name || user?.full_name || "",
      phone: details.phone || user?.phone || "",
      address: details.address || "",
      city: details.city || "",
      zip: details.zip || "",
      notes: details.notes || "",
    },
    enableReinitialize: true,
    validationSchema: bookingAddressValidationSchema,
    onSubmit: (values) => {
      setDetails(values);
      if (!selectedDate) {
        toast.error("Please select a preferred service date.");
        return;
      }
      if (!selectedTimeSlotId) {
        toast.error("Please select an available time slot for this provider.");
        return;
      }
      setStep(2);
    },
  });

  const paymentFormik = useFormik<BookingPaymentFormValues>({
    initialValues: DEFAULT_BOOKING_PAYMENT_VALUES,
    validationSchema: bookingPaymentValidationSchema,
    onSubmit: () => {
      handleCreateBookingAndPay();
    },
  });


  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Loading provider schedule & booking options...</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="container-page py-12 text-center">
        <h2 className="text-xl font-bold text-foreground">Provider Not Found</h2>
        <p className="text-muted-foreground mt-2">The requested service provider could not be found.</p>
        <Button onClick={() => navigate("/search")} className="mt-4">
          Browse Service Providers
        </Button>
      </div>
    );
  }

  const businessName = provider.business_name || provider.user?.full_name || "Service Professional";
  const initials = businessName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const providerLocation =
    [provider.city, provider.state || provider.user?.state].filter(Boolean).join(", ") ||
    provider.service_location_address ||
    "Austin, TX";

  const enteredAddress = addressFormik.values.address || details.address;
  const enteredCity = addressFormik.values.city || details.city;
  const summaryLocation = enteredAddress
    ? [enteredAddress, enteredCity].filter(Boolean).join(", ")
    : providerLocation;

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header Banner */}
      <section className="border-b border-border bg-card py-6">
        <div className="container-page space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1 text-muted-foreground">
              <ArrowLeft size={16} /> Back
            </Button>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
              Book Services with {businessName}
            </h1>
          </div>
          <div className="pt-2">
            <Stepper steps={STEPS} current={Math.min(step, 2)} />
          </div>
        </div>
      </section>

      {/* Main Content & Sidebar Grid */}
      <section className="container-page grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {/* STEP 0: SERVICES SELECTION */}
          {step === 0 && (
            <div className="space-y-6">
              {/* Provider Info Summary Card */}
              <Card className="shadow-card border-border/80">
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Avatar initials={initials} src={resolveMediaUrl(provider.logo_url || provider.user?.photo)} size="lg" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-base text-foreground truncate">{businessName}</h2>
                        {(provider.verified === "verified" || provider.verified === "approved") && <VerifiedBadge compact />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {provider.category?.name || "Services"} • {providerLocation}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-amber-500 mt-1">
                        <Star size={13} className="fill-amber-500 text-amber-500" />
                        <span className="font-semibold">{provider.rating || "4.9"}</span>
                        <span className="text-muted-foreground">({provider.reviews_count || provider.review_count || 12} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setQuoteModalOpen(true)} className="hidden sm:flex gap-1.5 text-xs">
                    <HelpCircle size={14} /> Request a Quote
                  </Button>
                </CardContent>
              </Card>

              {/* Selected Services / Cart */}
              <Card className="shadow-card border-border/80">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-base font-bold text-foreground">Selected Services</CardTitle>
                </CardHeader>
                <CardContent className="p-5 divide-y divide-border/60">
                  {selectedItems.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No services selected yet. Add a service below to get started.</p>
                  ) : (
                    selectedItems.map((item) => (
                      <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0 flex-1">
                          <h3 className="font-semibold text-sm text-foreground">{item.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                          <p className="text-xs font-semibold text-primary">
                            ${item.price} <span className="font-normal text-muted-foreground">/{item.unit || "flat rate"}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-4 self-end sm:self-center">
                          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-1">
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, -1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-card text-foreground shadow-xs hover:bg-muted transition-colors"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-foreground">{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-card text-foreground shadow-xs hover:bg-muted transition-colors"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-muted-foreground hover:text-destructive p-1.5 transition-colors"
                            title="Remove service"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Additional Services Offered */}
              {unselectedServices.length > 0 && (
                <Card className="shadow-card border-border/80">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <CardTitle className="text-base font-bold text-foreground">
                      Additional Services by Provider
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 divide-y divide-border/60">
                    {unselectedServices.map((service) => (
                      <div key={service.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0 flex-1">
                          <h4 className="text-sm font-semibold text-foreground">{service.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">{service.description}</p>
                          <p className="text-xs font-semibold text-primary">
                            ${service.price} <span className="font-normal text-muted-foreground">/{service.unit || "flat rate"}</span>
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addItem(service)}
                          className="shrink-0 text-xs font-semibold gap-1.5"
                        >
                          <Plus size={14} /> Add
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setQuoteModalOpen(true)}
                  className="w-full sm:w-auto text-xs gap-1.5"
                >
                  <HelpCircle size={15} /> Need a Custom Quote?
                </Button>

                <Button
                  onClick={handleProceedToStep2}
                  disabled={selectedItems.length === 0}
                  className="w-full sm:w-auto gap-2 px-6"
                >
                  Continue to Date & Address <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 1: DATE, TIME & ADDRESS */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Date Selection (Filtered by Provider Availability) */}
              <Card className="shadow-card border-border/80">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <CalendarDays size={18} className="text-primary" /> Select Preferred Date
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                    {dates.map((d) => {
                      const isSelected = selectedDate === d.iso;
                      const activeSlotIds = providerSchedule ? providerSchedule[d.dayOfWeekLong] || [] : null;
                      const isUnavailable = providerSchedule ? activeSlotIds && activeSlotIds.length === 0 : false;

                      return (
                        <button
                          key={d.iso}
                          type="button"
                          disabled={isUnavailable}
                          onClick={() => setSelectedDate(d.iso)}
                          className={`rounded-xl border p-2.5 text-center transition-all ${isUnavailable
                              ? "bg-muted/40 text-muted-foreground/60 border-border/40 cursor-not-allowed opacity-60"
                              : isSelected
                                ? "border-primary bg-primary text-primary-foreground shadow-xs font-bold ring-2 ring-primary/20"
                                : "border-border hover:border-primary/40 bg-card text-foreground cursor-pointer"
                            }`}
                        >
                          <span className="block text-[11px] font-medium opacity-80">
                            {d.dayName}
                          </span>
                          <span className="block font-display text-lg font-bold">{d.day}</span>
                          <span className="block text-[11px] opacity-80">
                            {isUnavailable ? (
                              <span className="text-destructive/80 font-medium">Unavailable</span>
                            ) : (
                              d.month
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Time Slot Selection (Filtered by Provider Availability for Selected Date) */}
              <Card className="shadow-card border-border/80">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <Clock size={18} className="text-primary" /> Select Time Slot
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  {(() => {
                    const currentDayLong = dates.find((d) => d.iso === selectedDate)?.dayOfWeekLong || "";
                    const activeSlotIds = providerSchedule && currentDayLong ? providerSchedule[currentDayLong] : null;

                    const availableSlots = activeSlotIds
                      ? timeSlots.filter((s) => activeSlotIds.includes(Number(s.id)))
                      : timeSlots;

                    if (availableSlots.length === 0) {
                      return (
                        <div className="p-6 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
                          No active time slots configured by provider for {currentDayLong || "this date"}. Please select another date.
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {availableSlots.map((s) => {
                          const id = Number(s.id);
                          const label = formatSlotLabel(s);
                          const isSelected = selectedTimeSlotId === id;
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => {
                                setSelectedTimeSlotId(id);
                                setSelectedTimeSlotLabel(label);
                              }}
                              className={`flex items-center justify-between rounded-xl border p-3.5 text-sm font-semibold transition-all ${isSelected
                                  ? "border-primary bg-primary-soft text-primary shadow-xs ring-2 ring-primary/20"
                                  : "border-border bg-card hover:border-primary/40 text-foreground cursor-pointer"
                                }`}
                            >
                              <span>{label}</span>
                              {isSelected && (
                                <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                                  <CheckCircle2 size={13} />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Address & Instructions Form */}
              <Card className="shadow-card border-border/80">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <MapPin size={18} className="text-primary" /> Service Address & Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-semibold">
                        Your Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={addressFormik.values.name}
                        onChange={addressFormik.handleChange}
                        onBlur={addressFormik.handleBlur}
                        placeholder="John Doe"
                        className={
                          addressFormik.touched.name && addressFormik.errors.name
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                      />
                      {addressFormik.touched.name && addressFormik.errors.name && (
                        <p className="text-xs font-medium text-destructive mt-1">
                          {addressFormik.errors.name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-semibold">
                        Phone Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={addressFormik.values.phone}
                        onChange={addressFormik.handleChange}
                        onBlur={addressFormik.handleBlur}
                        placeholder="(512) 555-0100"
                        className={
                          addressFormik.touched.phone && addressFormik.errors.phone
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                      />
                      {addressFormik.touched.phone && addressFormik.errors.phone && (
                        <p className="text-xs font-medium text-destructive mt-1">
                          {addressFormik.errors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="text-xs font-semibold">
                      Street Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      value={addressFormik.values.address}
                      onChange={addressFormik.handleChange}
                      onBlur={addressFormik.handleBlur}
                      placeholder="123 Main Street"
                      className={
                        addressFormik.touched.address && addressFormik.errors.address
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                    />
                    {addressFormik.touched.address && addressFormik.errors.address && (
                      <p className="text-xs font-medium text-destructive mt-1">
                        {addressFormik.errors.address}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="city" className="text-xs font-semibold">
                        City <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="city"
                        name="city"
                        value={addressFormik.values.city}
                        onChange={addressFormik.handleChange}
                        onBlur={addressFormik.handleBlur}
                        placeholder="Austin"
                        className={
                          addressFormik.touched.city && addressFormik.errors.city
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                      />
                      {addressFormik.touched.city && addressFormik.errors.city && (
                        <p className="text-xs font-medium text-destructive mt-1">
                          {addressFormik.errors.city}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="zip" className="text-xs font-semibold">
                        ZIP / Postal Code <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="zip"
                        name="zip"
                        value={addressFormik.values.zip}
                        onChange={addressFormik.handleChange}
                        onBlur={addressFormik.handleBlur}
                        placeholder="78701"
                        className={
                          addressFormik.touched.zip && addressFormik.errors.zip
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                      />
                      {addressFormik.touched.zip && addressFormik.errors.zip && (
                        <p className="text-xs font-medium text-destructive mt-1">
                          {addressFormik.errors.zip}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notes" className="text-xs font-semibold">
                        Special Instructions or Notes (Optional)
                      </Label>
                      <span
                        className={`text-[11px] ${
                          addressFormik.values.notes.length > 450
                            ? "text-amber-500 font-semibold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {addressFormik.values.notes.length} / 500 characters
                      </span>
                    </div>
                    <Textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      value={addressFormik.values.notes}
                      onChange={addressFormik.handleChange}
                      onBlur={addressFormik.handleBlur}
                      placeholder="Gate code, parking instructions, or specific areas of focus..."
                      className={
                        addressFormik.touched.notes && addressFormik.errors.notes
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                    />
                    {addressFormik.touched.notes && addressFormik.errors.notes && (
                      <p className="text-xs font-medium text-destructive mt-1">
                        {addressFormik.errors.notes}
                      </p>
                    )}
                    {addressFormik.values.notes.length > 450 && (
                      <p className="text-[11px] text-amber-500 font-medium">
                        Approaching maximum character limit (500 characters).
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(0)}>
                  <ArrowLeft size={16} className="mr-1.5" /> Back to Services
                </Button>
                <Button
                  size="lg"
                  onClick={() => addressFormik.handleSubmit()}
                  className="gap-2 shadow-sm"
                >
                  Review & Pay <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW & PAY */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Review Order Details */}
              <Card className="shadow-card border-border/80">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-base font-bold text-foreground">Review Order Details</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <dl className="divide-y divide-border/60 text-sm">
                    <div className="flex justify-between items-center py-2.5">
                      <dt className="text-muted-foreground">Provider</dt>
                      <dd className="font-bold text-foreground">{businessName}</dd>
                    </div>
                    <div className="flex justify-between items-center py-2.5">
                      <dt className="text-muted-foreground">Date & Time</dt>
                      <dd className="font-semibold text-foreground">
                        {selectedDateObj?.fullLabel || selectedDate} {selectedTimeSlotLabel ? `(${selectedTimeSlotLabel})` : ""}
                      </dd>
                    </div>
                    <div className="flex justify-between items-center py-2.5">
                      <dt className="text-muted-foreground">Service Address</dt>
                      <dd className="font-medium text-foreground text-right">
                        {details.address ? `${details.address}, ${details.city}, ${details.zip}` : "No address provided"}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Payment Method & Payment Summary Panels */}
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                {/* Payment Method Card */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <h2 className="font-display text-lg font-bold text-foreground">Payment method</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Enter your credit card or payment details below to complete your order securely.
                  </p>

                  <div className="mt-5 grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="cardNumber" className="text-xs font-semibold">
                        Card number <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <CreditCard
                          size={16}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <Input
                          id="cardNumber"
                          name="cardNumber"
                          placeholder="4242 4242 4242 4242"
                          value={paymentFormik.values.cardNumber}
                          onChange={paymentFormik.handleChange}
                          onBlur={paymentFormik.handleBlur}
                          inputMode="numeric"
                          className={`pl-9 ${
                            paymentFormik.touched.cardNumber && paymentFormik.errors.cardNumber
                              ? "border-destructive focus-visible:ring-destructive"
                              : ""
                          }`}
                        />
                      </div>
                      {paymentFormik.touched.cardNumber && paymentFormik.errors.cardNumber && (
                        <p className="text-xs text-destructive font-medium">{paymentFormik.errors.cardNumber}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor="expiry" className="text-xs font-semibold">
                          Expiry <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="expiry"
                          name="expiry"
                          placeholder="09 / 29"
                          value={paymentFormik.values.expiry}
                          onChange={paymentFormik.handleChange}
                          onBlur={paymentFormik.handleBlur}
                          className={
                            paymentFormik.touched.expiry && paymentFormik.errors.expiry
                              ? "border-destructive focus-visible:ring-destructive"
                              : ""
                          }
                        />
                        {paymentFormik.touched.expiry && paymentFormik.errors.expiry && (
                          <p className="text-[11px] text-destructive font-medium">{paymentFormik.errors.expiry}</p>
                        )}
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="cvc" className="text-xs font-semibold">
                          CVC <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="cvc"
                          name="cvc"
                          placeholder="123"
                          value={paymentFormik.values.cvc}
                          onChange={paymentFormik.handleChange}
                          onBlur={paymentFormik.handleBlur}
                          className={
                            paymentFormik.touched.cvc && paymentFormik.errors.cvc
                              ? "border-destructive focus-visible:ring-destructive"
                              : ""
                          }
                        />
                        {paymentFormik.touched.cvc && paymentFormik.errors.cvc && (
                          <p className="text-[11px] text-destructive font-medium">{paymentFormik.errors.cvc}</p>
                        )}
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="zip" className="text-xs font-semibold">
                          Billing ZIP <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="zip"
                          name="zip"
                          placeholder="78704"
                          value={paymentFormik.values.zip}
                          onChange={paymentFormik.handleChange}
                          onBlur={paymentFormik.handleBlur}
                          className={
                            paymentFormik.touched.zip && paymentFormik.errors.zip
                              ? "border-destructive focus-visible:ring-destructive"
                              : ""
                          }
                        />
                        {paymentFormik.touched.zip && paymentFormik.errors.zip && (
                          <p className="text-[11px] text-destructive font-medium">{paymentFormik.errors.zip}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="nameOnCard" className="text-xs font-semibold">
                        Name on card <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="nameOnCard"
                        name="nameOnCard"
                        placeholder="e.g. John Doe"
                        value={paymentFormik.values.nameOnCard}
                        onChange={paymentFormik.handleChange}
                        onBlur={paymentFormik.handleBlur}
                        className={
                          paymentFormik.touched.nameOnCard && paymentFormik.errors.nameOnCard
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                      />
                      {paymentFormik.touched.nameOnCard && paymentFormik.errors.nameOnCard && (
                        <p className="text-xs text-destructive font-medium">{paymentFormik.errors.nameOnCard}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-4">
                    <ShieldCheck size={14} className="text-success" /> Secure 256-bit SSL encrypted transaction.
                  </div>
                </div>

                {/* Payment Summary Card */}
                <div className="h-max rounded-2xl border border-border bg-card p-6 shadow-card">
                  <h2 className="font-display text-lg font-bold text-foreground">Payment Summary</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Paying through Hollis platform to {businessName}
                  </p>

                  <dl className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-foreground">Subtotal (Services)</dt>
                      <dd className="font-semibold text-foreground">${subtotal}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Service Fee (10%)</dt>
                      <dd className="text-muted-foreground font-medium">${serviceFee}</dd>
                    </div>
                  </dl>

                  <div className="my-4 border-t border-border/60" />

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Total due</span>
                    <span className="font-display text-2xl font-bold text-foreground">${grandTotal}</span>
                  </div>

                  <Button
                    size="lg"
                    type="button"
                    onClick={() => paymentFormik.handleSubmit()}
                    disabled={submitting}
                    className="mt-5 w-full gap-2 shadow-sm font-semibold"
                  >
                    {submitting ? (
                      "Processing..."
                    ) : (
                      <>
                        <Lock size={16} /> Pay & Confirm Booking
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex justify-start">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft size={16} className="mr-1.5" /> Back to Date & Address
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR: STICKY ORDER SUMMARY */}
        <aside className="space-y-6">
          <Card className="shadow-card border-border/80 sticky top-20">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wide">
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Provider Info */}
              <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                <Avatar initials={initials} src={resolveMediaUrl(provider.logo_url || provider.user?.photo)} size="sm" />
                <div className="min-w-0">
                  <p className="font-bold text-xs text-foreground truncate">{businessName}</p>
                  <p className="text-[11px] text-muted-foreground">{providerLocation}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 text-xs">
                {selectedItems.length === 0 ? (
                  <p className="text-muted-foreground italic">No items selected</p>
                ) : (
                  selectedItems.map((i) => (
                    <div key={i.id} className="flex justify-between items-center">
                      <span className="text-foreground truncate max-w-[190px]">
                        {i.name} <span className="text-muted-foreground font-semibold">(x{i.qty})</span>
                      </span>
                      <span className="font-semibold text-foreground">${Number(i.price) * (i.qty || 1)}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Date & Address Preview */}
              <div className="pt-3 border-t border-border/60 space-y-2 text-xs text-muted-foreground">
                {selectedDateObj && (
                  <div className="flex items-center gap-1.5">
                    <CalendarDays size={13} className="text-primary shrink-0" />
                    <span className="truncate">{selectedDateObj.fullLabel}</span>
                  </div>
                )}
                {selectedTimeSlotLabel && (
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-primary shrink-0" />
                    <span className="truncate">{selectedTimeSlotLabel}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-primary shrink-0" />
                  <span className="truncate">{summaryLocation}</span>
                </div>
              </div>

              {/* Price Calculation Breakdown */}
              <div className="pt-3 border-t border-border/60 space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-semibold text-foreground">${subtotal}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Service Fee (10%)</span>
                  <span className="font-semibold text-foreground">${serviceFee}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-border/60">
                  <span>Total</span>
                  <span className="text-primary text-base">${grandTotal}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>

      {/* Quote Request Modal */}
      <CreateProjectModal
        open={quoteModalOpen}
        onOpenChange={setQuoteModalOpen}
        initialCategoryId={provider?.category_id}
        initialServiceTypeId={provider?.service_type_id}
        providerId={provider?.id}
        providerName={businessName}
        categoryName={provider?.category?.name || "Services"}
        subCategoryName={provider?.service_type?.name}
        onProjectCreated={() => {
          navigate("/projects");
        }}
      />

      {/* Stripe Payment Modal - commented out for now; will be re-enabled in future when paid status is ready */}
      {/*
      {createdBooking && (
        <StripeBookingModal
          isOpen={stripeModalOpen}
          onClose={() => setStripeModalOpen(false)}
          bookingData={createdBooking}
          onSuccess={(paymentIntent) => {
            toast.success("Payment confirmed! Your booking is complete.");
            navigate("/appointments");
          }}
        />
      )}
      */}
    </div>
  );
}
