import React from "react";
import {
  FolderTree,
  MoreVertical,
  Plus,
  Trash2,
  Edit2,
  Power,
  Layers,
  Wrench,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Switch } from "@/components/ui/switch";
import { EmptyState, PageHeader, StatusPill } from "@/components/shared/primitives";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useAdminCategories } from "@/hooks/useAdminCategories";

export const AdminCategoriesPage: React.FC = () => {
  const {
    categories,
    selectedParentId,
    setSelectedParentId,
    loading,
    isAddCategoryOpen,
    setIsAddCategoryOpen,
    editingCategory,
    categoryName,
    setCategoryName,
    categoryIsActive,
    setCategoryIsActive,
    submittingCategory,
    handleOpenAddCategoryModal,
    handleOpenEditCategoryModal,
    handleSaveCategory,
    handleToggleCategoryStatus,
    handleDeleteCategory,
    isAddSubOpen,
    setIsAddSubOpen,
    editingSub,
    setEditingSub,
    subName,
    setSubName,
    subDesc,
    setSubDesc,
    subIsActive,
    setSubIsActive,
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
    handleToggleSubcategoryStatus,
    handleDeleteSubcategory,
    handleOpenAddServiceModal,
    handleOpenEditServiceModal,
    handleAddSvcInput,
    handleRemoveSvcInput,
    handleSvcNameChange,
    handleSaveService,
    handleDeleteService,
    customSpecialties = [],
    handlePromoteSpecialty,
  } = useAdminCategories();

  // Existing service names under target subcategory (lowercased)
  const existingServiceNamesLower = (targetSubcategory?.services || []).map((s) =>
    s.name.trim().toLowerCase()
  );

  // Real-time deduplicated & non-empty service names from modal input fields
  const uniqueInputNames: string[] = [];
  const seenInputLower = new Set<string>();

  svcNames.forEach((raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (!seenInputLower.has(lower)) {
      seenInputLower.add(lower);
      uniqueInputNames.push(trimmed);
    }
  });

  // Services to be created (unique inputs that DO NOT already exist in DB)
  const newUniqueServicesToCreate = uniqueInputNames.filter(
    (name) => !existingServiceNamesLower.includes(name.toLowerCase())
  );

  // Quick action: Remove duplicate fields and existing database services from inputs
  const handleRemoveDuplicates = () => {
    const seen = new Set<string>();
    const cleaned: string[] = [];
    svcNames.forEach((name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const lower = trimmed.toLowerCase();
      if (!seen.has(lower) && !existingServiceNamesLower.includes(lower)) {
        seen.add(lower);
        cleaned.push(trimmed);
      }
    });
    setSvcNames(cleaned.length > 0 ? cleaned : [""]);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Category & Subcategory Directory"
        subtitle="Manage master categories, subcategories, and individual service trades across the Hollis platform."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleOpenAddCategoryModal}
              variant="outline"
              className="gap-2 font-semibold shadow-xs"
            >
              <Plus size={16} /> Add Master Category
            </Button>
            {activeCategory && !activeCategory.name?.toLowerCase().includes("not listed") ? (
              <Button onClick={handleOpenAddSubModal} className="gap-2 font-semibold shadow-xs">
                <Plus size={16} /> Add Subcategory to {activeCategory.name}
              </Button>
            ) : null}
          </div>
        }
      />

      {/* Dynamic Master Categories Directory */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={14} className="text-primary" /> Master Categories Directory ({categories.length})
          </Label>
          <span className="text-xs text-muted-foreground">
            Select a category to view and manage its subcategories
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5 border-b border-border pb-4">
          {categories.map((cat) => {
            const active = String(selectedParentId) === String(cat.id);
            const count = cat.service_types?.length || 0;
            const isCatActive = cat.is_active !== undefined ? Boolean(cat.is_active) : true;

            return (
              <div
                key={cat.id}
                className={`group flex items-center rounded-xl border transition-all ${active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : isCatActive
                      ? "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/50"
                      : "border-border/60 bg-muted/40 text-muted-foreground"
                  }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedParentId(cat.id)}
                  className="flex items-center gap-2 px-3.5 py-2 text-sm font-bold text-left"
                >
                  <span className="truncate max-w-[200px]">{cat.name}</span>
                  {!isCatActive && (
                    <span className="rounded-full bg-destructive/10 px-1.5 py-0.2 text-[10px] font-semibold text-destructive">
                      Inactive
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${active
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                      }`}
                  >
                    {count}
                  </span>
                </button>

                {/* Category Action Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={`mr-1 grid size-7 place-items-center rounded-lg transition-colors ${active
                          ? "text-primary-foreground/80 hover:bg-primary-foreground/20 hover:text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      title={`Manage category ${cat.name}`}
                    >
                      <MoreVertical size={14} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                      onClick={() => handleOpenEditCategoryModal(cat)}
                      className="cursor-pointer gap-2 text-xs"
                    >
                      <Edit2 size={13} /> Edit Category
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleToggleCategoryStatus(cat)}
                      className="cursor-pointer gap-2 text-xs"
                    >
                      <Power size={13} /> {isCatActive ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDeleteCategory(cat)}
                      className="cursor-pointer gap-2 text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      <Trash2 size={13} /> Delete Category
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      </div>

      {/* Provider-Submitted Custom Specialties Alert / Section */}
      {(customSpecialties || []).length > 0 && (
        <div className="rounded-2xl border border-accent/30 bg-accent-soft/20 p-5 shadow-xs">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles size={16} className="text-accent shrink-0" />
                Provider-Submitted Custom Specialties &amp; Requests ({(customSpecialties || []).length})
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Specialties requested by providers during onboarding or profile setup. You can promote them directly into official subcategories.
              </p>
            </div>
          </div>

          <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {(customSpecialties || []).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-2xs"
              >
                <div className="min-w-0">
                  <p className="font-bold text-xs text-foreground truncate">{item.specialty}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Requested by: <span className="font-medium text-foreground">{item.providerName}</span>
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePromoteSpecialty(item.specialty)}
                  className="shrink-0 h-7 text-[11px] gap-1 font-semibold text-accent hover:text-accent-foreground hover:bg-accent"
                >
                  <Plus size={12} /> Add to Directory
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Subcategories Data Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading subcategories...</p>
        </div>
      ) : !activeCategory ? (
        <EmptyState
          icon={Layers}
          title="No master categories loaded"
          description="Catalog categories could not be fetched."
          action={
            <Button onClick={handleOpenAddCategoryModal} className="gap-1.5">
              <Plus size={14} /> Add First Category
            </Button>
          }
        />
      ) : activeCategory.name.toLowerCase().includes("not listed") ? (
        <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <Sparkles size={18} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">
                      Provider Custom Specialty Gateway
                    </h3>
                    <StatusPill status={activeCategory.is_active !== false ? "active" : "inactive"} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Master category reserved for provider-defined custom trades &amp; specialty services.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 space-y-2 mt-3">
                <p className="text-xs font-semibold text-foreground">
                  How this category operates:
                </p>
                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1.5 leading-relaxed">
                  <li>
                    <strong>For Providers:</strong> This category allows businesses to type and price their own custom services that are not currently in the platform directory.
                  </li>
                  <li>
                    <strong>Platform Activation:</strong> If you <em>Deactivate</em> this category, new providers will not see this option during onboarding. Existing providers who already set up custom specialties can continue managing them, but if they remove them from their profile, they cannot re-add them.
                  </li>
                  <li>
                    <strong>Global Catalog Services:</strong> Global directory services should be added to regular categories (e.g., <em>Other Skilled Trades</em>, <em>Home Services</em>, etc.), not inside &quot;Not Listed&quot;.
                  </li>
                </ul>
              </div>
            </div>

            <div className="shrink-0 pt-1">
              <Button
                variant={activeCategory.is_active !== false ? "destructive" : "default"}
                onClick={() => handleToggleCategoryStatus(activeCategory)}
                className="gap-2 font-semibold shadow-xs"
              >
                <Power size={15} />
                {activeCategory.is_active !== false
                  ? "Deactivate Custom Gateway"
                  : "Activate Custom Gateway"}
              </Button>
            </div>
          </div>
        </div>
      ) : (activeCategory?.service_types || []).length === 0 ? (
        <EmptyState
          icon={Layers}
          title={`No subcategories under "${activeCategory.name}"`}
          description={`Add subcategories (e.g. Tile Cleaning, Carpet Cleaning, Woodworking) under ${activeCategory.name}.`}
          action={
            <Button onClick={handleOpenAddSubModal} className="gap-1.5 font-semibold">
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
                <TableHead>Services Listed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(activeCategory?.service_types || []).map((sub) => {
                const servicesList = sub.services || [];
                return (
                  <TableRow key={sub.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold text-foreground">
                      <div>
                        <p className="font-bold text-sm text-foreground">{sub.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                          {sub.description || `Subcategory under ${activeCategory.name}`}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground font-semibold">
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
                        {activeCategory.name}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                        {servicesList.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">No services added yet</span>
                        ) : (
                          servicesList.map((svc) => (
                            <span
                              key={svc.id}
                              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-foreground border border-border transition-colors hover:border-primary/40"
                            >
                              <Wrench size={10} className="text-primary" />
                              <button
                                type="button"
                                onClick={() => handleOpenEditServiceModal(sub, svc)}
                                className="hover:text-primary hover:underline cursor-pointer"
                                title="Click to edit service name"
                              >
                                {svc.name}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteService(svc.id, svc.name)}
                                className="ml-1 text-muted-foreground hover:text-destructive font-bold"
                                title="Remove service"
                              >
                                ×
                              </button>
                            </span>
                          ))
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenAddServiceModal(sub)}
                          className="h-6 gap-1 rounded-full px-2 text-xs text-primary hover:bg-primary/10"
                        >
                          <Plus size={11} /> Add Service
                        </Button>
                      </div>
                    </TableCell>

                    <TableCell>
                      <StatusPill status={sub.is_active ? "active" : "inactive"} />
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleOpenAddServiceModal(sub)}
                            className="cursor-pointer gap-2 text-xs"
                          >
                            <Plus size={14} /> Add Services
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenEditSubModal(sub)}
                            className="cursor-pointer gap-2 text-xs"
                          >
                            <Edit2 size={14} /> Edit Subcategory
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleSubcategoryStatus(sub)}
                            className="cursor-pointer gap-2 text-xs"
                          >
                            <Power size={14} /> {sub.is_active ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteSubcategory(sub)}
                            className="cursor-pointer gap-2 text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
                          >
                            <Trash2 size={14} /> Remove Subcategory
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Category Modal (Add / Edit Master Category) ── */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Master Category" : "Add Master Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update category name and active status."
                : "Create a new top-level master category for your directory."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="category-name">
                Category Name <span className="text-destructive font-bold">*</span>
              </Label>
              <Input
                id="category-name"
                placeholder="e.g. Cleaning Services, Specialized Trades..."
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <Label htmlFor="category-active" className="text-xs font-bold text-foreground">
                  Active Status
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Active categories appear on provider onboarding and customer search.
                </p>
              </div>
              <Switch
                id="category-active"
                checked={categoryIsActive}
                onCheckedChange={setCategoryIsActive}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddCategoryOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingCategory}
                className="gap-2 font-semibold rounded-xl"
              >
                {submittingCategory && <Loader2 size={14} className="animate-spin" />}
                {editingCategory ? "Update Category" : "Create Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Subcategory Modal (Add / Edit) ── */}
      <Dialog open={isAddSubOpen} onOpenChange={setIsAddSubOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSub
                ? "Edit Subcategory"
                : `Add Subcategory under ${activeCategory?.name || "Category"}`}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveSubcategory} className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="sub-name">Subcategory Name</Label>
              <Input
                id="sub-name"
                placeholder="e.g. Tile Cleaning, HVAC Repair..."
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sub-desc">Description (Optional)</Label>
              <Textarea
                id="sub-desc"
                placeholder="Brief description of this trade / service area..."
                value={subDesc}
                onChange={(e) => setSubDesc(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <Label htmlFor="sub-active" className="text-xs font-bold text-foreground">
                  Active Status
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Providers can select active subcategories during registration.
                </p>
              </div>
              <Switch
                id="sub-active"
                checked={subIsActive}
                onCheckedChange={setSubIsActive}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddSubOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingSub}
                className="gap-2 font-semibold rounded-xl"
              >
                {submittingSub && <Loader2 size={14} className="animate-spin" />}
                {editingSub ? "Update Subcategory" : "Create Subcategory"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Service Modal (Add multiple / Edit service) ── */}
      <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingServiceItem
                ? `Edit Service under ${targetSubcategory?.name}`
                : `Add Services to ${targetSubcategory?.name}`}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveService} className="space-y-4 pt-2">
            <div className="space-y-3">
              {editingServiceItem ? (
                <div className="grid gap-2">
                  <Label htmlFor="single-svc">Service Name</Label>
                  <Input
                    id="single-svc"
                    value={svcNames[0] || ""}
                    onChange={(e) => handleSvcNameChange(0, e.target.value)}
                    placeholder="e.g. Deep Carpet Cleaning"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground">
                      Service Item Names ({svcNames.length} Field{svcNames.length > 1 ? "s" : ""})
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      Duplicates are flagged in real-time
                    </span>
                  </div>

                  {svcNames.map((name, idx) => {
                    const trimmed = name.trim();
                    const isAlreadyInDb =
                      trimmed.length > 0 &&
                      existingServiceNamesLower.includes(trimmed.toLowerCase());
                    const isInputDuplicate =
                      trimmed.length > 0 &&
                      svcNames.filter(
                        (n, i) => i !== idx && n.trim().toLowerCase() === trimmed.toLowerCase()
                      ).length > 0;

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder={`Service #${idx + 1} (e.g. Tile Cleaning)`}
                            value={name}
                            onChange={(e) => handleSvcNameChange(idx, e.target.value)}
                            className={
                              isAlreadyInDb || isInputDuplicate
                                ? "border-destructive focus-visible:ring-destructive"
                                : ""
                            }
                          />
                          {svcNames.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveSvcInput(idx)}
                              className="text-muted-foreground hover:text-destructive shrink-0"
                              title="Remove item"
                            >
                              <Trash2 size={15} />
                            </Button>
                          )}
                        </div>

                        {/* Real-time Inline Warnings */}
                        {isAlreadyInDb && (
                          <p className="text-[11px] font-medium text-destructive flex items-center gap-1 pl-1">
                            <AlertCircle size={12} /> Service "{trimmed}" already exists under {targetSubcategory?.name}
                          </p>
                        )}
                        {isInputDuplicate && !isAlreadyInDb && (
                          <p className="text-[11px] font-medium text-amber-600 flex items-center gap-1 pl-1">
                            <AlertCircle size={12} /> Duplicate entry in list
                          </p>
                        )}
                      </div>
                    );
                  })}

                  <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddSvcInput}
                        className="gap-1.5 text-xs font-semibold rounded-xl text-primary border-primary/30 hover:bg-primary/5"
                      >
                        <Plus size={14} /> Add Another Service
                      </Button>
                      {svcNames.length > newUniqueServicesToCreate.length && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleRemoveDuplicates}
                          className="gap-1.5 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200"
                        >
                          <Sparkles size={13} className="text-amber-500" /> Clean Duplicates
                        </Button>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground italic">
                      Tip: You can paste comma-separated names
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Live Tag Summary Preview for unique new services */}
            {!editingServiceItem && newUniqueServicesToCreate.length > 0 && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1.5">
                <p className="text-[11px] font-bold text-primary uppercase tracking-wider">
                  Unique Services to be created ({newUniqueServicesToCreate.length}):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {newUniqueServicesToCreate.map((s, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-primary border border-primary/30 shadow-xs"
                    >
                      <Wrench size={10} />
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddServiceOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingSvc || (!editingServiceItem && newUniqueServicesToCreate.length === 0)}
                className="gap-2 font-semibold rounded-xl"
              >
                {submittingSvc && <Loader2 size={14} className="animate-spin" />}
                {editingServiceItem
                  ? "Update Service"
                  : newUniqueServicesToCreate.length > 1
                    ? `Create ${newUniqueServicesToCreate.length} Unique Services`
                    : newUniqueServicesToCreate.length === 1
                      ? `Create Service "${newUniqueServicesToCreate[0]}"`
                      : "No New Services"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Shared Custom UI Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmModal.open}
        onOpenChange={(open) => setConfirmModal((prev) => ({ ...prev, open }))}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        loading={confirmModal.loading}
        onConfirm={confirmModal.onConfirm}
      />
    </div>
  );
};

export default AdminCategoriesPage;
