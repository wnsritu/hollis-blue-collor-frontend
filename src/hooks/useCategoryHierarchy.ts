import { useEffect, useState } from "react";
import { catalogApi } from "@/api/modules/catalog.api";
import type { Category, ServiceType } from "@/types/api/catalog";

export interface CategoryHierarchyResult {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getCategoryById: (id: number | string) => Category | undefined;
  getServiceTypesForCategory: (categoryId: number | string) => ServiceType[];
}

export function useCategoryHierarchy(): CategoryHierarchyResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHierarchy = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await catalogApi.getTree();
      const data = (res as any)?.data || res || [];
      setCategories(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load catalog category hierarchy", err);
      setError(err?.message || "Failed to load category hierarchy");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const getCategoryById = (id: number | string) => {
    return categories.find((c) => String(c.id) === String(id));
  };

  const getServiceTypesForCategory = (categoryId: number | string) => {
    const cat = getCategoryById(categoryId);
    return cat?.service_types || [];
  };

  return {
    categories,
    loading,
    error,
    refetch: fetchHierarchy,
    getCategoryById,
    getServiceTypesForCategory,
  };
}

export default useCategoryHierarchy;
