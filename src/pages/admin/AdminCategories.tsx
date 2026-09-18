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
import { catalogApi } from "@/services/catalog";
import type { Category, ServiceType } from "@/types/api/catalog";
import toast from "react-hot-toast";

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
  } = useAdminCategories();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Category Hierarchy"
        subtitle="Manage subcategories and services under fixed master categories."
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
                              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-foreground border border-border"
                            >
                              <Wrench size={10} className="text-primary" />
                              {svc.name}
                              <button
                                type="button"
                                onClick={() => handleDeleteService(svc.id)}
                                className="ml-1 text-muted-foreground hover:text-destructive"
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
                              onClick={() => handleDeleteSubcategory(sub.id)}
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
              {editingSub ? "Edit Subcategory" : `Add Subcategory under ${activeCategory?.name}`}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveSubcategory} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">Parent Category</Label>
              <Input value={activeCategory?.name || ""} disabled className="bg-muted/50 font-semibold" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subName">Subcategory Name *</Label>
              <Input
                id="subName"
                placeholder="e.g. Plumbing"
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subDesc">Description</Label>
              <Textarea
                id="subDesc"
                placeholder="Brief description of this subcategory..."
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

      {/* Add Service Modal under selected Subcategory */}
      <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingServiceItem
                ? "Edit Service"
                : `Add Service under ${targetSubcategory?.name}`}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveService} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">Parent Category &amp; Subcategory</Label>
              <Input
                value={`${activeCategory?.name} → ${targetSubcategory?.name}`}
                disabled
                className="bg-muted/50 font-semibold text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="svcName">Service Name *</Label>
              <Input
                id="svcName"
                placeholder="e.g. Tap Repair, Basin Installation, Pipe Repair"
                value={svcName}
                onChange={(e) => setSvcName(e.target.value)}
                required
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
              <Button type="submit" disabled={submittingSvc} className="gap-2 font-semibold">
                {submittingSvc && <Loader2 size={14} className="animate-spin" />}
                {editingServiceItem ? "Update Service" : "Save Service"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategoriesPage;
