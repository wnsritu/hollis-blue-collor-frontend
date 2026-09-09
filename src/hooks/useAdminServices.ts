import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { catalogApi } from "@/services/catalog";
import type { Category } from "@/types/api/catalog";
import type { ServiceFlatRow } from "@/types/admin.types";

export function useAdminServices() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
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

  // Fetch Tree
  const fetchCatalogData = async () => {
    setLoading(true);
    try {
      const res = await catalogApi.getTree();
      const data = (res as any)?.data || res || [];
      const list = Array.isArray(data) ? data : [];
      setCategories(list);
    } catch (err) {
      console.error("Failed to load catalog tree", err);
      toast.error("Failed to load platform services.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogData();
  }, []);

  // Flatten catalog into Service list for the table
  const allServices = useMemo(() => {
    const list: ServiceFlatRow[] = [];
    categories.forEach((cat) => {
      (cat.service_types || []).forEach((st) => {
        const subServices = st.services || [];
        if (subServices.length > 0) {
          subServices.forEach((svc) => {
            list.push({
              serviceId: svc.id,
              serviceName: svc.name,
              description: `Service under ${st.name}`,
              subcategoryId: st.id,
              subcategoryName: st.name,
              parentCategoryId: cat.id,
              parentCategoryName: cat.name,
              isActive: svc.is_active !== false,
              rawServiceType: st,
            });
          });
        } else {
          list.push({
            serviceId: st.id,
            serviceName: st.name,
            description: st.description || `Service under ${cat.name}`,
            subcategoryId: st.id,
            subcategoryName: st.name,
            parentCategoryId: cat.id,
            parentCategoryName: cat.name,
            isActive: st.is_active !== false,
            rawServiceType: st,
          });
        }
      });
    });
    return list;
  }, [categories]);

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

  // Filtered Services List
  const filteredServices = useMemo(() => {
    return allServices.filter((item) => {
      if (
        selectedParentFilter !== "ALL" &&
        String(item.parentCategoryId) !== selectedParentFilter
      ) {
        return false;
      }
      if (
        selectedSubFilter !== "ALL" &&
        String(item.subcategoryId) !== selectedSubFilter
      ) {
        return false;
      }
      if (selectedStatusFilter === "Active" && !item.isActive) return false;
      if (selectedStatusFilter === "Inactive" && item.isActive) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = item.serviceName.toLowerCase().includes(query);
        const matchDesc = item.description.toLowerCase().includes(query);
        const matchSub = item.subcategoryName.toLowerCase().includes(query);
        const matchParent = item.parentCategoryName.toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchSub && !matchParent) return false;
      }

      return true;
    });
  }, [allServices, selectedParentFilter, selectedSubFilter, selectedStatusFilter, searchTerm]);

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
      fetchCatalogData();
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
      fetchCatalogData();
    } catch (err) {
      console.error("Failed to update service", err);
      toast.error("Failed to update service.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this service?")) return;
    try {
      await catalogApi.deleteService(id);
      toast.success("Service removed successfully.");
      fetchCatalogData();
    } catch (err) {
      console.error("Failed to delete service", err);
      toast.error("Failed to remove service.");
    }
  };

  const handleToggleStatus = async (item: ServiceFlatRow) => {
    try {
      await catalogApi.updateService(item.serviceId, {
        is_active: !item.isActive,
      } as any);
      toast.success(
        item.isActive ? "Service deactivated." : "Service activated."
      );
      fetchCatalogData();
    } catch {
      try {
        await catalogApi.updateServiceType(item.serviceId, {
          is_active: !item.isActive,
        });
        toast.success(
          item.isActive ? "Service deactivated." : "Service activated."
        );
        fetchCatalogData();
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
    allServices,
    availableSubcategories,
    modalSubcategories,
    filteredServices,
    handleOpenAddModal,
    handleSaveGlobalServices,
    handleOpenEditModal,
    handleSaveEditService,
    handleDeleteService,
    handleToggleStatus,
  };
}
