import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { catalogApi } from "@/services/catalog";
import type { Category } from "@/types/api/catalog";
import type { ServiceFlatRow } from "@/types/admin.types";

export function useAdminServices() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredServices, setFilteredServices] = useState<ServiceFlatRow[]>([]);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedParentFilter, setSelectedParentFilter] = useState("ALL");
  const [selectedSubFilter, setSelectedSubFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  // Global Add Services Modal State (Parent -> Subcategory -> Chips)
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [modalParentId, setModalParentId] = useState<string>("");
  const [modalSubId, setModalSubId] = useState<string>("");
  const [serviceChips, setServiceChips] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Edit Single Service Modal State
  const [editingService, setEditingService] = useState<ServiceFlatRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Debounce search input for UI responsiveness and backend efficiency (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch Tree for Category and Subcategory dropdowns
  const fetchCatalogTree = async () => {
    try {
      const res = await catalogApi.getTree();
      const data = (res as any)?.data || res || [];
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load catalog tree", err);
      toast.error("Failed to load platform categories.");
    }
  };

  useEffect(() => {
    fetchCatalogTree();
  }, []);

  // Fetch Services from Backend API using query parameters
  const fetchServicesFromApi = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};

      if (debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim();
      }
      if (selectedParentFilter !== "ALL") {
        params.category_id = selectedParentFilter;
      }
      if (selectedSubFilter !== "ALL") {
        params.service_type_id = selectedSubFilter;
      }
      if (selectedStatusFilter === "Active") {
        params.is_active = true;
      } else if (selectedStatusFilter === "Inactive") {
        params.is_active = false;
      }

      const res = await catalogApi.listServices(params);
      if (signal?.aborted) return;

      const data = (res as any)?.data || res || [];
      const list: any[] = Array.isArray(data) ? data : [];

      const mapped: ServiceFlatRow[] = list.map((svc) => ({
        serviceId: svc.id,
        serviceName: svc.name,
        description: svc.description || `Service under ${svc.service_type?.name || "Subcategory"}`,
        subcategoryId: svc.service_type_id,
        subcategoryName: svc.service_type?.name || "N/A",
        parentCategoryId: svc.category_id,
        parentCategoryName: svc.category?.name || "N/A",
        isActive: svc.is_active !== false,
        rawServiceType: svc.service_type,
      }));

      setFilteredServices(mapped);
    } catch (err: any) {
      if (signal?.aborted) return;
      console.error("Failed to fetch services from backend API", err);
      toast.error("Failed to load services.");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [debouncedSearchTerm, selectedParentFilter, selectedSubFilter, selectedStatusFilter]);

  // Trigger backend refetch on filter or debounced search change
  useEffect(() => {
    const controller = new AbortController();
    fetchServicesFromApi(controller.signal);
    return () => controller.abort();
  }, [fetchServicesFromApi]);

  const refreshAll = () => {
    fetchCatalogTree();
    fetchServicesFromApi();
  };

  // Subcategories available for filter dropdown based on selected Parent Filter
  const availableSubcategories = useMemo(() => {
    if (selectedParentFilter === "ALL") {
      return categories.flatMap((c) => c.service_types || []);
    }
    const cat = categories.find((c) => String(c.id) === selectedParentFilter);
    return cat?.service_types || [];
  }, [categories, selectedParentFilter]);

  // Subcategories available inside the Add Services Modal based on selected Parent Category
  const modalSubcategories = useMemo(() => {
    const cat = categories.find((c) => String(c.id) === modalParentId);
    return cat?.service_types || [];
  }, [categories, modalParentId]);

  // Open Add Services Modal
  const handleOpenAddModal = () => {
    const firstParent = categories[0];
    const defaultParentId = firstParent ? String(firstParent.id) : "";
    const firstSub = firstParent?.service_types?.[0];
    const defaultSubId = firstSub ? String(firstSub.id) : "";

    setModalParentId(defaultParentId);
    setModalSubId(defaultSubId);
    setServiceChips([]);
    setIsAddOpen(true);
  };

  // Submit Add Services (Multi-Chips)
  const handleSaveGlobalServices = async () => {
    if (!modalParentId) {
      toast.error("Please select a Parent Category.");
      return;
    }
    if (!modalSubId) {
      toast.error("Please select a Subcategory.");
      return;
    }
    if (serviceChips.length === 0) {
      toast.error("Please add at least one service name.");
      return;
    }

    setSubmitting(true);
    try {
      const targetCatId = Number(modalParentId);
      const targetSubId = Number(modalSubId);

      for (const chip of serviceChips) {
        await catalogApi.createService({
          category_id: targetCatId,
          service_type_id: targetSubId,
          name: chip.trim(),
        });
      }
      toast.success(
        `✓ ${serviceChips.length} service${serviceChips.length > 1 ? "s" : ""} added successfully under subcategory.`
      );
      setIsAddOpen(false);
      refreshAll();
    } catch (err) {
      console.error("Failed to add services", err);
      toast.error("Failed to add services.");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Single Service Modal
  const handleOpenEditModal = (item: ServiceFlatRow) => {
    setEditingService(item);
    setEditName(item.serviceName);
    setEditDesc(item.description);
  };

  const handleSaveEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !editName.trim()) return;
    setSubmitting(true);
    try {
      await catalogApi.updateService(editingService.serviceId, {
        name: editName.trim(),
      });
      toast.success("Service updated successfully.");
      setEditingService(null);
      refreshAll();
    } catch (err) {
      console.error("Failed to update service", err);
      toast.error("Failed to update service.");
    } finally {
      setSubmitting(false);
    }
  };

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant?: "default" | "destructive";
    loading?: boolean;
    onConfirm: () => Promise<void> | void;
  }>({
    open: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    onConfirm: () => {},
  });

  const handleDeleteService = (id: number, serviceName?: string) => {
    setConfirmModal({
      open: true,
      title: "Remove Service",
      description: `Are you sure you want to remove ${serviceName ? `"${serviceName}"` : "this service"}?`,
      confirmText: "Remove Service",
      variant: "destructive",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await catalogApi.deleteService(id);
          toast.success("Service removed successfully.");
          refreshAll();
        } catch (err) {
          console.error("Failed to delete service", err);
          toast.error("Failed to remove service.");
        } finally {
          setConfirmModal((prev) => ({ ...prev, open: false, loading: false }));
        }
      },
    });
  };

  const handleToggleStatus = async (item: ServiceFlatRow) => {
    try {
      await catalogApi.updateService(item.serviceId, {
        is_active: !item.isActive,
      } as any);
      toast.success(
        item.isActive ? "Service deactivated." : "Service activated."
      );
      refreshAll();
    } catch {
      try {
        await catalogApi.updateServiceType(item.serviceId, {
          is_active: !item.isActive,
        });
        toast.success(
          item.isActive ? "Service deactivated." : "Service activated."
        );
        refreshAll();
      } catch (err2) {
        console.error("Failed to toggle service status", err2);
        toast.error("Failed to update status.");
      }
    }
  };

  return {
    categories,
    loading,
    searchTerm,
    setSearchTerm,
    selectedParentFilter,
    setSelectedParentFilter,
    selectedSubFilter,
    setSelectedSubFilter,
    selectedStatusFilter,
    setSelectedStatusFilter,
    isAddOpen,
    setIsAddOpen,
    modalParentId,
    setModalParentId,
    modalSubId,
    setModalSubId,
    serviceChips,
    setServiceChips,
    submitting,
    editingService,
    setEditingService,
    editName,
    setEditName,
    editDesc,
    setEditDesc,
    availableSubcategories,
    modalSubcategories,
    filteredServices,
    confirmModal,
    setConfirmModal,
    handleOpenAddModal,
    handleSaveGlobalServices,
    handleOpenEditModal,
    handleSaveEditService,
    handleDeleteService,
    handleToggleStatus,
  };
}
