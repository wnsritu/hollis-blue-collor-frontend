import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminCoinsHistory } from "@/data/adminMockData";
import { Coins, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { addUpdateCoins, getAllCoinHistory, getAllProvider } from "@/api/admin.api";
import PaginationController from "@/components/ui/PaginationController";
import toast from "react-hot-toast";
import { Select } from "@radix-ui/react-select";

const AdminCoins = () => {
  const showComingSoon = true;

  const [coinsHistory, setCoinsHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetchProviders(currentPage);
  }, [currentPage]);

  const fetchProviders = async (page = 1) => {
    try {
      setLoading(true);

      const res: any = await getAllProvider({
        page,
        limit: 100,
      });

      // ✅ ALWAYS correct path: res.data.data
      const providersData = res?.data?.data || [];

      setProviders(providersData);

      setTotalPages(res?.data?.pagination?.totalPages || 1);
    } catch (err) {
      console.log("ERROR:", err);
      toast.error("Failed to load providers.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCoinsHistory = async (page = 1) => {
    try {
      setLoading(true);
      let req = {
        page: page,
        limit: 10,
        // user_id: 4  (optional)
      };
      const res = await getAllCoinHistory(req);

      if (res.data.success) {
        setCoinsHistory(res.data.data);
        setTotalPages(res.data.pagination.total_pages); // 👈 important
        setCurrentPage(res.data.pagination.page);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoinsHistory(currentPage);
  }, [currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleAddCoins = async (status: string) => {
    if (!selectedProvider || !amount) {
      toast.error("Please select provider and enter amount");
      return;
    }

    try {
      let req = {
        user_id: Number(selectedProvider), // 👈 selected id
        amount: Number(amount),
        reason: reason,
        type: status
      }
      const res = await addUpdateCoins(req);

      if (res.data.success) {

        toast.success(res.data.message);

        // reset fields
        setAmount("");
        setReason("");
        setSelectedProvider("");
        
        // refresh history
        fetchCoinsHistory(currentPage);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      {!showComingSoon ? (
        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="text-center space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
              <Coins size={24} />
            </div>

            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Settings size={12} /> Admin Control
              </span>
            </div>

            <h2 className="text-lg font-semibold text-foreground">
              Coins Management Coming Soon
            </h2>

            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Admins will soon be able to manage user coins, rewards, and
              transaction history from this panel.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Coins Management
          </h1>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Manage Coins</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-2">
                  <Label>User ID</Label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                  >
                    <option value="">Select Provider</option>
                    {providers?.map((p) => (
                     <option key={p?.id} value={p?.user.id}>
                      {p?.business_name}
                    </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Coins Amount</Label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Input
                    placeholder="e.g. Welcome Bonus"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                <div className="flex items-end gap-2">
                  <Button className="flex-1"  onClick={() => handleAddCoins("credit")}>Add</Button>
                  <Button variant="outline" className="flex-1"  onClick={() => handleAddCoins("debit")}>
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Coins History</CardTitle>
            </CardHeader>

            {coinsHistory?.length > 0 ? (
            <>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Coins</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Reason
                      </TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {coinsHistory.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium text-foreground">
                          {c.provider_name}
                        </TableCell>

                        <TableCell
                          className={
                            c.type === "credit"
                              ? "text-secondary font-medium"
                              : "text-destructive font-medium"
                          }
                        >
                          {c.display_amount}
                        </TableCell>

                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {c.reason}
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <PaginationController
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
            ) : (
              <div className="flex items-center justify-center min-h-[30vh] p-5">
                <div className="text-center space-y-5">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
                    <Coins size={24} />
                  </div>

                  <div className="flex justify-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      <Settings size={12} /> Admin Control
                    </span>
                  </div>

                  <h2 className="text-lg font-semibold text-foreground">
                    No Coin History Found
                  </h2>

                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    There are no coin transactions yet. Once you add or remove coins
                    from providers, history will appear here.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
};

export default AdminCoins;
