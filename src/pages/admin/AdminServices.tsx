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
import { catalogApi } from "@/services/catalog";
import type { Category, ServiceType } from "@/types/api/catalog";
import type { ServiceFlatRow } from "@/types/admin.types";
import toast from "react-hot-toast";

import { useAdminServices } from "@/hooks/useAdminServices";

export const AdminServicesPage: React.FC = () => {
  const {
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
    handleOpenAddModal,
    handleSaveGlobalServices,
    handleOpenEditModal,
    handleSaveEditService,
    handleDeleteService,
    handleToggleStatus,
  } = useAdminServices();

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
