// CreateSupportAgent.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

import { sanitizePhoneInput } from "@/utils/format";

const CreateSupportAgent = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    const val = name === "phone" ? sanitizePhoneInput(value) : value;
    setForm({ ...form, [name]: val });
  };

  const handleSubmit = () => {
    console.log("NEW AGENT:", form);

    // 👉 later replace with API
    navigate("/admin/support-agents");
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Create Support Agent</h1>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input
            name="firstName"
            placeholder="First Name"
            className="border p-2 rounded-md"
            onChange={handleChange}
          />
          <input
            name="lastName"
            placeholder="Last Name"
            className="border p-2 rounded-md"
            onChange={handleChange}
          />
        </div>

        <input
          name="email"
          placeholder="Email"
          className="border p-2 rounded-md w-full"
          onChange={handleChange}
        />

        <input
          name="phone"
          placeholder="Phone Number"
          className="border p-2 rounded-md w-full"
          onChange={handleChange}
        />

        <Button className="w-full" onClick={handleSubmit}>
          Register Support Agent
        </Button>
      </div>
    </div>
  );
};

export default CreateSupportAgent;
