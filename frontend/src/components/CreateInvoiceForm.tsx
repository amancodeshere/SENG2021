import { useState } from "react";
import { Button } from "../components/ui/button";

interface CreateInvoiceFormProps {
  reloadInvoices?: () => void;
  onSuccess?: () => Promise<void>;
  sessionId: string;
  setActiveTab?: (tab: string) => void;
}

export default function CreateInvoiceForm({ 
  reloadInvoices, 
  onSuccess,
  sessionId, 
  setActiveTab 
}: CreateInvoiceFormProps) {
  const [xmlData, setXmlData] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => {
    if (!xmlData.trim()) {
      alert("Please enter XML data");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/v2/invoice/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/xml",
          sessionid: sessionId,
        },
        body: xmlData,
      });

      const data = await response.json();
      
      if (data.invoiceId) {
        if (reloadInvoices) reloadInvoices();
        if (onSuccess) await onSuccess();
        if (setActiveTab) setActiveTab("invoice-list");
        
        // Alert success
        alert(`Invoice created successfully! Invoice ID: ${data.invoiceId}`);
      } else {
        alert(data.error || "Failed to create invoice");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert("An error occurred while creating the invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-ocean-900 mb-2">Create New Invoice</h3>
        <p className="text-sm text-ocean-600 mb-4">
          Paste your invoice XML data below to create a new invoice.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="xml-data" className="block text-sm font-medium text-ocean-700">
          Invoice XML Data
        </label>
        <textarea
          id="xml-data"
          className="w-full min-h-[300px] p-3 border border-ocean-200 rounded-md focus:border-ocean-500 focus:ring-ocean-500"
          placeholder="Paste Invoice XML here"
          value={xmlData}
          onChange={(e) => setXmlData(e.target.value)}
        />
      </div>

      <Button
        className="bg-ocean-600 hover:bg-ocean-700 w-full sm:w-auto"
        disabled={loading}
        onClick={handleSubmit}
      >
        {loading ? "Creating Invoice..." : "Create Invoice"}
      </Button>
    </div>
  );
}
