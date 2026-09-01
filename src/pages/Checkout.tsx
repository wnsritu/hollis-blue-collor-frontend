import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle } from "lucide-react";

const mockOrderItems = [
  { item: "Shirt", service: "Wash", quantity: 3, price: 11.97 },
  { item: "Pants", service: "Iron", quantity: 2, price: 6.98 },
  { item: "Dress", service: "Fold", quantity: 1, price: 3.49 },
];

const Checkout = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [paid, setPaid] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const subtotal = mockOrderItems.reduce((s, i) => s + i.price, 0);
  const deliveryFee = 4.99;
  const total = subtotal + deliveryFee;

  if (paid) {
    return (
      <div className="container-grid flex min-h-[60vh] flex-col items-center justify-center text-center">
        <CheckCircle size={64} className="text-secondary" />
        <h1 className="mt-4 font-heading text-2xl font-bold text-foreground">{t("paymentSuccess")}</h1>
        <p className="mt-2 text-muted-foreground">{t("orderPlaced")}</p>
        <Button className="mt-6" onClick={() => navigate("/orders")}>{t("trackOrder")}</Button>
      </div>
    );
  }

  return (
    <div className="container-grid py-8">
      <h1 className="font-heading text-2xl font-bold text-foreground">{t("checkout")}</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-heading text-base font-semibold text-foreground">{t("orderSummary")}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 text-left font-semibold">{t("item")}</th>
                  <th className="pb-2 text-left font-semibold">{t("service")}</th>
                  <th className="pb-2 text-right font-semibold">{t("quantity")}</th>
                  <th className="pb-2 text-right font-semibold">{t("total")}</th>
                </tr>
              </thead>
              <tbody>
                {mockOrderItems.map((item, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-2.5">{item.item}</td>
                    <td className="py-2.5">{item.service}</td>
                    <td className="py-2.5 text-right">{item.quantity}</td>
                    <td className="py-2.5 text-right">${item.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{t("subtotal")}</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("deliveryFee")}</span><span>${deliveryFee.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold text-base pt-1"><span>{t("total")}</span><span>${total.toFixed(2)}</span></div>
          </div>
          <Button className="mt-4 w-full" variant="outline">{t("proceedPayment")}</Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-heading text-base font-semibold text-foreground">{t("paymentDetails")}</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">{t("cardNumber")}</label>
              <Input placeholder="1234 5678 9012 3456" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-foreground">{t("expiryDate")}</label>
                <Input placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
              </div>
              <div className="w-28">
                <label className="mb-1 block text-sm font-medium text-foreground">{t("cvv")}</label>
                <Input placeholder="123" value={cvv} onChange={(e) => setCvv(e.target.value)} />
              </div>
            </div>
            <Button className="w-full" onClick={() => setPaid(true)}>
              {t("payNow")} — ${total.toFixed(2)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
