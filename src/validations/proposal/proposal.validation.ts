import * as Yup from "yup";
import type {
  CustomQuoteFormValues,
  CustomQuoteValidationErrors,
} from "@/types/proposal.types";

export const customQuoteValidationSchema = Yup.object().shape({
  workDescription: Yup.string()
    .trim()
    .min(5, "Work description must be at least 5 characters")
    .max(2000, "Work description cannot exceed 2000 characters")
    .required("Work description is required"),

  labor: Yup.number()
    .typeError("Labor cost must be a valid number")
    .min(1, "Labor cost must be at least $1")
    .required("Labor cost is required"),

  materials: Yup.number()
    .typeError("Materials cost must be a valid number")
    .min(0, "Materials cost cannot be negative")
    .default(0),

  fees: Yup.number()
    .typeError("Additional fees must be a valid number")
    .min(0, "Additional fees cannot be negative")
    .default(0),

  discount: Yup.number()
    .typeError("Discount must be a valid number")
    .min(0, "Discount cannot be negative")
    .test(
      "discount-le-subtotal",
      "Discount cannot exceed subtotal",
      function (val) {
        const { labor, materials, fees, tax } = this.parent;
        const subtotal =
          (Number(labor) || 0) +
          (Number(materials) || 0) +
          (Number(fees) || 0) +
          (Number(tax) || 0);
        return (Number(val) || 0) <= subtotal;
      }
    )
    .default(0),

  tax: Yup.number()
    .typeError("Taxes must be a valid number")
    .min(0, "Taxes cannot be negative")
    .default(0),

  completion: Yup.string()
    .trim()
    .required("Estimated completion is required"),

  expires: Yup.string()
    .trim()
    .required("Quote expiry is required"),

  terms: Yup.string().trim().optional(),
});

export type CustomQuoteValidationSchema = typeof customQuoteValidationSchema;

export const validateCustomQuote = (
  form: CustomQuoteFormValues,
  totalAmount: number
): { isValid: boolean; errors: CustomQuoteValidationErrors } => {
  const errors: CustomQuoteValidationErrors = {};

  if (!form.workDescription || !form.workDescription.trim()) {
    errors.workDescription = "Work description is required.";
  }

  if (Number(form.labor) < 0) {
    errors.labor = "Labor cost cannot be negative.";
  }

  if (totalAmount <= 0) {
    errors.total = "Total quote amount must be greater than $0.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const calculateQuoteSplit = (
  total: number,
  commissionRate = 9
): { total: number; commission: number; payable: number } => {
  const safeTotal = Math.max(0, total);
  const commission = Math.round(((safeTotal * commissionRate) / 100) * 100) / 100;
  const payable = Math.max(0, safeTotal - commission);

  return {
    total: safeTotal,
    commission,
    payable,
  };
};

export const calculateQuoteTotal = (
  form: Partial<CustomQuoteFormValues>
): number => {
  const base =
    (Number(form.labor) || 0) +
    (Number(form.materials) || 0) +
    (Number(form.fees) || 0) +
    (Number(form.tax) || 0);
  const discount = Number(form.discount) || 0;
  return Math.max(0, base - discount);
};
