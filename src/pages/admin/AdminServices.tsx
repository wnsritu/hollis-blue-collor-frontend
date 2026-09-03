import React, { useEffect, useMemo, useState } from "react";
import {
  MoreVertical,
  Plus,
  Trash2,
  Edit2,
  Layers,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, PageHeader, StatusPill } from "@/components/shared/primitives";
import { ServiceChipsInput } from "@/components/ui/service-chips-input";
import { catalogApi } from "@/api/modules/catalog.api";
import type { Category, ServiceType } from "@/types/api/catalog";
import toast from "react-hot-toast";

interface ServiceFlatRow {
  serviceId: number;
  serviceName: string;
  description: string;
  subcategoryId: number;
  subcategoryName: string;
  parentCategoryId: number;
  parentCategoryName: string;
  isActive: boolean;
  rawServiceType: ServiceType;
}

export const AdminServicesPage: React.FC = () => {
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
        list.push({
          serviceId: st.id,
          serviceName: st.name,
          description: st.description || `Service under ${st.name}`,
          subcategoryId: st.id,
          subcategoryName: st.name,
          parentCategoryId: cat.id,
          parentCategoryName: cat.name,
          isActive: st.is_active !== false,
          rawServiceType: st,
        });
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
      // Parent Filter
      if (
        selectedParentFilter !== "ALL" &&
        String(item.parentCategoryId) !== selectedParentFilter
      ) {
        return false;
      }
      // Subcategory Filter
      if (
        selectedSubFilter !== "ALL" &&
        String(item.subcategoryId) !== selectedSubFilter
      ) {
        return false;
      }
      // Status Filter
      if (selectedStatusFilter === "Active" && !item.isActive) return false;
      if (selectedStatusFilter === "Inactive" && item.isActive) return false;

      // Search Query
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
    if (serviceChips.length === 0) {
      toast.error("Please add at least one service name.");
      return;
    }

    setSubmitting(true);
    try {
      const targetCatId = Number(modalParentId);
      for (const chip of serviceChips) {
        await catalogApi.createServiceType({
          category_id: targetCatId,
          name: chip.trim(),
          description: `Service under ${modalParentId}`,
        });
      }
      toast.success(
        `✓ ${serviceChips.length} service${serviceChips.length > 1 ? "s" : ""} added successfully.`
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
      await catalogApi.updateServiceType(editingService.serviceId, {
        name: editName.trim(),
        description: editDesc.trim(),
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
      await catalogApi.deleteServiceType(id);
      toast.success("Service removed successfully.");
      fetchCatalogData();
    } catch (err) {
      console.error("Failed to delete service", err);
      toast.error("Failed to remove service.");
    }
  };

  const handleToggleStatus = async (item: ServiceFlatRow) => {
    try {
      await catalogApi.updateServiceType(item.serviceId, {
        is_active: !item.isActive,
      });
      toast.success(
        item.isActive ? "Service deactivated." : "Service activated."
      );
      fetchCatalogData();
    } catch (err) {
      console.error("Failed to toggle service status", err);
      toast.error("Failed to update status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Services"
        subtitle="Manage all services available across the platform."
        action={
          <Button onClick={handleOpenAddModal} className="gap-2 font-semibold">
            <Plus size={16} /> Add Services
          </Button>
        }
      />

      {/* Filters Bar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search Input */}
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search services..."
              className="pl-9 h-10 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Parent Category Filter Dropdown */}
          <Select
            value={selectedParentFilter}
            onValueChange={(val) => {
              setSelectedParentFilter(val);
              setSelectedSubFilter("ALL");
            }}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Subcategory Filter Dropdown */}
          <Select
            value={selectedSubFilter}
            onValueChange={setSelectedSubFilter}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All Subcategories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Subcategories</SelectItem>
              {availableSubcategories.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter Dropdown */}
          <Select
            value={selectedStatusFilter}
            onValueChange={setSelectedStatusFilter}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Services Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading services...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <EmptyState
          icon={searchTerm ? Search : Layers}
          title={searchTerm ? "No matching services found" : "No services found"}
          description={
            searchTerm
              ? "Try changing your search terms or filters."
              : "Add services to subcategories to make them available on the platform."
          }
          action={
            <Button onClick={handleOpenAddModal} className="gap-2">
              <Plus size={16} /> Add Services
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <TableHead>Service</TableHead>
                <TableHead>Subcategory</TableHead>
                <TableHead>Parent Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((item) => (
                <TableRow
                  key={item.serviceId}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        {item.serviceName}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-sm">
                        {item.description}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center rounded-lg bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground">
                      {item.subcategoryName}
                    </span>
                  </TableCell>

                  <TableCell className="text-sm font-medium text-muted-foreground">
                    {item.parentCategoryName}
                  </TableCell>

                  <TableCell>
                    <StatusPill status={item.isActive ? "Active" : "Inactive"} />
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    Aug 27, 2026
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => handleOpenEditModal(item)}
                          className="gap-2 cursor-pointer"
                        >
                          <Edit2 size={14} /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(item)}
                          className="gap-2 cursor-pointer"
                        >
                          {item.isActive ? (
                            <>
                              <XCircle size={14} className="text-amber-500" /> Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={14} className="text-emerald-500" /> Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteService(item.serviceId)}
                          className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                        >
                          <Trash2 size={14} /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Global Add Services Modal (Parent -> Subcategory -> Multi-Chips Input) */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add Services</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 1. Parent Category Dropdown */}
            <div className="space-y-1.5">
              <Label htmlFor="global-add-parent" className="font-semibold text-sm">
                Parent Category
              </Label>
              <Select
                value={modalParentId}
                onValueChange={(val) => {
                  setModalParentId(val);
                  const targetCat = categories.find((c) => String(c.id) === val);
                  const firstSub = targetCat?.service_types?.[0];
                  setModalSubId(firstSub ? String(firstSub.id) : "");
                }}
              >
                <SelectTrigger id="global-add-parent">
                  <SelectValue placeholder="Select Parent Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Subcategory Dropdown */}
            <div className="space-y-1.5">
              <Label htmlFor="global-add-sub" className="font-semibold text-sm">
                Subcategory
              </Label>
              <Select value={modalSubId} onValueChange={setModalSubId}>
                <SelectTrigger id="global-add-sub">
                  <SelectValue placeholder="Select Subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {modalSubcategories.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Multi-Chips Services Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-sm">Services</Label>
                <span className="text-xs font-semibold text-muted-foreground">
                  {serviceChips.length} service{serviceChips.length === 1 ? "" : "s"} added
                </span>
              </div>

              <ServiceChipsInput
                value={serviceChips}
                onChange={setServiceChips}
                placeholder="Type service name and press Enter or Comma..."
              />

              <p className="text-[11px] text-muted-foreground leading-normal">
                Press{" "}
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">
                  Enter
                </kbd>
                ,{" "}
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">
                  Comma (,)
                </kbd>
                , or paste comma-separated service names.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveGlobalServices}
              disabled={submitting}
              className="gap-2 font-semibold"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Add Services
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Single Service Modal */}
      <Dialog
        open={Boolean(editingService)}
        onOpenChange={(open) => !open && setEditingService(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit Service</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveEditService} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="editName">Service Name *</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editDesc">Description</Label>
              <Textarea
                id="editDesc"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingService(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Update Service
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServicesPage;
