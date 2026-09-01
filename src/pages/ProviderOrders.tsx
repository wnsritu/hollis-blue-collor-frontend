import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import PaginationController from "@/components/ui/PaginationController";
import { useBookings } from "@/hooks/useBookings";
import axios from "@/api/axios";
import { ShoppingBag } from "lucide-react";
import { updateOrderStatus } from "@/services/order.service";
import toast from "react-hot-toast";
import { ChevronUp, ChevronDown } from "lucide-react"; // Arrow Icons
import CategoryFilterTabs from "@/components/CategoryFilterTabs";
import { formatStatus } from "@/utils/format";

const ProviderOrders = () => {
  const { t } = useTranslation();

  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  const itemsPerPage = 10;
  const {
    bookings,
    loading,
    currentPage,
    setCurrentPage,
    totalPages,
    changeStatus,
    loadBookings,
  } = useBookings(itemsPerPage, categoryFilter);

  const [sortField, setSortField] = useState<string>("booking_date"); // Default sorting by date
  const [sortOrder, setSortOrder] = useState<string>("desc"); // Default descending order

  const updateStatus = (id: number, status: string) => {
    changeStatus(id, status);
  };

  const SortHeader = ({ label, field, sortField, sortOrder, onSort }) => {
    const isActive = sortField === field;

    return (
      <th
        onClick={() => onSort(field)}
        className="px-5 py-3 text-left font-semibold cursor-pointer select-none hover:text-primary"
      >
        <div className="flex items-center gap-1">
          <span>{label}</span>

          {isActive ? (
            sortOrder === "asc" ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )
          ) : (
            <ChevronUp size={12} className="opacity-30" />
          )}
        </div>
      </th>
    );
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateBookingStatus = async (id: number, newStatus: string) => {
    try {
      let reqData = {
        booking_id: id,
        status: newStatus,
      };
      const updatePromise = updateOrderStatus(reqData);

      const response: any = await toast.promise(updatePromise, {
        loading: `Updating booking status...`,
        success: (res) => {
          if (res.status) {
            return `Booking ${newStatus} successfully`;
          }
          throw new Error("Update failed");
        },
        error: "Failed to update booking status",
      });

      if (response.status) {
        loadBookings(currentPage, categoryFilter);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      // Toggle sorting order if the same column is clicked
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc"); // Default to ascending if a new column is clicked
    }
  };

  const sortedBookings = [...bookings].sort((a, b) => {
    let fieldA = a[sortField];
    let fieldB = b[sortField];

    // customer name sorting fix
    if (sortField === "customer") {
      fieldA = `${a.customer?.first_name || ""} ${a.customer?.last_name || ""}`;
      fieldB = `${b.customer?.first_name || ""} ${b.customer?.last_name || ""}`;
    }

    if (fieldA < fieldB) return sortOrder === "asc" ? -1 : 1;
    if (fieldA > fieldB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const filteredBookings = sortedBookings;
  return (
    <>
      {location.pathname !== "/provider/orders" ? (
        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="text-center space-y-5">
            {/* Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
              <ShoppingBag size={24} />
            </div>

            {/* Title */}
            <h2 className="text-lg font-semibold text-foreground">
              Orders Coming Soon
            </h2>

            {/* Subtitle */}
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              We're working on order management features. You'll be able to view
              and manage your orders here soon.
            </p>
          </div>
        </div>
      ) : (
        <div className="container-grid py-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-heading text-2xl font-bold text-foreground">
              {t("providerOrders")}
            </h1>
            <CategoryFilterTabs
              activeCategory={categoryFilter}
              onChange={(cat) => {
                setCategoryFilter(cat);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/50">
                  <SortHeader
                    label={t("orderId")}
                    field="id"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />

                  <SortHeader
                    label={t("customer")}
                    field="customer"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />

                  <SortHeader
                    label="Category"
                    field="service_category"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />

                  <SortHeader
                    label="Order Type"
                    field="items"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />

                  <SortHeader
                    label="Service Type"
                    field="service_type_id"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />

                  <SortHeader
                    label={t("serviceDate")}
                    field="booking_date"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />

                  <SortHeader
                    label={t("status")}
                    field="status"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />

                  <th className="px-5 py-3 text-right font-semibold">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-4 text-muted-foreground"
                    >
                      {t("No Orders Found")}
                    </td>
                  </tr>
                )}
                {filteredBookings.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-5 py-3 font-medium">
                      {`ORD-${String(order.id).padStart(3, "0")}`}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {order.customer?.first_name} {order.customer?.last_name}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {order.service_category || "Laundry"}
                    </td>
                    <td className="px-5 py-3">
                      {/* <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          order.items.length > 0
                            ? "bg-gray-100 text-gray-700"
                            : "bg-blue-500 text-white"
                        }`}
                      >
                        {order.items.length > 0 ? "Standard" : "Bulk"}
                      </span> */}

                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          !order.items || order.items.length === 0
                            ? "bg-blue-500 text-white" // Bulk
                            : order.items[0]?.item_name
                            ? "bg-gray-100 text-gray-700" // Standard
                            : "bg-orange-400 text-white" // Custom
                        }`}
                      >
                        {!order.items || order.items.length === 0
                          ? "Bulk"
                          : order.items[0]?.item_name
                          ? "Standard"
                          : "Custom"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {[1, 5, 6].includes(Number(order.service_type_id))
                        ? "In-home"
                        : [2].includes(Number(order.service_type_id))
                          ? "Pick-up"
                          : "Drop-off"}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(order.booking_date).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          order.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : order.status === "accepted"
                              ? "bg-blue-100 text-blue-700"
                              : order.status === "in_process"
                                ? "bg-orange-100 text-orange-600"
                                : order.status === "received"
                                  ? "bg-purple-100 text-purple-700"
                                  : order.status === "finished"
                                    ? "bg-green-100 text-green-600"
                                    : order.status === "cancelled"
                                      ? "bg-red-100 text-red-600"
                                      : order.status === "rejected"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-secondary/10 text-secondary"
                        }`}
                      >
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                        <Link to={`/provider/order/${order.id}`}>
                          <Button size="sm" variant="outline">
                            {t("viewOrder")}
                          </Button>
                        </Link>

                        {order.status?.toLowerCase() === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() =>
                                updateBookingStatus(order.id, "accepted")
                              }
                            >
                              {t("accept")}
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                updateBookingStatus(order.id, "rejected")
                              }
                            >
                              {t("reject")}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationController
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </>
  );
};

export default ProviderOrders;
