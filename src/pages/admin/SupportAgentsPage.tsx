import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, X } from "lucide-react";
import { useEffect } from "react";
import toast from "react-hot-toast";
import {
  getSupportAgents,
  registerSupportAgent,
  updateSupportAgent,
} from "@/services/support.service";
import Spinner from "@/components/ui/spinner";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { formatDate, formatPhone } from "@/utils/format";
import PaginationController from "@/components/ui/PaginationController";

interface Agent {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
  status: "Active" | "Inactive";
}

const SupportAgentsPage = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [errors, setErrors] = useState<any>({});
  const [apiError, setApiError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });


  const handleChange = (e: any) => {
    const { name, value } = e.target;

    let updatedValue = value;

    // 🔥 Phone handling
    if (name === "phone") {
      updatedValue = value.replace(/\D/g, "").slice(0, 10); // only digits + max 10
    }

    setForm({ ...form, [name]: updatedValue });

    setErrors((prev: any) => ({
      ...prev,
      [name]: "",
    }));
  };
  
  const validate = () => {
    let err: any = {};

    if (!form.firstName.trim()) {
      err.firstName = "First name is required";
    }
    if (!form.lastName.trim()) {
      err.lastName = "Last name is required";
    }

    if (!form.email.trim()) {
      err.email = "Email is required";
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(form.email)
    ) {
      err.email = "Invalid email format";
    }

    if (!form.phone.trim()) {
      err.phone = "Phone Number is required";
    }
    // else if (!/^\d{10}$/.test(form.phone)) {
    //   err.phone = "Enter valid 10 digit number";
    // }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async () => {
      if (!validate()) {
        toast.error("Please fill all required fields.");
        return;
      }
    try {
      // setSubmitLoading(true);
      setApiError(""); // reset
      await toast.promise(
       registerSupportAgent({
         first_name: form.firstName,
         last_name: form.lastName,
         email: form.email,
         phone: form.phone,
         password: "123456",
       }),
       {
         loading: "Creating agent...",
         success: "Support agent created.",
         error: (err) =>
           err?.response?.data?.message || "Failed to create agent.",
       },
     );

      fetchAgents(currentPage); // refresh
      handleClose();
      setErrors({});
    } catch (err: any) {
      console.log("error : ", err);

      // 🔥 backend error message show
      const msg =
        err?.response?.data?.message ||
        "Something went wrong. Please try again";

      // setApiError(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const toggleStatus = async (agent: Agent) => {
    try {
      const newStatus = agent.status === "Active" ? "inactive" : "active";

    await toast.promise(
      updateSupportAgent(agent.id, {
        status: newStatus,
      }),
      {
        loading: "Updating status...",
        success: "Status updated successfully.",
        error: (err) =>
          err?.response?.data?.message || "Failed to update status.",
      },
    );

      // ✅ table update
      fetchAgents(currentPage);

      // ✅ modal me bhi turant change dikhana
      if (selectedAgent?.id === agent.id) {
        setSelectedAgent({
          ...agent,
          status: newStatus === "active" ? "Active" : "Inactive",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };
  const toCapitalCase = (str) => {
    return str
      ?.toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  useEffect(() => {
    fetchAgents(currentPage);
  }, [currentPage]);

  const fetchAgents = async (page) => {
    try {
      setSubmitLoading(true);

      const res = await getSupportAgents({
        page,
        limit: 10,
      });

      // 🔥 map backend → frontend
      const formatted = res.data.map((a: any) => ({
        id: a.id,
        firstName: a.first_name,
        lastName: a.last_name,
        email: a.email,
        phone: a.phone,
        createdAt: formatDate(a.created_at), //  FIX HERE
        status: a.status === "active" ? "Active" : "Inactive",
      }));

      const formatPhone = (phone: string) => {
        if (!phone) return "";

        const cleaned = phone.replace(/\D/g, "");

        if (cleaned.length === 10) {
          return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
        }

        if (cleaned.length > 10) {
          const country = cleaned.slice(0, cleaned.length - 10);
          const main = cleaned.slice(-10);

          return `+${country} ${main.replace(
            /(\d{3})(\d{3})(\d{4})/,
            "$1-$2-$3",
          )}`;
        }

        return phone;
      };

      setAgents(formatted);
      setCurrentPage(res?.currentPage || 1);
      setTotalPages(res?.totalPages || 1);
    } catch (err) {
      console.error(err);
       toast.error("Failed to load support agents.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);

    // 🔥 reset form
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    });

    // 🔥 reset errors
    setErrors({});
    setApiError("");
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchAgents(page);
  };

  return (
    <div className="space-y-6 ">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Support Agent Management</h1>

        <Button onClick={() => setOpen(true)}>+ Add Agent</Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        {agents.length > 0 ? (
          <>
            <table className="w-full text-sm">
              <thead className="bg-white text-left text-gray-400">
                <tr>
                  <th className="p-3">Agent Name</th>
                  <th className="p-3">Created Date</th>
                  <th className="p-3">Email Id</th>
                  <th className="p-3">Phone Number</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="bg-white">
                {agents.map((agent) => (
                  <tr key={agent.id} className="border-t">
                    <td className="p-3">
                      {toCapitalCase(agent.firstName)} {toCapitalCase(agent.lastName)}
                    </td>
                    <td className="p-3">{agent.createdAt}</td>
                    <td className="p-3">{agent.email}</td>
                    <td className="p-3">{formatPhone(agent.phone)}</td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          agent.status === "Active"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-500"
                        }`}
                      >
                        {agent.status}
                      </span>
                    </td>

                    <td className="p-3 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleStatus(agent)}
                        className={
                          agent.status === "Active"
                            ? "text-red-500 border-red-500 hover:bg-red-50 hover:text-red-500"
                            : "text-green-600 border-green-600 hover:bg-green-50 hover:text-green-600"
                        }
                      >
                        {agent.status === "Active" ? "Inactive" : "Active"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="p-4 border-t">
              <PaginationController
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-500">
            <Users size={28} className="opacity-50" />
            <p className="text-sm font-medium">No support agents found</p>
            <p className="text-xs text-gray-400">
              Click “Add Agent” to create your first support agent
            </p>
          </div>
        )}
      </div>

      {/* 🔥 Modal */}
      {open && (
        <div className="fixed inset-0 z-[9999] m-0 !mt-0 flex items-center justify-center bg-black/70">
          {" "}
          {/* Modal */}
          <div className="relative w-full max-w-sm rounded-xl bg-white px-6 py-7 shadow-xl">
            {" "}
            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute right-5 top-5 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            {/* Icon */}
            <div className="flex justify-center mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
                <Users size={20} />
              </div>
            </div>
            {/* Title */}
            <h1 className="text-center text-xl font-bold text-gray-800">
              Create Support Agent
            </h1>
            <p className="text-center text-xs text-gray-500 mb-4">
              Unik Clean — Handled with care
            </p>
            {/* FORM */}
            <div className="space-y-5">
              {/* Names */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    First Name <span className="text-red-500"> *</span>
                  </label>
                  <input
                    name="firstName"
                    placeholder="Ron"
                    className="mt-1 h-9 w-full rounded-md border border-gray-200 px-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    value={form.firstName}
                    onChange={handleChange}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-500">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Last Name <span className="text-red-500"> *</span>
                  </label>
                  <input
                    name="lastName"
                    placeholder="Cruise"
                    className="mt-1 h-9 w-full rounded-md border border-gray-200 px-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    value={form.lastName}
                    onChange={handleChange}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-500">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-medium text-gray-600">
                  Email <span className="text-red-500"> *</span>
                </label>
                <input
                  name="email"
                  placeholder="agent@unikclean.com"
                  className="mt-1 h-9 w-full rounded-md border border-gray-200 px-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-medium text-gray-600">
                  Phone Number <span className="text-red-500"> *</span>
                </label>
                <PhoneInput
                  country={"in"}
                  value={form.phone}
                  onChange={(value) => {
                    setForm((prev) => ({ ...prev, phone: value }));

                    setErrors((prev: any) => ({
                      ...prev,
                      phone: "",
                    }));
                  }}
                  containerClass="w-full mt-1"
                  inputClass={`!w-full !h-9 !text-xs !rounded-md !bg-white !border !border-gray-200 !px-2 !pl-12 focus:!ring-1 focus:!ring-primary ${
                    errors.phone ? "!border-red-500" : ""
                  }`}
                  buttonClass="!border-gray-200 !bg-white"
                  dropdownClass="!text-xs"
                />
                {errors.phone && (
                  <p className="text-xs text-red-500">{errors.phone}</p>
                )}
              </div>

              {apiError && (
                <div className="text-xs text-red-500 text-center bg-red-50 border border-red-200 p-2 rounded">
                  {apiError}
                </div>
              )}

              {/* Button */}
              <Button
                onClick={handleSubmit}
                disabled={submitLoading}
                className="w-full relative text-xs"
              >
                {/* Text */}
                <span className={submitLoading ? "opacity-0" : "opacity-100"}>
                  Register Support Agent
                </span>

                {/* Spinner */}
                {submitLoading && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Spinner size={14} />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      {viewOpen && selectedAgent && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            {/* Close */}
            <button
              onClick={() => setViewOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            {/* Title */}
            <h2 className="text-lg font-semibold mb-6">
              Support Agent Details
            </h2>

            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Full Name</p>
                <p className="font-medium">
                  {selectedAgent.firstName} {selectedAgent.lastName}
                </p>
              </div>

              <div>
                <p className="text-gray-500 text-xs">Email ID</p>
                <p className="font-medium">{selectedAgent.email}</p>
              </div>

              <div>
                <p className="text-gray-500 text-xs">Mobile Number</p>
                <p className="font-medium">
                  {formatPhone(selectedAgent.phone)}
                </p>
              </div>

              <div>
                <p className="text-gray-500 text-xs">Status</p>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    selectedAgent.status === "Active"
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-500"
                  }`}
                >
                  {selectedAgent.status}
                </span>
              </div>
            </div>

            {/* Toggle button */}
            <div className="flex justify-end mt-6">
              <Button
                onClick={() => selectedAgent && toggleStatus(selectedAgent)}
                className={
                  selectedAgent.status === "Active"
                    ? "text-red-500 border-red-500 hover:bg-red-50"
                    : "text-green-600 border-green-600 hover:bg-green-50"
                }
                variant="outline"
              >
                {selectedAgent.status === "Active" ? "Inactive" : "Active"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportAgentsPage;
