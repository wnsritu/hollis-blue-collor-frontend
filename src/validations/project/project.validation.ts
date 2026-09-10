import * as Yup from "yup";

export const createProjectValidationSchema = Yup.object().shape({
  title: Yup.string()
    .trim()
    .min(3, "Project title must be at least 3 characters")
    .max(120, "Project title cannot exceed 120 characters")
    .required("Project title is required"),

  description: Yup.string()
    .trim()
    .min(10, "Please provide at least 10 characters describing the job")
    .max(2000, "Description cannot exceed 2000 characters")
    .required("Description is required"),

  address_line: Yup.string()
    .trim()
    .required("Street address is required"),

  city: Yup.string().trim().optional(),
  state: Yup.string().trim().optional(),
  zip_code: Yup.string().trim().optional(),

  budget_min: Yup.number()
    .nullable()
    .transform((value, originalValue) =>
      String(originalValue).trim() === "" ? null : value
    )
    .min(0, "Budget minimum cannot be negative"),

  budget_max: Yup.number()
    .nullable()
    .transform((value, originalValue) =>
      String(originalValue).trim() === "" ? null : value
    )
    .min(0, "Budget maximum cannot be negative")
    .test(
      "max-gte-min",
      "Maximum budget must be greater than or equal to minimum",
      function (value) {
        const { budget_min } = this.parent;
        if (value != null && budget_min != null && Number(value) < Number(budget_min)) {
          return false;
        }
        return true;
      }
    ),

  urgency: Yup.string()
    .oneOf(["flexible", "soon", "urgent"], "Invalid urgency selection")
    .required("Urgency is required"),

  preferred_date: Yup.string().optional(),
});

export type CreateProjectValidationSchema = typeof createProjectValidationSchema;
