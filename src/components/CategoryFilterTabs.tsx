import React from "react";
import { ALL_SERVICE_CATEGORIES } from "@/utils/format";

interface CategoryFilterTabsProps {
  activeCategory: string;
  onChange: (category: string) => void;
}

export const CategoryFilterTabs: React.FC<CategoryFilterTabsProps> = ({
  activeCategory,
  onChange,
}) => {
  return (
    <div className="flex gap-2 flex-wrap">
      {ALL_SERVICE_CATEGORIES.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            activeCategory === c
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilterTabs;
