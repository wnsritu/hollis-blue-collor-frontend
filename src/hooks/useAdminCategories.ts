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
  const [svcName, setSvcName] = useState("");
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

  const handleDeleteSubcategory = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this subcategory and its services?")) return;
    try {
      await catalogApi.deleteServiceType(id);
      toast.success("Subcategory removed successfully.");
      fetchCatalogData();
    } catch (err) {
      console.error("Failed to delete subcategory", err);
      toast.error("Failed to remove subcategory.");
    }
  };

  // Service Handlers
  const handleOpenAddServiceModal = (sub: ServiceType) => {
    setTargetSubcategory(sub);
    setEditingServiceItem(null);
    setSvcName("");
    setIsAddServiceOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!svcName.trim() || !targetSubcategory || !activeCategory) {
      toast.error("Service name is required.");
      return;
    }
    setSubmittingSvc(true);
    try {
      if (editingServiceItem) {
        await catalogApi.updateService(editingServiceItem.id, {
          name: svcName.trim(),
        });
        toast.success("Service updated successfully.");
      } else {
        await catalogApi.createService({
          category_id: Number(activeCategory.id),
          service_type_id: Number(targetSubcategory.id),
          name: svcName.trim(),
        });
        toast.success(`Service added under ${targetSubcategory.name}.`);
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

  const handleDeleteService = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this service?")) return;
    try {
      await catalogApi.deleteService(id);
      toast.success("Service removed.");
      fetchCatalogData();
    } catch (err) {
      console.error("Failed to delete service", err);
      toast.error("Failed to remove service.");
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
    svcName,
    setSvcName,
    submittingSvc,
    activeCategory,
    handleOpenAddSubModal,
    handleOpenEditSubModal,
    handleSaveSubcategory,
    handleDeleteSubcategory,
    handleOpenAddServiceModal,
    handleSaveService,
    handleDeleteService,
  };
}
