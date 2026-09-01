import { PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import PaginationController from "@/components/ui/PaginationController";
import { useEffect, useState } from "react";
import CategoryFilterTabs from "@/components/CategoryFilterTabs";
import { getOrderList } from "@/services/order.service";
import { saveOrderBookingState, clearAllBookingState } from "@/utils/bookingState";

const OrderTracking = () => {
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("All");

  const fetchOrderList = async (page = 1) => {
    try {
      setLoading(true);

      const reqData: any = {
        page: page,
        limit: 10,
      };

      if (categoryFilter !== "All") {
        reqData.service_category = categoryFilter;
      }

      const response = await getOrderList(reqData);

      if (response?.data?.success) {
        setOrderData(response.data.bookings || []);
        setTotalPages(response.data.total_pages || 1);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrderData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderList(currentPage);
  }, [currentPage, categoryFilter]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
      accepted: { label: "Accepted", className: "bg-blue-100 text-blue-700" },
      rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
      in_process: {
        label: "In Process",
        className: "bg-purple-100 text-purple-700",
      },
      finished: { label: "Finished", className: "bg-orange-100 text-orange-700" },
      delivered: {
        label: "Delivered",
        className: "bg-emerald-100 text-emerald-700",
      },
      cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.className} border-0`}>{config.label}</Badge>
    );
  };

  // LOADING
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] py-6">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const filteredOrders = orderData;

  return (
    <div className="min-h-screen bg-[#F5F7FA] py-6">
      <div className="max-w-[90%] mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h1 className="text-xl font-semibold text-gray-800">My Orders</h1>
          <CategoryFilterTabs
            activeCategory={categoryFilter}
            onChange={(cat) => {
              setCategoryFilter(cat);
              setCurrentPage(1);
            }}
          />
        </div>

        {filteredOrders.length > 0 ? (
          <>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-gray-600 bg-gray-50">
                      <th className="px-5 py-3 text-left">Order ID</th>
                      <th className="px-5 py-3 text-left">Provider</th>
                      <th className="px-5 py-3 text-left">Category</th>
                      <th className="px-5 py-3 text-left">Service Type</th>
                      <th className="px-5 py-3 text-left">Date</th>
                      <th className="px-5 py-3 text-left">Status</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                      <th className="px-5 py-3 text-right"></th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOrders.map((order: any) => (
                      <tr
                        key={order.id}
                        className="border-b last:border-0 hover:bg-gray-50 transition"
                      >
                        <td className="px-5 py-4">
                          {order.order_id ||
                            `ORD-${order.id.toString().padStart(3, "0")}`}
                        </td>

                        <td className="px-5 py-4 text-gray-600 font-medium">
                          {order.provider?.id || order.provider_id ? (
                            <Link
                              to={`/provider/${order.provider?.id || order.provider_id}?from=orders&orderId=${order.id}&category=${order.category_id || (order.service_category === "House Cleaning" ? 2 : order.service_category === "Car Wash" ? 3 : 1)}`}
                              onClick={() => saveOrderBookingState(order)}
                              className="text-foreground hover:text-primary hover:underline transition-colors font-medium"
                            >
                              {order.provider?.business_name || order.provider_name || "-"}
                            </Link>
                          ) : (
                            order.provider?.business_name || order.provider_name || "-"
                          )}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {order.service_category || "Laundry"}
                        </td>

                        {/* ✅ FIXED SERVICE TYPE */}
                        <td className="px-5 py-4 text-gray-600">
                          {order.service_types?.name ||
                            (order.service_type_id === 1
                              ? "In-home"
                              : order.service_type_id === 2
                                ? "Pick-up"
                                : "Drop-off")}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {order.booking_date
                            ? new Date(order.booking_date)
                              .toLocaleDateString("en-GB")
                              .replace(/\//g, "-")
                            : "-"}
                        </td>

                        <td className="px-5 py-4">
                          {getStatusBadge(order.status)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          ${(parseFloat(order.total_amount) || 0).toFixed(2)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => navigate(`/order/${order.id}`)}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View Order
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAGINATION */}
            <div className="mt-4">
              <PaginationController
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center min-h-[300px]">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <PackageCheck size={24} className="text-gray-500" />
              </div>

              <h2 className="text-base font-semibold text-gray-700">
                No Orders Found
              </h2>

              <Button onClick={() => {
                clearAllBookingState();
                navigate("/search");
              }}>Book Services</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
