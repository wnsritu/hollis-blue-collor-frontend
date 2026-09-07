import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  FolderTree,
  Layers,
  Wrench,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategoryHierarchy } from "@/hooks/useCategoryHierarchy";
import type { Category, ServiceType } from "@/types/api/catalog";

export interface CategoryTreeProps {
  selectedCategoryId?: string | number;
  selectedServiceTypeId?: string | number;
  onSelectCategory?: (category: Category) => void;
  onSelectServiceType?: (serviceType: ServiceType, category: Category) => void;
  className?: string;
  collapsible?: boolean;
}

export const CategoryTree: React.FC<CategoryTreeProps> = ({
  selectedCategoryId,
  selectedServiceTypeId,
  onSelectCategory,
  onSelectServiceType,
  className,
  collapsible = true,
}) => {
  const navigate = useNavigate();
  const { categories, loading } = useCategoryHierarchy();

  // Expanded Main Category IDs
  const [expandedCatIds, setExpandedCatIds] = useState<Record<string, boolean>>({
    "1": true,
    "2": true,
    "3": true,
  });

  const toggleExpand = (id: number | string) => {
    if (!collapsible) return;
    setExpandedCatIds((prev) => ({
      ...prev,
      [String(id)]: !prev[String(id)],
    }));
  };

  if (loading) {
    return (
      <div className="space-y-3 p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse space-y-2">
            <div className="h-9 w-full rounded-xl bg-muted" />
            <div className="pl-4 space-y-1.5">
              <div className="h-7 w-3/4 rounded-lg bg-muted/60" />
              <div className="h-7 w-2/3 rounded-lg bg-muted/60" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
        No category tree available
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 text-sm", className)}>
      {categories.map((cat) => {
        const isCatSelected = String(selectedCategoryId) === String(cat.id);
        const isExpanded = Boolean(expandedCatIds[String(cat.id)]);
        const subcategories = cat.service_types || [];

        return (
          <div key={cat.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            {/* Main Category Row */}
            <div
              onClick={() => {
                toggleExpand(cat.id);
                if (onSelectCategory) onSelectCategory(cat);
              }}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 cursor-pointer font-bold transition-colors select-none",
                isCatSelected
                  ? "bg-primary-soft text-primary font-extrabold"
                  : "bg-muted/30 text-foreground hover:bg-muted/60"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FolderTree size={16} className="text-primary shrink-0" />
                <span className="truncate">{cat.name}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {subcategories.length}
                </span>
              </div>
              {collapsible && (
                <button type="button" className="text-muted-foreground hover:text-foreground">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              )}
            </div>

            {/* Subcategories (Service Types) List */}
            {isExpanded && subcategories.length > 0 && (
              <div className="p-2 space-y-1 bg-background/50 border-t border-border/60">
                {subcategories.map((st) => {
                  const isStSelected = String(selectedServiceTypeId) === String(st.id);
                  return (
                    <div
                      key={st.id}
                      onClick={() => {
                        if (onSelectServiceType) {
                          onSelectServiceType(st, cat);
                        } else {
                          navigate(`/search?category_id=${cat.id}&service_type_id=${st.id}`);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors select-none",
                        isStSelected
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Wrench size={13} className={cn("shrink-0", isStSelected ? "text-primary-foreground" : "text-primary")} />
                      <span className="truncate">{st.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CategoryTree;
