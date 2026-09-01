import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shirt, Sparkles, Car, HelpCircle } from "lucide-react";
import { getAdminDashboardApi } from "@/api/admin.api";

const CATS_CONFIG = [
  { name: "Laundry", icon: Shirt, color: "text-primary bg-primary/10" },
  { name: "House Cleaning", icon: Sparkles, color: "text-emerald-600 bg-emerald-50" },
  { name: "Car Wash", icon: Car, color: "text-blue-600 bg-blue-50" },
];

const AdminServices = () => {
  const [serviceStats, setServiceStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServicesStats = async () => {
      try {
        setLoading(true);
        const response = await getAdminDashboardApi();
        if (response.data.success && response.data.data.service_stats) {
          setServiceStats(response.data.data.service_stats);
        }
      } catch (error) {
        console.error("Error fetching admin services stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServicesStats();
  }, []);

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Services</h1>
        <p className="text-sm text-muted-foreground">Manage the service categories offered on the platform.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3 h-16 bg-accent/20 rounded-t-xl" />
              <CardContent className="h-32 bg-accent/10 rounded-b-xl" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {CATS_CONFIG.map((c) => {
            const stat = serviceStats.find((s) => s.name === c.name) || {
              activeProviders: 0,
              totalOrders: 0,
            };

            return (
              <Card key={c.name}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.color}`}>
                      <c.icon size={18} />
                    </span>
                    {c.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-accent p-3">
                      <p className="text-xs text-muted-foreground">Active Providers</p>
                      <p className="text-lg font-bold text-foreground">{stat.activeProviders}</p>
                    </div>
                    <div className="rounded-lg bg-accent p-3">
                      <p className="text-xs text-muted-foreground">Total Orders</p>
                      <p className="text-lg font-bold text-foreground">{stat.totalOrders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminServices;
