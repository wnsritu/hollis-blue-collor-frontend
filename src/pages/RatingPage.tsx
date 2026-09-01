import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addRatingApi } from "@/api/rating.api";
import toast from "react-hot-toast";

const RatingPage = () => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
   const { id } = useParams();

 const handleSubmit = async () => {
   try {
     if (!rating) {
       toast.error("Please select rating");
       return;
     }

     setLoading(true);

     const res = await addRatingApi({
       booking_id: Number(id),
       rating,
       comment,
     });

     if (res.data.success || res.status === 201) {
       toast.success("Review submitted successfully");
       setSubmitted(true);
       navigate(`/order/${id}`);
     } else {
       toast.error(res.data.message || "Failed to submit review");
     }
   } catch (err: any) {
     toast.error(err?.response?.data?.message || "Something went wrong");
   } finally {
     setLoading(false);
   }
 };

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
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
            >
              <Star
                size={36}
                className={`transition-colors ${star <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-border"}`}
              />
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {rating > 0 ? `${rating} ${t("outOfStars")}` : t("selectRating")}
        </p>
        <div className="mt-6">
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t("comment")}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Share your experience…"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Button
          className="mt-4 w-full"
          onClick={handleSubmit}
          disabled={rating === 0 || loading}
        >
          {loading ? "Submitting..." : t("submitReview")}
        </Button>
      </div>
    </div>
  );
};

export default RatingPage;
