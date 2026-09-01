import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { getOrderDetails } from "@/services/order.service";
import toast from "react-hot-toast";
import { createDisputeApi } from "@/api/dispute.api";
import { useNavigate } from "react-router-dom";


const ReportIssue = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [issueType, setIssueType] = useState("damaged_item");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res: any = await getOrderDetails(id);
        if (res?.data?.success) {
          setOrderData(res.data.data);
        }
      } catch (err) {
        toast.error("Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrder();
  }, [id]);

  // ✅ image handler
  // const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (!e.target.files) return;

  //   const files = Array.from(e.target.files) as File[];

  //   if (images.length + files.length > 5) {
  //     toast.error("Max 5 images allowed");
  //     return;
  //   }

  //   // Filter for allowed types just in case
  //   const allowedTypes = /jpeg|jpg|png|webp|heic|heif/i;
  //   const filteredFiles = files.filter((file) => {
  //     if (!allowedTypes.test(file.name)) {
  //       toast.error(`File "${file.name}" is not a supported image type`);
  //       return false;
  //     }
  //     return true;
  //   });

  //   setImages((prev) => [...prev, ...filteredFiles]);
  // };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files) as File[];

    if (images.length + files.length > 5) {
      toast.error("Max 5 images allowed");
      return;
    }

    // Filter for allowed types just in case
    const allowedTypes = /jpeg|jpg|png|webp|heic|heif/i;

    const filteredFiles = files.filter((file) => {
      // ✅ Check file type
      if (!allowedTypes.test(file.name)) {
        toast.error(`File is not a supported image type`);
        // toast.error(`File "${file.name}" is not a supported image type`);
        return false;
      }

      // ✅ Check file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        toast.error(`File exceeds 5MB limit`);
        // toast.error(`File "${file.name}" exceeds 5MB limit`);
        return false;
      }

      return true;
    });

    if (filteredFiles.length === 0) {
      return; // no valid files to add
    }

    setImages((prev) => [...prev, ...filteredFiles]);
  };

// const handleSubmit = async () => {
//   if (!description) {
//     toast.error("Please describe the issue");
//     return;
//   }

//   const formData = new FormData();
//   formData.append("booking_id", orderData.id);
//   formData.append("issue_type", issueType);
//   formData.append("description", description);

//   images.forEach((file) => {
//     formData.append("evidence", file);
//   });

