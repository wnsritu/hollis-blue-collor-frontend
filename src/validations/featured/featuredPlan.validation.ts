import * as Yup from "yup";

export const featuredPlanSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .required("Plan name is required")
    .min(3, "Plan name must be at least 3 characters"),
  price: Yup.number()
    .typeError("Price must be a number")
    .required("Price is required")
    .min(0, "Price cannot be negative"),
  duration_days: Yup.number()
    .typeError("Duration must be a number")
    .required("Duration is required")
    .min(1, "Duration must be at least 1 day"),
  benefits: Yup.array()
    .of(Yup.string().trim())
    .min(1, "Please select or add at least one benefit"),
});

export const validateFeaturedPlanForm = (values: {
  name: string;
  price: string | number;
  duration_days: string | number;
  benefits: string[];
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!values.name || !values.name.trim()) {
    errors.name = "Plan name is required";
  }

  const numPrice = Number(values.price);
  if (isNaN(numPrice) || numPrice < 0) {
    errors.price = "Valid price is required";
  }

  const numDays = Number(values.duration_days);
  if (isNaN(numDays) || numDays < 1) {
    errors.duration_days = "Duration must be at least 1 day";
  }

  if (!values.benefits || values.benefits.length === 0) {
    errors.benefits = "Please select or enter at least one benefit";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export default featuredPlanSchema;
