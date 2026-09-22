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
  Lock,
  AlertCircle,
  Sparkles,
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
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useAdminCategories } from "@/hooks/useAdminCategories";

export const AdminCategoriesPage: React.FC = () => {
  const {
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
        title="Subcategories"
        subtitle="Manage service subcategories under your platform categories."
        action={
          activeCategory ? (
            <Button onClick={handleOpenAddSubModal} className="gap-2 font-semibold">
              <Plus size={16} /> Add Subcategory to {activeCategory.name}
            </Button>
          ) : undefined
        }
      />

      {/* Fixed Parent Category Tabs (Home Services, Professional Services, Personal Services) */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            Fixed Master Categories <Lock size={12} className="text-muted-foreground" />
          </Label>
        </div>
        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          {categories.map((cat) => {
            const active = String(selectedParentId) === String(cat.id);
            const count = cat.service_types?.length || 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedParentId(cat.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
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
                  {count} subcategories
                </span>
              </button>
            );
          })}
        </div>
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
          title="No master categories loaded"
          description="Catalog categories could not be fetched."
        />
      ) : (activeCategory?.service_types || []).length === 0 ? (
        <EmptyState
          icon={Layers}
          title={`No subcategories under ${activeCategory.name}`}
          description={`Add subcategories (e.g. Plumbing, Electrical) under ${activeCategory.name}.`}
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
                      </div>
                    </TableCell>

                    <TableCell>
                      <StatusPill status={sub.is_active !== false ? "Active" : "Inactive"} />
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 text-xs font-semibold"
                          onClick={() => handleOpenAddServiceModal(sub)}
                        >
                          <Plus size={13} /> Add Services
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => handleOpenEditSubModal(sub)}
                              className="gap-2 cursor-pointer"
                            >
                              <Edit2 size={14} /> Edit Subcategory
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenAddServiceModal(sub)}
                              className="gap-2 cursor-pointer"
                            >
                              <Wrench size={14} /> Manage Services
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteSubcategory(sub)}
                              className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 size={14} /> Remove Subcategory
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
              {editingSub
                ? "Edit Subcategory"
                : `Add Subcategory to ${activeCategory?.name}`}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveSubcategory} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">Parent Master Category</Label>
              <Input
                value={activeCategory?.name || ""}
                disabled
                className="bg-muted/50 font-semibold text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subName">Subcategory Name *</Label>
              <Input
                id="subName"
                placeholder="e.g. Plumbing, Electrical, Home Cleaning"
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subDesc">Description (Optional)</Label>
              <Textarea
                id="subDesc"
                placeholder="Brief summary of services included under this subcategory..."
                value={subDesc}
                onChange={(e) => setSubDesc(e.target.value)}
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
              <Button type="submit" disabled={submittingSub} className="gap-2 font-semibold">
                {submittingSub && <Loader2 size={14} className="animate-spin" />}
                {editingSub ? "Update Subcategory" : "Save Subcategory"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Multi-Service Modal under selected Subcategory */}
      <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Wrench size={18} className="text-primary" />
              {editingServiceItem
                ? "Edit Service"
                : `Add Services under ${targetSubcategory?.name}`}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveService} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Parent Category &amp; Subcategory
              </Label>
              <Input
                value={`${activeCategory?.name || ""} → ${targetSubcategory?.name || ""}`}
                disabled
                className="bg-muted/50 font-semibold text-xs h-10"
              />
            </div>

            {/* Service Inputs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">
                  {editingServiceItem
                    ? "Service Name *"
                    : "Service Names * (Enter one per field or paste comma-separated)"}
                </Label>
                {!editingServiceItem && (
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    {newUniqueServicesToCreate.length} unique new service(s) to add
                  </span>
                )}
              </div>

              {editingServiceItem ? (
                <div className="p-1 -m-1">
                  <Input
                    placeholder="e.g. Tap Repair"
                    value={svcNames[0] || ""}
                    onChange={(e) => handleSvcNameChange(0, e.target.value)}
                    required
                    className="h-10 text-xs font-medium"
                  />
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto p-1 -m-1">
                  {svcNames.map((name, index) => {
                    const trimmed = name.trim();
                    const lower = trimmed.toLowerCase();
                    const isAlreadyInDb = Boolean(trimmed) && existingServiceNamesLower.includes(lower);
                    const isInputDuplicate =
                      Boolean(trimmed) &&
                      index > 0 &&
                      svcNames.slice(0, index).some((p) => p.trim().toLowerCase() === lower);

                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              placeholder={`Service #${index + 1} (e.g. Tap Repair, Pipe Fixing)`}
                              value={name}
                              onChange={(e) => handleSvcNameChange(index, e.target.value)}
                              className={`h-10 text-xs font-medium w-full transition-colors ${
                                isAlreadyInDb
                                  ? "border-destructive focus:ring-destructive/30 bg-destructive/5"
                                  : isInputDuplicate
                                  ? "border-amber-500 focus:ring-amber-500/30 bg-amber-500/5"
                                  : ""
                              }`}
                              autoFocus={index === svcNames.length - 1 && index > 0}
                            />
                          </div>

                          {svcNames.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveSvcInput(index)}
                              className="size-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
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