//   try {
//     await toast.promise(createDisputeApi(formData), {
//       loading: "Submitting dispute...",
//       success: (res: any) => {
//         if (res?.data?.success) {
//           // reset form
//           setDescription("");
//           setImages([]);
//           setIssueType("damaged_item");
//           return "Dispute submitted successfully";
//         } else {
//           throw new Error(res?.data?.message || "Failed");
//         }
//       },
//       error: (err: any) =>
//         err?.response?.data?.message || "Something went wrong",
//     });
//   } catch (error) {
//     console.error(error);
//   }
// };

  const handleSubmit = async () => {
    if (!description) {
      toast.error("Please describe the issue");
      return;
    }

    const formData = new FormData();
    formData.append("booking_id", orderData.id);
    formData.append("issue_type", issueType);
    formData.append("description", description);

    images.forEach((file) => {
      formData.append("evidence", file);
    });

    // setLoading(true); // optional, if you have a loading state
    try {
      const res = await createDisputeApi(formData);
      if (res?.data?.success) {
        toast.success("Dispute submitted successfully");
        // Reset form
        setDescription("");
        setImages([]);
        setIssueType("damaged_item");

        // Navigate to order page with booking id
        navigate(`/order/${orderData.id}`);
      } else {
        toast.error(res?.data?.message || "Failed to submit dispute");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Loading UI
  // if (loading) {
  //   return (
  //     <div className="flex justify-center items-center h-[50vh]">
  //       Loading...
  //     </div>
  //   );
  // }

  // ❌ No data
  if (!orderData) {
    return <div className="text-center mt-10">Order not found</div>;
  }
  
  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* HEADER */}
      <h1 className="text-xl font-semibold text-foreground">Report an Issue</h1>

      {/* ORDER SUMMARY */}
      <Card>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 py-5 text-sm">
          <div>
            <p className="text-muted-foreground">Order</p>
            <p className="font-medium">
              {" "}
              {orderData.order_id || `#${orderData.id}`}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">Provider</p>
            <p className="font-medium"> {orderData.provider?.business_name}</p>
          </div>

          <div>
            <p className="text-muted-foreground">Service Type</p>
            <p className="font-medium"> {orderData.order_type}</p>
          </div>

          <div>
            <p className="text-muted-foreground">Order Date</p>
            <p className="font-medium">
              {new Date(orderData.booking_date).toLocaleDateString()}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">Order Status</p>
            <span className="inline-block mt-1 px-3 py-1 text-xs rounded-full bg-green-100 text-green-600">
              {orderData.status}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* FORM */}
      <Card>
        <CardContent className="py-6 space-y-6">
          <div>
            <h2 className="font-medium text-foreground">
              Need help with your order?
            </h2>
            <p className="text-sm text-muted-foreground">
              Tell us what went wrong and we will review your request within 24
              hours.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* LEFT SIDE */}
            <div className="space-y-4">
              {/* Issue Type */}
              <div>
                <label className="text-sm font-medium">Issue Type</label>
                <select
                  className="mt-1 w-full h-10 rounded-md border px-3 text-sm"
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                >
                  <option value="damaged_item">Damaged Items</option>
                  <option value="late_delivery">Late Delivery</option>
                  <option value="missing_item">Missing Items</option>
                  <option value="wrong_service">Wrong Service</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium">
                  Describe the issue
                </label>
                <textarea
                  placeholder="Please provide details about what happened"
                  className="mt-1 w-full rounded-md border p-3 text-sm min-h-[120px]"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div>
              <label className="text-sm font-medium">
                Upload Photos (if applicable)
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Instruction: Add photos to help us review your issue faster
              </p>

              <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  accept=".jpeg,.jpg,.png,.webp,.heic,.heif"
                  id="upload"
                  onChange={handleImageUpload}
                />
                <label htmlFor="upload" className="cursor-pointer">
                  <Upload className="mx-auto text-muted-foreground" />
                  <p className="text-sm mt-2">Click or drag files to upload</p>
                </label>
              </div>
              {/* <div className="flex gap-2 mt-3 flex-wrap">
                {images.map((file, i) => (
                  <img
                    key={i}
                    src={URL.createObjectURL(file)}
                    className="h-16 w-16 object-cover rounded"
                  />
                ))}
              </div> */}

{/* Preview uploaded images */}
  <div className="flex gap-2 mt-3 flex-wrap">
    {images.map((file, i) => (
      <div key={i} className="relative group">
        <img
          src={URL.createObjectURL(file)}
          className="h-16 w-16 object-cover rounded"
        />
        {/* ❌ Remove button */}
        <button
          type="button"
          onClick={() => handleRemoveImage(i)}
          className="
            absolute -top-2 -right-2
            bg-red-500 hover:bg-red-600
            text-white
            rounded-full
            w-5 h-5
            flex items-center justify-center
            shadow-md
            opacity-100 md:opacity-0 md:group-hover:opacity-100
            transition
          "
        >
          X
        </button>
      </div>
    ))}
  </div>

            </div>
          </div>
        </CardContent>
      </Card>

      {/* REVIEW PROCESS */}
      <Card>
        <CardContent className="py-5 space-y-4">
          <h3 className="font-medium">Review Process</h3>

          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
            <li>Your report will be reviewed within 24 hours</li>
            <li>Payment may be temporarily paused during review</li>
            <li>We may contact you for additional information if needed</li>
          </ul>

          <div className="bg-muted px-4 py-2 rounded-md text-sm text-muted-foreground w-fit">
            Issues must be reported within 24 hours of order completion
          </div>

          <Button className="mt-2" onClick={handleSubmit}>
            Submit Issue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportIssue;
