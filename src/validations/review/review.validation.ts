import * as Yup from "yup";

export interface ReviewFormValues {
  rating: number;
  comment: string;
}

export const DEFAULT_REVIEW_VALUES: ReviewFormValues = {
  rating: 0,
  comment: "",
};

export const reviewValidationSchema = Yup.object().shape({
  rating: Yup.number()
    .min(1, "Please select at least 1 star")
    .max(5, "Rating cannot exceed 5 stars")
    .required("Please select a star rating"),

  comment: Yup.string()
    .trim()
    .min(10, "Please write at least 10 characters to describe your experience")
    .max(1000, "Review comment cannot exceed 1000 characters")
    .required("Please provide a review comment (min 10 characters)"),
});

export type ReviewValidationSchema = typeof reviewValidationSchema;
