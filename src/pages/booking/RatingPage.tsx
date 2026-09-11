import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addRatingApi } from "@/services/rating";
import toast from "react-hot-toast";
import {
  reviewValidationSchema,
  type ReviewFormValues,
} from "@/validations/review";

export const RatingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const formik = useFormik<ReviewFormValues>({
    initialValues: {
      rating: 0,
      comment: "",
    },
    validationSchema: reviewValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await addRatingApi({
          booking_id: Number(id),
          rating: values.rating,
          comment: values.comment.trim(),
        });

        if (res.data?.success || res.status === 201) {
          toast.success("Review submitted successfully");
          setSubmitted(true);
          navigate(`/order/${id}`);
        } else {
          toast.error(res.data?.message || "Failed to submit review");
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Something went wrong");
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (submitted) {
    return (
      <div className="container-grid flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("thankYou")}</h1>
        <p className="mt-2 text-muted-foreground">{t("reviewSubmitted")}</p>
        <Button className="mt-6" onClick={() => navigate("/orders")}>{t("backToOrders")}</Button>
      </div>
    );
  }

  return (
    <div className="container-grid py-8">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        {t("rateExperience")}
      </h1>
      <div className="mt-6 mx-auto max-w-lg rounded-xl border border-border bg-card p-6">
        <form onSubmit={formik.handleSubmit}>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => formik.setFieldValue("rating", star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                className="cursor-pointer transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  size={36}
                  className={`transition-colors ${
                    star <= (hover || formik.values.rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-border"
                  }`}
                />
              </button>
            ))}
          </div>

          <p className="mt-2 text-center text-sm text-muted-foreground font-medium">
            {formik.values.rating > 0
              ? `${formik.values.rating} ${t("outOfStars")}`
              : t("selectRating")}
          </p>
          {formik.touched.rating && formik.errors.rating && (
            <p className="text-center text-xs font-medium text-destructive mt-1">
              {formik.errors.rating}
            </p>
          )}

          <div className="mt-6 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                {t("comment")} <span className="text-destructive">*</span>
              </label>
              <span
                className={`text-xs ${
                  formik.values.comment.length > 950
                    ? "text-amber-500 font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                {formik.values.comment.length} / 1000
              </span>
            </div>
            <textarea
              name="comment"
              rows={4}
              value={formik.values.comment}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Share your experience (at least 10 characters)…"
              className={`w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                formik.touched.comment && formik.errors.comment
                  ? "border-destructive focus:ring-destructive"
                  : "border-input"
              }`}
            />
            {formik.touched.comment && formik.errors.comment && (
              <p className="text-xs font-medium text-destructive mt-1">
                {formik.errors.comment}
              </p>
            )}
            {formik.values.comment.length > 0 && formik.values.comment.length < 10 && (
              <p className="text-xs text-amber-500 font-medium mt-1">
                Please enter at least {10 - formik.values.comment.length} more character(s).
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="mt-6 w-full"
            disabled={formik.values.rating === 0 || formik.isSubmitting}
          >
            {formik.isSubmitting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" /> Submitting...
              </>
            ) : (
              t("submitReview")
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RatingPage;
