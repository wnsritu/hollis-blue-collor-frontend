import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { catalogApi } from "@/services/catalog";
import type { Category, ServiceType } from "@/types/api/catalog";

export function useAdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<number | string>("all");
  const [loading, setLoading] = useState(true);

  // Subcategory Modal State
  const [isAddSubOpen, setIsAddSubOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<ServiceType | null>(null);
  const [subName, setSubName] = useState("");
  const [subDesc, setSubDesc] = useState("");
  const [submittingSub, setSubmittingSub] = useState(false);

  // Service Modal State (Under a Subcategory)
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [targetSubcategory, setTargetSubcategory] = useState<ServiceType | null>(null);
  const [editingServiceItem, setEditingServiceItem] = useState<{ id: number; name: string } | null>(null);
  const [svcNames, setSvcNames] = useState<string[]>([""]);
  const [submittingSvc, setSubmittingSvc] = useState(false);

  // Fetch Category Tree
  const fetchCatalogData = async () => {
    setLoading(true);
    try {
      const res = await catalogApi.getTree();
      const data = (res as any)?.data || res || [];
      const list = Array.isArray(data) ? data : [];
      setCategories(list);
      if (list.length > 0 && (selectedParentId === "all" || !list.some((c) => String(c.id) === String(selectedParentId)))) {
        setSelectedParentId(list[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch catalog tree", err);
      toast.error("Failed to load category catalog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogData();
  }, []);

  // Active Parent Category
  const activeCategory =
    categories.find((c) => String(c.id) === String(selectedParentId)) || categories[0];

  // Subcategory Handlers
  const handleOpenAddSubModal = () => {
    setEditingSub(null);
    setSubName("");
    setSubDesc("");
    setIsAddSubOpen(true);
  };

  const handleOpenEditSubModal = (sub: ServiceType) => {
    setEditingSub(sub);
    setSubName(sub.name);
    setSubDesc(sub.description || "");
    setIsAddSubOpen(true);
  };

  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim() || !activeCategory) {
      toast.error("Subcategory name is required.");
      return;
    }
    setSubmittingSub(true);
    try {
      if (editingSub) {
        await catalogApi.updateServiceType(editingSub.id, {
          name: subName.trim(),
          description: subDesc.trim(),
        });
        toast.success("Subcategory updated successfully.");
      } else {
        await catalogApi.createServiceType({
          category_id: Number(activeCategory.id),
          name: subName.trim(),
          description: subDesc.trim(),
        });
        toast.success("Subcategory created successfully under " + activeCategory.name);
      }
      setIsAddSubOpen(false);
      fetchCatalogData();
    } catch (err) {
      console.error("Failed to save subcategory", err);
      toast.error("Failed to save subcategory.");
    } finally {
      setSubmittingSub(false);
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

  const handleDeleteSubcategory = (sub: ServiceType) => {
    setConfirmModal({
      open: true,
      title: "Remove Subcategory",
      description: `Are you sure you want to remove "${sub.name}" and all its listed services? This action cannot be undone.`,
      confirmText: "Remove Subcategory",
      variant: "destructive",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await catalogApi.deleteServiceType(sub.id);
          toast.success("Subcategory removed successfully.");
          fetchCatalogData();
        } catch (err) {
          console.error("Failed to delete subcategory", err);
          toast.error("Failed to remove subcategory.");
        } finally {
          setConfirmModal((prev) => ({ ...prev, open: false, loading: false }));
        }
      },
    });
  };

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
          toast.success("Service removed.");
          fetchCatalogData();
        } catch (err) {
          console.error("Failed to delete service", err);
          toast.error("Failed to remove service.");
        } finally {
          setConfirmModal((prev) => ({ ...prev, open: false, loading: false }));
        }
      },
    });
  };

  // Service Modal Handlers
  const handleOpenAddServiceModal = (sub: ServiceType) => {
    setTargetSubcategory(sub);
    setEditingServiceItem(null);
    setSvcNames([""]);
    setIsAddServiceOpen(true);
  };

  const handleOpenEditServiceModal = (sub: ServiceType, svc: { id: number; name: string }) => {
    setTargetSubcategory(sub);
    setEditingServiceItem(svc);
    setSvcNames([svc.name]);
    setIsAddServiceOpen(true);
  };

  const handleAddSvcInput = () => {
    setSvcNames((prev) => [...prev, ""]);
  };

  const handleRemoveSvcInput = (index: number) => {
    setSvcNames((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const handleSvcNameChange = (index: number, val: string) => {
    setSvcNames((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSubcategory) return;
    setSubmittingSvc(true);
    try {
      if (editingServiceItem) {
        const singleName = svcNames[0]?.trim();
        if (!singleName) return;
        await catalogApi.updateService(editingServiceItem.id, { name: singleName });
        toast.success("Service updated successfully.");
      } else {
        const validNames = svcNames.map((s) => s.trim()).filter(Boolean);
        if (validNames.length === 0) {
          toast.error("Please enter at least one service name.");
          return;
        }
        for (const name of validNames) {
          await catalogApi.createService({
            category_id: Number(activeCategory.id),
            service_type_id: Number(targetSubcategory.id),
            name,
          });
        }
        toast.success(`${validNames.length} service${validNames.length > 1 ? "s" : ""} added under "${targetSubcategory.name}".`);
      }
      setIsAddServiceOpen(false);
      fetchCatalogData();
    } catch (err) {
      console.error("Failed to save service", err);
      toast.error("Failed to save service.");
    } finally {
      setSubmittingSvc(false);
    }
  };

  return {
    categories,
    selectedParentId,
    setSelectedParentId,
    loading,
    isAddSubOpen,
    setIsAddSubOpen,
    editingSub,
    setEditingSub,
    subName,
    setSubName,
    subDesc,
    setSubDesc,
    submittingSub,
    isAddServiceOpen,
    setIsAddServiceOpen,
    targetSubcategory,
    setTargetSubcategory,
    editingServiceItem,
    setEditingServiceItem,
    svcNames,
    setSvcNames,
    submittingSvc,
    activeCategory,
    confirmModal,
    setConfirmModal,
    handleOpenAddSubModal,
    handleOpenEditSubModal,
    handleSaveSubcategory,
    handleDeleteSubcategory,
    handleOpenAddServiceModal,
    handleOpenEditServiceModal,
    handleAddSvcInput,
    handleRemoveSvcInput,
    handleSvcNameChange,
    handleSaveService,
    handleDeleteService,
  };
}
