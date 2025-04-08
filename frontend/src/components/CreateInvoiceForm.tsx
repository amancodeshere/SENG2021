import { useState } from "react";
import { createInvoice } from "@/lib/api";
import { useNavigate } from "react-router-dom";

export default function CreateInvoiceForm({ reloadInvoices }: { reloadInvoices: () => void }) {
  const navigate = useNavigate();
  const [xmlData, setXmlData] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionId = Number(localStorage.getItem("token"));

  const handleSubmit = async () => {
    setLoading(true);
    const response = await createInvoice(sessionId, xmlData);
    if (response.invoiceId) {
      reloadInvoices();
      navigate(`/invoices/${response.invoiceId}`);
    } else {
      alert(response.error || "Failed to create invoice");
    }
    setLoading(false);
  };

  return (
    <div>
      <h3>Create Invoice</h3>
      <textarea
        placeholder="Paste Order XML here"
        value={xmlData}
        onChange={(e) => setXmlData(e.target.value)}
      />
      <button disabled={loading} onClick={handleSubmit}>
        {loading ? "Creating..." : "Create Invoice"}
      </button>
    </div>
  );
}
