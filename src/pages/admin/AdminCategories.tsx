import React, { useEffect, useState } from "react";
import {
  FolderTree,
  MoreVertical,
  Plus,
  Trash2,
  Edit2,
  Layers,
  Wrench,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, PageHeader, StatusPill } from "@/components/shared/primitives";
import { catalogApi } from "@/api/modules/catalog.api";
import type { Category, ServiceType } from "@/types/api/catalog";
import toast from "react-hot-toast";

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<number | string>("all");
  const [loading, setLoading] = useState(true);

  // Subcategory (Category) Modal State
  const [isAddSubOpen, setIsAddSubOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [submittingCat, setSubmittingCat] = useState(false);

  // Service Type Modal State
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [targetCatId, setTargetCatId] = useState<number | null>(null);
  const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null);
  const [stName, setStName] = useState("");
  const [stDesc, setStDesc] = useState("");
  const [submittingSt, setSubmittingSt] = useState(false);

  // Fetch Category Tree
  const fetchCatalogData = async () => {
    setLoading(true);
    try {
      const res = await catalogApi.getTree();
      const data = (res as any)?.data || res || [];
      const list = Array.isArray(data) ? data : [];
      setCategories(list);
      if (list.length > 0 && selectedParentId === "all") {
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

  // Active Category
  const activeCategory = categories.find(
    (c) => String(c.id) === String(selectedParentId)
  ) || categories[0];

  // Category Handlers
  const handleOpenAddSubModal = () => {
    setEditingCategory(null);
    setCatName("");
    setCatDesc("");
    setIsAddSubOpen(true);
  };

  const handleOpenEditSubModal = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDesc(cat.description || "");
    setIsAddSubOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      toast.error("Subcategory name is required.");
      return;
    }
    setSubmittingCat(true);
    try {
      if (editingCategory) {
        await catalogApi.updateCategory(editingCategory.id, {
          name: catName.trim(),
          description: catDesc.trim(),
        });
        toast.success("Subcategory updated successfully.");
      } else {
        await catalogApi.createCategory({
          name: catName.trim(),
          description: catDesc.trim(),
        });
        toast.success("Subcategory created successfully.");
      }
      setIsAddSubOpen(false);
      fetchCatalogData();
    } catch (err) {
      console.error("Failed to save subcategory", err);
      toast.error("Failed to save subcategory.");
    } finally {
      setSubmittingCat(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this subcategory?")) return;
    try {
      await catalogApi.deleteCategory(id);
      toast.success("Subcategory removed successfully.");
      fetchCatalogData();
    } catch (err) {
      console.error("Failed to delete subcategory", err);
      toast.error("Failed to remove subcategory.");
    }
  };

  // Service Type Handlers
  const handleOpenAddServiceModal = (catId: number) => {
    setTargetCatId(catId);
    setEditingServiceType(null);
    setStName("");
    setStDesc("");
    setIsAddServiceOpen(true);
  };

  const handleOpenEditServiceType = (st: ServiceType) => {
    setTargetCatId(st.category_id);
    setEditingServiceType(st);
    setStName(st.name);
    setStDesc(st.description || "");
    setIsAddServiceOpen(true);
  };

  const handleSaveServiceType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stName.trim() || !targetCatId) {
      toast.error("Service name is required.");
      return;
    }
    setSubmittingSt(true);
    try {
      if (editingServiceType) {
        await catalogApi.updateServiceType(editingServiceType.id, {
          name: stName.trim(),
          description: stDesc.trim(),
        });
        toast.success("Service updated successfully.");
      } else {
        await catalogApi.createServiceType({
          category_id: targetCatId,
          name: stName.trim(),
          description: stDesc.trim(),
        });
        toast.success("Service added successfully.");
      }
      setIsAddServiceOpen(false);
      fetchCatalogData();
    } catch (err) {
      console.error("Failed to save service", err);
      toast.error("Failed to save service.");
    } finally {
      setSubmittingSt(false);
    }
  };

  const handleDeleteServiceType = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this service?")) return;
    try {
      await catalogApi.deleteServiceType(id);
      toast.success("Service removed.");
      fetchCatalogData();
    } catch (err) {
      console.error("Failed to delete service", err);
      toast.error("Failed to remove service.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Subcategories"
        subtitle="Manage service subcategories under your platform categories."
        action={
          <Button onClick={handleOpenAddSubModal} className="gap-2">
            <Plus size={16} /> Add Subcategory
          </Button>
        }
      />

      {/* Parent Category Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-3">
        {categories.map((cat) => {
          const active = String(selectedParentId) === String(cat.id);
          const count = cat.service_types?.length || 0;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedParentId(cat.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground border border-border"
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  active
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Subcategories Data Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading subcategories...</p>
        </div>
      ) : !activeCategory ? (
        <EmptyState
          icon={Layers}
          title="No subcategories found"
          description="No subcategories have been added to this platform category yet."
          action={
            <Button onClick={handleOpenAddSubModal} className="gap-1.5">
              <Plus size={14} /> Add Subcategory
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <TableHead>Subcategory</TableHead>
                <TableHead>Parent Category</TableHead>
                <TableHead className="text-center">Services</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(activeCategory?.service_types || []).map((sub) => {
                const slug = sub.name.toLowerCase().replace(/\s+/g, "-");
                return (
                  <TableRow key={sub.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold text-foreground">
                      <div>
                        <p className="font-medium text-sm">{sub.name}</p>
                        <p className="text-xs text-muted-foreground">/{slug}</p>
                      </div>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground font-medium">
                      {activeCategory.name}
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-foreground">
                        <Wrench size={12} className="text-primary" />
                        4 services
                      </span>
                    </TableCell>

                    <TableCell>
                      <StatusPill status={sub.is_active !== false ? "Active" : "Inactive"} />
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      Aug 27, 2026
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 text-xs font-semibold"
                          onClick={() => handleOpenAddServiceModal(activeCategory.id)}
                        >
                          <Plus size={13} /> Add Service
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => handleOpenEditServiceType(sub)}
                              className="gap-2 cursor-pointer"
                            >
                              <Edit2 size={14} /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenAddServiceModal(activeCategory.id)}
                              className="gap-2 cursor-pointer"
                            >
                              <Wrench size={14} /> Manage Services
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteServiceType(sub.id)}
                              className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 size={14} /> Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add / Edit Subcategory Modal */}
      <Dialog open={isAddSubOpen} onOpenChange={setIsAddSubOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Subcategory" : "Add Subcategory"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="catName">Subcategory Name *</Label>
              <Input
                id="catName"
                placeholder="e.g. Plumbing"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="catDesc">Description</Label>
              <Textarea
                id="catDesc"
                placeholder="Brief description of this subcategory..."
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddSubOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submittingCat} className="gap-2">
                {submittingCat && <Loader2 size={14} className="animate-spin" />}
                {editingCategory ? "Update Subcategory" : "Save Subcategory"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Service Modal */}
      <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingServiceType ? "Edit Service" : "Add Service"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveServiceType} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="stName">Service Name *</Label>
              <Input
                id="stName"
                placeholder="e.g. Drain Cleaning"
                value={stName}
                onChange={(e) => setStName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stDesc">Description</Label>
              <Textarea
                id="stDesc"
                placeholder="Brief description of this service item..."
                value={stDesc}
                onChange={(e) => setStDesc(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddServiceOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submittingSt} className="gap-2">
                {submittingSt && <Loader2 size={14} className="animate-spin" />}
                {editingServiceType ? "Update Service" : "Save Service"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategoriesPage;
